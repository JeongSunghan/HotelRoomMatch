/**
 * 현장(메일 미제공/접근 불가) 등록 게스트 추적(tempGuests)
 *
 * 목적:
 * - 관리자 "배정만"으로 만든 onsite guest를 나중에 OTP 등록유저(users)와 안전하게 치환(migration)하기 위함
 * - 이름/소속 기반 매칭은 동명이인 위험이 커서, tempGuestId를 단일 식별자로 사용
 */
import { database, ref, onValue, set, get, runTransaction, update } from './config';
import { ensureAnonymousAuth } from './authGuard';
import { isValidRoomNumber, isValidSessionId, sanitizeName, sanitizeCompany } from '../utils/sanitize';
import { roomData as staticRoomData } from '../data/roomData';
import { addHistory, HISTORY_ACTIONS } from './history';
import { getUser, updateUser } from './users';
import { removeGuestFromRoom } from './rooms';

function generateTempGuestId() {
    // 왜: admin-세션ID와 별도로 “마이그레이션용 단일 식별자”가 필요함 (동명이인/중복 대응)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `tg_${crypto.randomUUID()}`;
    }
    return `tg_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function normalizeGender(value) {
    const v = String(value || '').trim().toUpperCase();
    return v === 'M' || v === 'F' ? v : '';
}

/**
 * tempGuests 레코드 생성 (현장등록 시점)
 *
 * @returns {Promise<{tempGuestId: string}>}
 */
export async function createTempGuestRecord({
    roomNumber,
    onsiteSessionId,
    name,
    company = '',
    gender
}) {
    if (!database) throw new Error('Firebase not initialized');
    await ensureAnonymousAuth({ context: 'createTempGuestRecord.ensureAuth', showToast: true, rethrow: true });

    if (!isValidRoomNumber(String(roomNumber))) {
        throw new Error('유효하지 않은 방 번호입니다.');
    }
    if (!isValidSessionId(String(onsiteSessionId))) {
        throw new Error('유효하지 않은 세션입니다.');
    }

    const safeName = sanitizeName(name);
    const safeCompany = sanitizeCompany(company);
    const safeGender = normalizeGender(gender);
    if (!safeName) throw new Error('이름이 필요합니다.');
    if (!safeGender) throw new Error('성별 정보가 필요합니다.');

    const tempGuestId = generateTempGuestId();
    const tgRef = ref(database, `tempGuests/${tempGuestId}`);

    await set(tgRef, {
        tempGuestId,
        roomNumber: String(roomNumber),
        onsiteSessionId: String(onsiteSessionId),
        name: safeName,
        company: safeCompany,
        gender: safeGender,
        status: 'active', // 'active' | 'migrated' | 'cancelled'
        createdAt: Date.now(),
    });

    return { tempGuestId };
}

export async function deleteTempGuestRecord(tempGuestId) {
    if (!database) return false;
    await ensureAnonymousAuth({ context: 'deleteTempGuestRecord.ensureAuth', showToast: false, rethrow: false });
    if (!tempGuestId) return false;
    await set(ref(database, `tempGuests/${tempGuestId}`), null);
    return true;
}

export function subscribeToTempGuests(callback) {
    if (!database) {
        callback([]);
        return () => { };
    }

    const tgRef = ref(database, 'tempGuests');
    let unsubscribe = () => { };
    let cancelled = false;
    let notified = false;

    ensureAnonymousAuth({ context: 'subscribeToTempGuests.ensureAuth', showToast: false, rethrow: false })
        .then(() => {
            if (cancelled) return;
            unsubscribe = onValue(
                tgRef,
                (snapshot) => {
                    const data = snapshot.val() || {};
                    const items = Object.entries(data).map(([id, v]) => ({ id, ...v }));
                    callback(items);
                },
                (error) => {
                    if (notified) return;
                    notified = true;
                    import('../utils/errorHandler')
                        .then(({ handleFirebaseError }) => handleFirebaseError(error, { context: 'subscribeToTempGuests', showToast: true, rethrow: false }))
                        .catch(() => { });
                }
            );
        })
        .catch(() => { });

    return () => {
        cancelled = true;
        unsubscribe();
    };
}

export async function getTempGuestRecord(tempGuestId) {
    if (!database) return null;
    await ensureAnonymousAuth({ context: 'getTempGuestRecord.ensureAuth', showToast: false, rethrow: false });
    if (!tempGuestId) return null;
    const snap = await get(ref(database, `tempGuests/${tempGuestId}`));
    return snap.exists() ? snap.val() : null;
}

/**
 * 현장등록 guest(tempGuestId) → 등록유저(sessionId) 치환(마이그레이션)
 *
 * 보안/정합성:
 * - OTP 등 “이메일 소유 확인”은 우회하지 않는다. (targetSessionId는 이미 users에 존재해야 함)
 * - rooms/{roomNumber}/guests 는 transaction으로 치환(동시성 안전)
 * - users/{sessionId}는 치환 후 best-effort로 selectedRoom/locked 동기화
 */
export async function migrateTempGuestToRegisteredUser(tempGuestId, targetSessionId, options = {}) {
    if (!database) throw new Error('Firebase not initialized');
    await ensureAnonymousAuth({ context: 'migrateTempGuestToRegisteredUser.ensureAuth', showToast: true, rethrow: true });

    const { allowMoveExistingAssignment = false } = options || {};

    if (!tempGuestId || typeof tempGuestId !== 'string') {
        throw new Error('tempGuestId가 필요합니다.');
    }
    if (!isValidSessionId(String(targetSessionId))) {
        throw new Error('유효하지 않은 세션입니다.');
    }

    const tg = await getTempGuestRecord(tempGuestId);
    if (!tg) throw new Error('tempGuest를 찾을 수 없습니다.');
    if (tg.status === 'migrated') throw new Error('이미 전환 완료된 tempGuest입니다.');

    const roomNumber = String(tg.roomNumber || '');
    if (!isValidRoomNumber(roomNumber)) throw new Error('유효하지 않은 방 번호입니다.');
    if (!staticRoomData[roomNumber]) throw new Error('roomData에 없는 방입니다.');

    // 1) target user 존재/필수 필드 확인 (rules validate 대응)
    const targetUser = await getUser(String(targetSessionId));
    if (!targetUser) {
        throw new Error('등록 유저(users)에 존재하지 않습니다. 먼저 OTP 로그인으로 등록을 완료해주세요.');
    }

    const now = Date.now();

    // 2) 다른 방 중복 배정 여부 확인 (+ 옵션에 따라 “이동” 허용)
    let existingAssignedRoom = null;
    let existingAssignedGuestSnapshot = null;
    {
        const roomsSnap = await get(ref(database, 'rooms'));
        const allRooms = roomsSnap.val() || {};
        const allowedRoomSet = new Set(Object.keys(staticRoomData));

        for (const [rid, roomInfo] of Object.entries(allRooms)) {
            if (!allowedRoomSet.has(String(rid))) continue;
            let guests = roomInfo?.guests || [];
            if (!Array.isArray(guests)) guests = Object.values(guests);
            if (String(rid) !== roomNumber && guests.some(g => g?.sessionId === String(targetSessionId))) {
                existingAssignedRoom = String(rid);
                existingAssignedGuestSnapshot = guests.find(g => g?.sessionId === String(targetSessionId)) || null;
                break;
            }
        }
    }

    if (existingAssignedRoom) {
        if (!allowMoveExistingAssignment) {
            throw new Error(`이미 다른 객실(${existingAssignedRoom}호)에 배정된 유저입니다. (이동 허용 옵션이 꺼져 있습니다)`);
        }
        // 기존 방에서 제거 (베스트 에포트 복구를 위해 스냅샷 보관)
        await removeGuestFromRoom(existingAssignedRoom, String(targetSessionId));
    }

    try {
        // 3) rooms/{roomNumber}/guests 내 onsite guest를 transaction으로 “치환”
        const guestsRef = ref(database, `rooms/${roomNumber}/guests`);
        const tx = await runTransaction(guestsRef, (currentGuests) => {
            let guests = currentGuests || [];
            if (!Array.isArray(guests)) guests = Object.values(guests);

            // 이미 targetSessionId가 방에 있으면 중복이므로 중단
            if (guests.some(g => g?.sessionId === String(targetSessionId))) {
                return; // abort
            }

            // tempGuestId로 대상 찾기(정석) + fallback: onsiteSessionId 매칭
            const primaryIdx = guests.findIndex(g => g?.tempGuestId === tempGuestId);
            const idx = primaryIdx >= 0 ? primaryIdx : guests.findIndex(g => g?.sessionId === String(tg.onsiteSessionId));

            if (idx < 0) {
                return; // abort
            }

            const original = guests[idx] || {};
            const next = {
                // 등록유저 기준 프로필로 정규화
                name: targetUser.name || original.name || tg.name || '',
                company: targetUser.company || original.company || tg.company || '',
                position: targetUser.position || original.position || '',
                email: targetUser.email || original.email || '',
                singleRoom: targetUser.singleRoom || original.singleRoom || 'N',
                gender: targetUser.gender || original.gender || tg.gender || '',
                age: targetUser.age ?? original.age ?? null,
                snoring: targetUser.snoring || original.snoring || 'no',
                sessionId: String(targetSessionId),
                registeredAt: targetUser.registeredAt || original.registeredAt || now,

                // 추적/감사
                migratedFromTempGuestId: tempGuestId,
                migratedFromOnsiteSessionId: String(tg.onsiteSessionId || original.sessionId || ''),
                migratedAt: now,
                provisioningType: 'registered', // why: onsite → registered로 전환 완료 표시
            };

            const updated = [...guests];
            updated[idx] = next;
            return updated;
        });

        if (!tx.committed) {
            throw new Error('전환에 실패했습니다. (대상 게스트를 찾지 못했거나 이미 전환/중복 배정 상태일 수 있습니다)');
        }
    } catch (e) {
        // 3-1) (선택) 기존 배정을 이동시킨 상태에서 전환이 실패하면, 베스트 에포트로 원상복구
        if (existingAssignedRoom && existingAssignedGuestSnapshot) {
            try {
                const cap = staticRoomData[existingAssignedRoom]?.capacity || 2;
                const prevRef = ref(database, `rooms/${existingAssignedRoom}/guests`);
                await runTransaction(prevRef, (currentGuests) => {
                    let guests = currentGuests || [];
                    if (!Array.isArray(guests)) guests = Object.values(guests);
                    if (guests.some(g => g?.sessionId === String(targetSessionId))) return guests;
                    if (guests.length >= cap) return guests;
                    return [...guests, existingAssignedGuestSnapshot];
                });
            } catch (_) {
                // 복구 실패는 운영자가 확인할 수 있도록 history로 남긴다.
                await addHistory({
                    action: HISTORY_ACTIONS.ADMIN_MIGRATE_ONSITE,
                    roomNumber,
                    tempGuestId,
                    targetSessionId: String(targetSessionId),
                    status: 'rollback_failed',
                    message: '전환 실패 후 기존 배정 복구에 실패했습니다. 수동 확인 필요.',
                });
            }
        }
        throw e;
    }

    // 4) users/{targetSessionId} selectedRoom/locked 동기화 (best-effort)
    try {
        await updateUser(String(targetSessionId), {
            selectedRoom: roomNumber,
            selectedAt: now,
            locked: true,
            lastMigratedAt: now,
        });
    } catch (e) {
        // rooms는 이미 치환되었으므로 운영자가 확인할 수 있게 history 남김
        await addHistory({
            action: HISTORY_ACTIONS.ADMIN_MIGRATE_ONSITE,
            roomNumber,
            tempGuestId,
            targetSessionId: String(targetSessionId),
            status: 'partial',
            message: 'rooms 치환은 성공했으나 users 동기화가 실패했습니다.',
        });
        throw e;
    }

    // 5) tempGuests 마킹 + history
    await update(ref(database, `tempGuests/${tempGuestId}`), {
        status: 'migrated',
        migratedToSessionId: String(targetSessionId),
        migratedAt: now,
    });

    await addHistory({
        action: HISTORY_ACTIONS.ADMIN_MIGRATE_ONSITE,
        roomNumber,
        tempGuestId,
        onsiteSessionId: String(tg.onsiteSessionId || ''),
        targetSessionId: String(targetSessionId),
        movedFromRoom: existingAssignedRoom || null,
        status: 'ok',
    });

    return true;
}
