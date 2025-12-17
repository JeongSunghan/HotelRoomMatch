/**
 * Firebase 객실 관련 모듈
 */
import { database, ref, onValue, set, get, runTransaction } from './config';

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
    await set(roomRef, updatedGuests);

    return true;
}
