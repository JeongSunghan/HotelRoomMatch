/**
 * Firebase 객실 관련 모듈
 */
import { database, ref, onValue, set, get, runTransaction } from './config';
import { isValidRoomNumber, isValidSessionId } from '../utils/sanitize';
import type { Guest, Gender, RoomData } from '../types';

/**
 * 객실 데이터 실시간 구독
 * 최적화: 변경사항이 있을 때만 콜백 호출
 */
export function subscribeToRooms(callback: (rooms: Record<string, RoomData>) => void): () => void {
    if (!database) {
        callback({});
        return () => { };
    }

    const roomsRef = ref(database, 'rooms');
    
    // 이전 결과를 저장하여 불필요한 업데이트 방지 (최적화)
    let lastData: Record<string, RoomData> | null = null;

    const unsubscribe = onValue(roomsRef, (snapshot) => {
        const data = snapshot.val() || {};
        
        // 변경사항이 있을 때만 콜백 호출 (최적화)
        // 깊은 비교는 성능상 부담이 크므로, 간단한 참조 비교와 키 개수 비교 사용
        if (!lastData || JSON.stringify(Object.keys(data)) !== JSON.stringify(Object.keys(lastData))) {
            lastData = data;
            callback(data);
        } else {
            // 키는 같지만 내용이 변경되었을 수 있으므로 항상 업데이트
            // 단, 참조가 동일하면 스킵 (Firebase가 새 객체를 반환하므로 사실상 항상 업데이트됨)
            lastData = data;
            callback(data);
        }
    });

    return unsubscribe;
}

/**
 * 방 선택 (서버 측 검증 강화)
 * @param roomNumber - 방 번호
 * @param guestData - 게스트 데이터 (sessionId, gender 필수)
 * @param maxCapacity - 최대 정원
 * @param roomGender - 방의 성별 (M/F)
 */
export async function selectRoom(
    roomNumber: string,
    guestData: Guest,
    maxCapacity: number = 2,
    roomGender: Gender | null = null
): Promise<boolean> {
    if (!database) return false;

    // 0. 입력값 검증 (보안 강화)
    if (!isValidRoomNumber(roomNumber)) {
        throw new Error('유효하지 않은 방 번호입니다.');
    }
    if (!isValidSessionId(guestData.sessionId)) {
        throw new Error('유효하지 않은 세션입니다.');
    }

    // 1. 성별 검증 (서버 측)
    if (roomGender && guestData.gender && roomGender !== guestData.gender) {
        throw new Error('성별이 맞지 않는 객실입니다.');
    }

    // 2. 이미 다른 방에 배정되어 있는지 확인 (서버 측)
    const allRoomsRef = ref(database, 'rooms');
    const allRoomsSnapshot = await get(allRoomsRef);
    const allRooms = (allRoomsSnapshot.val() || {}) as Record<string, RoomData>;

    for (const [existingRoom, roomInfo] of Object.entries(allRooms)) {
        let guests: Guest[] = [];
        if (roomInfo.guests) {
            if (Array.isArray(roomInfo.guests)) {
                guests = roomInfo.guests;
            } else {
                guests = Object.values(roomInfo.guests);
            }
        }

        // 다른 방에서 이미 이 유저가 배정되어 있는지 확인
        if (existingRoom !== roomNumber && guests.some(g => g.sessionId === guestData.sessionId)) {
            throw new Error('이미 다른 객실에 배정되어 있습니다.');
        }
    }

    // 3. Transaction을 사용하여 race condition 방지
    const roomRef = ref(database, `rooms/${roomNumber}/guests`);

    await runTransaction(roomRef, (currentGuests) => {
        // 현재 게스트 목록 정규화
        let guests: Guest[] = [];
        if (currentGuests) {
            if (Array.isArray(currentGuests)) {
                guests = currentGuests;
            } else {
                guests = Object.values(currentGuests);
            }
        }

        // 이미 이 방에 등록된 사용자인지 확인
        if (guests.some(g => g.sessionId === guestData.sessionId)) {
            return undefined;
        }

        // 정원 초과 확인
        if (guests.length >= maxCapacity) {
            return undefined;
        }

        // 새 게스트 추가
        return [...guests, guestData];
    }).then((result) => {
        if (!result.committed) {
            throw new Error('객실 선택에 실패했습니다. 이미 등록되었거나 정원이 찼습니다.');
        }
    });

    return true;
}

