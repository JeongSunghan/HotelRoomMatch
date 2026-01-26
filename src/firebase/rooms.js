/**
 * Firebase 객실 관련 모듈
 */
import { database, ref, onValue, set, get, runTransaction } from './config';
import { isValidRoomNumber, isValidSessionId } from '../utils/sanitize';

export function subscribeToRooms(callback) {
    if (!database) {
        callback({});
        return () => { };
    }

    const roomsRef = ref(database, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
        const data = snapshot.val() || {};
        callback(data);
    });

    return unsubscribe;
}

/**
 * 방 선택 (서버 측 검증 강화)
 * @param {string} roomNumber - 방 번호
 * @param {Object} guestData - 게스트 데이터 (sessionId, gender 필수)
 * @param {number} maxCapacity - 최대 정원
 * @param {string} roomGender - 방의 성별 (M/F)
 */
export async function selectRoom(roomNumber, guestData, maxCapacity = 2, roomGender = null) {
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
    const allRooms = allRoomsSnapshot.val() || {};

    for (const [existingRoom, roomInfo] of Object.entries(allRooms)) {
        let guests = roomInfo.guests || [];
        if (!Array.isArray(guests)) {
            guests = Object.values(guests);
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
        if (!currentGuests) {
            currentGuests = [];
        } else if (!Array.isArray(currentGuests)) {
            currentGuests = Object.values(currentGuests);
        }

        // 이미 이 방에 등록된 사용자인지 확인
        if (currentGuests.some(g => g.sessionId === guestData.sessionId)) {
            return undefined;
        }

        // 정원 초과 확인
        if (currentGuests.length >= maxCapacity) {
            return undefined;
        }

        // 새 게스트 추가
        return [...currentGuests, guestData];
    }).then((result) => {
        if (!result.committed) {
            throw new Error('객실 선택에 실패했습니다. 이미 등록되었거나 정원이 찼습니다.');
        }
    });

    return true;
}

export async function removeGuestFromRoom(roomNumber, sessionId) {
    if (!database) return false;

    const roomRef = ref(database, `rooms/${roomNumber}/guests`);
    const snapshot = await get(roomRef);
    let currentGuests = snapshot.val() || [];

    if (currentGuests && !Array.isArray(currentGuests)) {
        currentGuests = Object.values(currentGuests);
    }

    const updatedGuests = currentGuests.filter(g => g.sessionId !== sessionId);
    await set(roomRef, updatedGuests.length > 0 ? updatedGuests : null);

    // 방에서 제거된 유저의 selectedRoom과 locked 상태도 함께 초기화
    const userRef = ref(database, `users/${sessionId}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val();

    if (userData && userData.selectedRoom === roomNumber) {
        await set(userRef, {
            ...userData,
            selectedRoom: null,
            locked: false,
            removedAt: Date.now()
        });
    }

    return true;
}

/**
 * 특정 방에 게스트가 존재하는지 확인 (세션 유효성 검증용)
 * @param {string} roomNumber - 방 번호
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<boolean>} 존재 여부
 */
export async function checkGuestInRoom(roomNumber, sessionId) {
    if (!database) return false;

    const roomRef = ref(database, `rooms/${roomNumber}/guests`);
    const snapshot = await get(roomRef);
    const currentGuests = snapshot.val() || [];

    let guests = currentGuests;
    if (guests && !Array.isArray(guests)) {
        guests = Object.values(guests);
    }

    return guests.some(g => g.sessionId === sessionId);
}

/**
 * 게스트 정보 수정
 * @param {string} roomNumber - 방 번호
 * @param {string} sessionId - 세션 ID
 * @param {Object} newData - 수정할 데이터 (name, company, age 등)
 */
export async function updateGuestInfo(roomNumber, sessionId, newData) {
    if (!database) return false;

    const roomRef = ref(database, `rooms/${roomNumber}/guests`);
    const snapshot = await get(roomRef);
    let currentGuests = snapshot.val() || [];

    if (currentGuests && !Array.isArray(currentGuests)) {
        currentGuests = Object.values(currentGuests);
    }

    const guestIndex = currentGuests.findIndex(g => g.sessionId === sessionId);
    if (guestIndex === -1) {
        throw new Error('해당 유저를 찾을 수 없습니다.');
    }

    // 기존 데이터 유지하면서 수정할 필드만 업데이트
    currentGuests[guestIndex] = {
        ...currentGuests[guestIndex],
        ...newData,
        updatedAt: Date.now()
    };

    await set(roomRef, currentGuests);
    return true;
}

/**
 * 중복 이름 체크 (전체 방 대상)
 * @param {string} name - 체크할 이름
 * @param {string} excludeSessionId - 제외할 세션 ID (수정 시 자기 자신 제외)
 * @returns {Promise<{isDuplicate: boolean, roomNumber: string|null}>}
 */
export async function checkDuplicateName(name, excludeSessionId = null) {
    if (!database) return { isDuplicate: false, roomNumber: null };

    const allRoomsRef = ref(database, 'rooms');
    const snapshot = await get(allRoomsRef);
    const allRooms = snapshot.val() || {};

    for (const [roomNumber, roomInfo] of Object.entries(allRooms)) {
        let guests = roomInfo.guests || [];
        if (!Array.isArray(guests)) {
            guests = Object.values(guests);
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

