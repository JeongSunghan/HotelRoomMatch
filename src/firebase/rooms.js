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

export async function selectRoom(roomNumber, guestData, maxCapacity = 2) {
    if (!database) return false;

    const roomRef = ref(database, `rooms/${roomNumber}/guests`);

    // Transaction을 사용하여 race condition 방지
    await runTransaction(roomRef, (currentGuests) => {
        // 현재 게스트 목록 정규화
        if (!currentGuests) {
            currentGuests = [];
        } else if (!Array.isArray(currentGuests)) {
            currentGuests = Object.values(currentGuests);
        }

        // 이미 등록된 사용자인지 확인
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