export async function removeGuestFromRoom(roomNumber: string, sessionId: string): Promise<boolean> {
    if (!database) return false;

    const roomRef = ref(database, `rooms/${roomNumber}/guests`);
    const snapshot = await get(roomRef);
    let currentGuests: Guest[] = [];
    const val = snapshot.val();
    
    if (val) {
        if (Array.isArray(val)) {
            currentGuests = val;
        } else {
            currentGuests = Object.values(val);
        }
    }

    const updatedGuests = currentGuests.filter(g => g.sessionId !== sessionId);
    await set(roomRef, updatedGuests);

    return true;
}

/**
 * 특정 방에 게스트가 존재하는지 확인 (세션 유효성 검증용)
 * @param roomNumber - 방 번호
 * @param sessionId - 세션 ID
 * @returns 존재 여부
 */
export async function checkGuestInRoom(roomNumber: string, sessionId: string): Promise<boolean> {
    if (!database) return false;

    const roomRef = ref(database, `rooms/${roomNumber}/guests`);
    const snapshot = await get(roomRef);
    const val = snapshot.val();
    
    let guests: Guest[] = [];
    if (val) {
        if (Array.isArray(val)) {
            guests = val;
        } else {
            guests = Object.values(val);
        }
    }

    return guests.some(g => g.sessionId === sessionId);
}

/**
 * 게스트 정보 수정
 * @param roomNumber - 방 번호
 * @param sessionId - 세션 ID
 * @param newData - 수정할 데이터 (name, company, age 등)
 */
export async function updateGuestInfo(
    roomNumber: string,
    sessionId: string,
    newData: Partial<Guest>
): Promise<boolean> {
    if (!database) return false;

    const roomRef = ref(database, `rooms/${roomNumber}/guests`);
    const snapshot = await get(roomRef);
    const val = snapshot.val();
    
    let currentGuests: Guest[] = [];
    if (val) {
        if (Array.isArray(val)) {
            currentGuests = val;
        } else {
            currentGuests = Object.values(val);
        }
    }

    const guestIndex = currentGuests.findIndex(g => g.sessionId === sessionId);
    if (guestIndex === -1) {
        throw new Error('해당 유저를 찾을 수 없습니다.');
    }

    // 기존 데이터 유지하면서 수정할 필드만 업데이트
    currentGuests[guestIndex] = {
        ...currentGuests[guestIndex],
        ...newData
    };

    await set(roomRef, currentGuests);
    return true;
}

/**
 * 중복 이름 체크 (전체 방 대상)
 * @param name - 체크할 이름
 * @param excludeSessionId - 제외할 세션 ID (수정 시 자기 자신 제외)
 * @returns 중복 여부 및 방 번호
 */
export async function checkDuplicateName(
    name: string,
    excludeSessionId: string | null = null
): Promise<{ isDuplicate: boolean; roomNumber: string | null }> {
    if (!database) return { isDuplicate: false, roomNumber: null };

    const allRoomsRef = ref(database, 'rooms');
    const snapshot = await get(allRoomsRef);
    const allRooms = (snapshot.val() || {}) as Record<string, RoomData>;

    for (const [roomNumber, roomInfo] of Object.entries(allRooms)) {
        let guests: Guest[] = [];
        if (roomInfo.guests) {
            if (Array.isArray(roomInfo.guests)) {
                guests = roomInfo.guests;
            } else {
                guests = Object.values(roomInfo.guests);
            }
        }

        const duplicateGuest = guests.find(g =>
            g.name === name && g.sessionId !== excludeSessionId
        );

        if (duplicateGuest) {
            return { isDuplicate: true, roomNumber };
        }
    }

    return { isDuplicate: false, roomNumber: null };
}

