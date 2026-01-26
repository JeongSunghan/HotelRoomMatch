/**
 * Firebase 객실 관련 모듈
 */
import { database, ref, onValue, set, get, runTransaction, update } from './config';
import { isValidRoomNumber, isValidSessionId } from '../utils/sanitize';
import { roomData as staticRoomData } from '../data/roomData';

const RESERVATION_TTL_MS = 60 * 1000;

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

    // 1-1. 임시 예약(reserved) 검증 (서버 측)
    // 왜: UI 차단은 편의일 뿐이고, 최종 확정 시 DB에서도 충돌을 막아야 함.
    {
        const reservationRef = ref(database, `rooms/${roomNumber}/reservation`);
        const snap = await get(reservationRef);
        const r = snap.val();
        const now = Date.now();
        if (r?.expiresAt && Number(r.expiresAt) > now && r.reservedBy && r.reservedBy !== guestData.sessionId) {
            const remainingSec = Math.max(1, Math.ceil((Number(r.expiresAt) - now) / 1000));
            throw new Error(`다른 사용자가 객실을 선택 중입니다. (${remainingSec}초 후 재시도)`);
        }
    }

    // 2. 이미 다른 방에 배정되어 있는지 확인 (서버 측)
    const allRoomsRef = ref(database, 'rooms');
    const allRoomsSnapshot = await get(allRoomsRef);
    const allRooms = allRoomsSnapshot.val() || {};
    const allowedRoomSet = new Set(Object.keys(staticRoomData));

    for (const [existingRoom, roomInfo] of Object.entries(allRooms)) {
        // 왜: roomData에서 제외된(구버전) 객실이 DB에 남아있어도 신규 배정을 막지 않도록 필터링
        if (!allowedRoomSet.has(String(existingRoom))) continue;
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

    // 4. 확정 성공 시 예약 해제(베스트 에포트)
    try {
        await set(ref(database, `rooms/${roomNumber}/reservation`), null);
    } catch (_) {
        // ignore
    }

    return true;
}

/**
 * 60초 임시 예약(reserved) 생성
 * - rooms/{roomNumber}/reservation 에 transaction으로 설정
 * - 이미 다른 사람이 예약 중이면 실패
 *
 * @returns {Promise<{ok: boolean, reservation?: {reservedBy: string, reservedAt: number, expiresAt: number}}>}
 */
export async function reserveRoom(roomNumber, sessionId, ttlMs = RESERVATION_TTL_MS) {
    if (!database) throw new Error('Firebase not initialized');

    if (!isValidRoomNumber(String(roomNumber))) {
        throw new Error('유효하지 않은 방 번호입니다.');
    }
    if (!isValidSessionId(String(sessionId))) {
        throw new Error('유효하지 않은 세션입니다.');
    }

    const now = Date.now();
    const expiresAt = now + ttlMs;
    const reservationRef = ref(database, `rooms/${roomNumber}/reservation`);

    const tx = await runTransaction(reservationRef, (current) => {
        if (current?.expiresAt && Number(current.expiresAt) > now && current.reservedBy && current.reservedBy !== sessionId) {
            return; // abort
        }
        return {
            reservedBy: sessionId,
            reservedAt: now,
            expiresAt,
        };
    });

    if (!tx.committed) {
        // 현재 예약 정보 조회(안내용)
        const snap = await get(reservationRef);
        const r = snap.val();
        return { ok: false, reservation: r || undefined };
    }

    return { ok: true, reservation: { reservedBy: sessionId, reservedAt: now, expiresAt } };
}

/**
 * 임시 예약 해제
 * - 예약자가 본인(sessionId)일 때만 삭제
 */
export async function releaseRoomReservation(roomNumber, sessionId) {
    if (!database) return false;

    const reservationRef = ref(database, `rooms/${roomNumber}/reservation`);
    const snap = await get(reservationRef);
    const r = snap.val();

    if (r?.reservedBy && r.reservedBy !== sessionId) {
        return false;
    }

    await set(reservationRef, null);
    return true;
}

/**
 * roomData 기준으로 rooms 노드를 정리/생성 (관리자용)
 * - 누락된 방: rooms/{roomId}/guests = [] 생성
 * - roomData에 없는 방: guests가 비어있으면 rooms/{roomId} 삭제
 *
 * @returns {Promise<{created: number, deletedEmpty: number, skippedWithGuests: number}>}
 */
export async function syncRoomsFromStaticRoomData() {
    if (!database) throw new Error('Firebase not initialized');

    const allowed = new Set(Object.keys(staticRoomData));
    const roomsRef = ref(database, 'rooms');
    const snapshot = await get(roomsRef);
    const current = snapshot.val() || {};

    let created = 0;
    let deletedEmpty = 0;
    let skippedWithGuests = 0;

    const updates = {};

    // create/ensure
    for (const roomId of allowed) {
        const existing = current[roomId];
        if (!existing) {
            updates[`${roomId}/guests`] = [];
            created++;
            continue;
        }
        if (!Object.prototype.hasOwnProperty.call(existing, 'guests')) {
            updates[`${roomId}/guests`] = [];
        }
    }

    // delete obsolete (empty only)
    for (const [roomId, roomInfo] of Object.entries(current)) {
        if (allowed.has(String(roomId))) continue;
        const guests = roomInfo?.guests;
        const list = Array.isArray(guests) ? guests : Object.values(guests || {});
        if (list.length === 0) {
            updates[String(roomId)] = null;
            deletedEmpty++;
        } else {
            skippedWithGuests++;
        }
    }

    if (Object.keys(updates).length > 0) {
        await update(roomsRef, updates);
    }

    return { created, deletedEmpty, skippedWithGuests };
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

