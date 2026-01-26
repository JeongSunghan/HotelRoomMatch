/**
 * Firebase 객실 관련 모듈
 */
import { database, ref, onValue, set, get, runTransaction, update } from './config';
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
    await set(roomRef, updatedGuests);

    // 해당 유저의 대기 중인 변경/취소 요청 자동 해결 처리
    try {
        const requestsRef = ref(database, 'roomChangeRequests');
        const requestsSnapshot = await get(requestsRef);
        const requests = requestsSnapshot.val() || {};

        const updates = {};
        let hasUpdates = false;

        for (const [requestId, request] of Object.entries(requests)) {
            if (request.sessionId === sessionId && request.status === 'pending') {
                updates[`roomChangeRequests/${requestId}/status`] = 'resolved';
                updates[`roomChangeRequests/${requestId}/resolvedAt`] = Date.now();
                updates[`roomChangeRequests/${requestId}/adminNote`] = '관리자에 의한 방 배정 취소';
                hasUpdates = true;
            }
        }

        if (hasUpdates) {
            await update(ref(database), updates);
        }
    } catch (error) {
        console.error('요청 자동 해결 처리 실패:', error);
        // 메인 로직은 성공했으므로 에러 무시
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

// ============================================
// 객실 예약 시스템 (동시 선택 방지)
// ============================================

/**
 * 예약 타입 상수
 */
export const RESERVATION_TYPE = {
    SELECTION_PENDING: 'selection_pending',  // 객실 선택 진행 중 (60초)
    ROOMMATE_INVITE: 'roommate_invite'       // 룸메이트 초대 대기 (5분)
};

/**
 * 예약 타임아웃 (밀리초)
 */
export const RESERVATION_TIMEOUT = {
    SELECTION: 60 * 1000,         // 60초
    ROOMMATE_INVITE: 5 * 60 * 1000  // 5분
};

/**
 * 객실 예약 생성 (Transaction 사용)
 * @param {string} roomNumber - 방 번호
 * @param {string} sessionId - 예약자 세션 ID
 * @param {string} type - 예약 타입 (RESERVATION_TYPE)
 * @param {Object} options - 추가 옵션 { reservedFor, userName }
 * @returns {Promise<{success: boolean, message?: string, existingReservation?: Object}>}
 */
export async function createRoomReservation(roomNumber, sessionId, type, options = {}) {
    if (!database) return { success: false, message: 'Database not initialized' };

    if (!isValidRoomNumber(roomNumber)) {
        return { success: false, message: '유효하지 않은 방 번호입니다.' };
    }

    const reservationRef = ref(database, `rooms/${roomNumber}/reservation`);
    const now = Date.now();
    const timeout = type === RESERVATION_TYPE.ROOMMATE_INVITE
        ? RESERVATION_TIMEOUT.ROOMMATE_INVITE
        : RESERVATION_TIMEOUT.SELECTION;

    try {
        const result = await runTransaction(reservationRef, (currentReservation) => {
            // 기존 예약이 있는 경우
            if (currentReservation) {
                // 만료되지 않은 다른 사람의 예약이 있으면 실패
                if (currentReservation.expiresAt > now &&
                    currentReservation.reservedBy !== sessionId) {
                    return undefined; // Transaction 중단
                }
                // 만료되었거나 본인 예약이면 덮어쓰기
            }

            // 새 예약 생성
            return {
                type,
                reservedBy: sessionId,
                reservedFor: options.reservedFor || null,
                userName: options.userName || null,
                reservedAt: now,
                expiresAt: now + timeout
            };
        });

        if (!result.committed) {
            // Transaction이 중단됨 = 다른 예약 존재
            const snapshot = await get(reservationRef);
            const existing = snapshot.val();
            return {
                success: false,
                message: '다른 사용자가 이미 선택 중입니다.',
                existingReservation: existing
            };
        }

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * 객실 예약 상태 확인
 * @param {string} roomNumber - 방 번호
 * @returns {Promise<{isReserved: boolean, reservation?: Object, isExpired?: boolean}>}
 */
export async function checkRoomReservation(roomNumber) {
    if (!database) return { isReserved: false };

    const reservationRef = ref(database, `rooms/${roomNumber}/reservation`);
    const snapshot = await get(reservationRef);
    const reservation = snapshot.val();

    if (!reservation) {
        return { isReserved: false };
    }

    const now = Date.now();
    const isExpired = reservation.expiresAt <= now;

    if (isExpired) {
        // 만료된 예약은 자동 정리
        await set(reservationRef, null);
        return { isReserved: false, isExpired: true };
    }

    return {
        isReserved: true,
        reservation,
        remainingTime: reservation.expiresAt - now
    };
}

/**
 * 객실 예약 해제
 * @param {string} roomNumber - 방 번호
 * @param {string} sessionId - 요청자 세션 ID (본인 예약만 해제 가능)
 * @returns {Promise<boolean>}
 */
export async function releaseRoomReservation(roomNumber, sessionId) {
    if (!database) return false;

    const reservationRef = ref(database, `rooms/${roomNumber}/reservation`);
    const snapshot = await get(reservationRef);
    const reservation = snapshot.val();

    // 예약이 없거나 본인 예약이 아니면 무시
    if (!reservation || reservation.reservedBy !== sessionId) {
        return false;
    }

    await set(reservationRef, null);
    return true;
}

/**
 * 만료된 예약 일괄 정리
 * @returns {Promise<number>} 정리된 예약 수
 */
export async function cleanupExpiredReservations() {
    if (!database) return 0;

    const roomsRef = ref(database, 'rooms');
    const snapshot = await get(roomsRef);
    const rooms = snapshot.val() || {};

    const now = Date.now();
    let cleanedCount = 0;

    for (const [roomNumber, roomData] of Object.entries(rooms)) {
        if (roomData.reservation && roomData.reservation.expiresAt <= now) {
            const reservationRef = ref(database, `rooms/${roomNumber}/reservation`);
            await set(reservationRef, null);
            cleanedCount++;
        }
    }

    return cleanedCount;
}

/**
 * 특정 방의 예약 상태 실시간 구독
 * @param {string} roomNumber - 방 번호
 * @param {Function} callback - 콜백 함수 (reservation) => void
 * @returns {Function} unsubscribe 함수
 */
export function subscribeToRoomReservation(roomNumber, callback) {
    if (!database) {
        callback(null);
        return () => { };
    }

    const reservationRef = ref(database, `rooms/${roomNumber}/reservation`);

    return onValue(reservationRef, (snapshot) => {
        const reservation = snapshot.val();

        // 만료 체크
        if (reservation && reservation.expiresAt <= Date.now()) {
            // 만료된 예약은 null로 전달
            callback(null);
            // 자동 정리 (비동기)
            set(reservationRef, null).catch(() => { });
            return;
        }

        callback(reservation);
    });
}

/**
 * 전체 방 예약 상태 실시간 구독 (RoomCard 상태 표시용)
 * @param {Function} callback - 콜백 함수 (reservations: {[roomNumber]: reservation}) => void
 * @returns {Function} unsubscribe 함수
 */
export function subscribeToAllReservations(callback) {
    if (!database) {
        callback({});
        return () => { };
    }

    const roomsRef = ref(database, 'rooms');

    return onValue(roomsRef, (snapshot) => {
        const rooms = snapshot.val() || {};
        const now = Date.now();
        const reservations = {};

        for (const [roomNumber, roomData] of Object.entries(rooms)) {
            if (roomData.reservation && roomData.reservation.expiresAt > now) {
                reservations[roomNumber] = roomData.reservation;
            }
        }

        callback(reservations);
    });
}
