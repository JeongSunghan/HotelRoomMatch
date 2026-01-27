/**
 * Firebase 사전등록 유저 관리 모듈
 * 이메일 기반 유저 검증 (Phase 10)
 */
import { database, ref, onValue, set, get, push, update } from './config';
import { emailToKey, sanitizeEmail, isValidEmail } from '../utils/sanitize';

function normalizeSingleRoom(value) {
    if (value === true) return 'Y';
    if (value === false) return 'N';
    const v = String(value || '').trim().toUpperCase();
    return v === 'Y' ? 'Y' : 'N';
}

function normalizeGender(value) {
    const v = String(value || '').trim().toUpperCase();
    return v === 'M' || v === 'F' ? v : '';
}

/**
 * 사전등록 유저 목록 구독 (실시간)
 */
export function subscribeToAllowedUsers(callback) {
    if (!database) {
        callback([]);
        return () => { };
    }

    const usersRef = ref(database, 'allowedUsers');

    let notified = false;
    const unsubscribe = onValue(
        usersRef,
        (snapshot) => {
            const data = snapshot.val() || {};
            const users = Object.entries(data).map(([key, user]) => ({
                id: key,
                ...user
            }));
            callback(users);
        },
        (error) => {
            if (notified) return;
            notified = true;
            import('../utils/errorHandler')
                .then(({ handleFirebaseError }) => handleFirebaseError(error, { context: 'subscribeToAllowedUsers', showToast: true, rethrow: false }))
                .catch(() => { });
        }
    );

    return unsubscribe;
}

/**
 * 사전등록 유저 목록 가져오기 (일회성)
 */
export async function getAllowedUsers() {
    if (!database) return [];

    const usersRef = ref(database, 'allowedUsers');
    const snapshot = await get(usersRef);
    const data = snapshot.val() || {};

    return Object.entries(data).map(([key, user]) => ({
        id: key,
        ...user
    }));
}

/**
 * 유저 검증 (이메일 기반)
 * @param {string} email - 입력된 이메일 (또는 링크에서 추출한 이메일)
 * @returns {Promise<{valid: boolean, user: Object|null, message: string}>}
 */
export async function verifyUser(email) {
    if (!database) return { valid: false, message: '데이터베이스 연결 실패' };

    const sanitizedEmail = sanitizeEmail(email);
    const userKey = emailToKey(sanitizedEmail);

    if (!userKey) {
        return {
            valid: false,
            user: null,
            message: '유효하지 않은 이메일 형식입니다.'
        };
    }

    // Key로 직접 조회 (최적화)
    const userRef = ref(database, `allowedUsers/${userKey}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();

    if (userData) {
        // 관리자에 의해 삭제/차단된 계정은 인증(OTP) 자체를 막는다.
        // 왜: deleteUserCompletely()에서 allowedUsers를 완전 삭제하지 않고 deletedAt으로 표시하는 정책을 사용 중이며,
        //     이 경우에도 OTP가 발급되면 "삭제했는데도 메일이 옴"으로 보이기 때문.
        if (userData.deletedAt) {
            return {
                valid: false,
                user: null,
                message: '삭제(차단)된 계정입니다. 관리자에게 문의해주세요.'
            };
        }

        // 이미 등록 완료된 유저인지 확인
        // 이미 등록 완료된 유저인지 확인
        if (userData.registered) {
            return {
                valid: true,
                user: { id: userKey, ...userData },
                alreadyRegistered: true,
                message: '기존 계정으로 로그인합니다.'
            };
        }

        return {
            valid: true,
            user: { id: userKey, ...userData },
            message: '인증 성공'
        };
    }

    return {
        valid: false,
        user: null,
        message: '사전 등록된 이메일이 아닙니다. 관리자에게 문의해주세요.'
    };
}

/**
 * 유저 등록 완료 표시
 * @param {string} userEmail - 사전등록 유저 이메일 (ID 식별용)
 * @param {string} sessionId - 등록된 세션 ID
 * @param {string} uid - Firebase Auth UID
 */
export async function markUserAsRegistered(userEmail, sessionId, uid) {
    if (!database || !userEmail) return false;

    const userKey = emailToKey(userEmail);
    if (!userKey) return false;

    const userRef = ref(database, `allowedUsers/${userKey}`);
    const snapshot = await get(userRef);
    const user = snapshot.val();

    if (!user) return false;

    await set(userRef, {
        ...user,
        registered: true,
        registeredSessionId: sessionId,
        registeredUid: uid, // Auth UID 저장
        registeredAt: Date.now()
    });

    return true;
}

/**
 * 사전등록 유저 추가 (관리자용)
 * @param {Object} userData - { name, email, company? }
 */
export async function addAllowedUser(userData) {
    if (!database) return null;

    const email = sanitizeEmail(userData.email);
    const userKey = emailToKey(email);

    if (!userKey) return null; // 이메일 필수

    const userRef = ref(database, `allowedUsers/${userKey}`);

    await set(userRef, {
        // output.json 기준 필드: 소속명|성명|직위|이메일|1인실 여부|성별
        name: userData.name?.trim() || '',
        email,
        company: userData.company?.trim() || '',
        position: userData.position?.trim() || '',
        singleRoom: normalizeSingleRoom(userData.singleRoom),
        gender: normalizeGender(userData.gender),
        registered: false,
        createdAt: Date.now()
    });

    return userKey;
}

/**
 * 사전등록 유저 삭제 (관리자용)
 */
export async function removeAllowedUser(userId) {
    if (!database || !userId) return false;

    // userId는 이미 Base64 Key라고 가정
    const userRef = ref(database, `allowedUsers/${userId}`);
    await set(userRef, null);

    return true;
}

/**
 * 사전등록 유저 일괄 삭제 (관리자용)
 * - allowedUsers/{id} 를 update로 null 처리 (멀티 로케이션 업데이트)
 *
 * @param {string[]} userIds
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function bulkRemoveAllowedUsers(userIds) {
    if (!database || !Array.isArray(userIds) || userIds.length === 0) {
        return { success: 0, failed: 0 };
    }

    // 중복 제거 + 빈 값 제거
    const ids = Array.from(new Set(userIds.filter(Boolean)));
    if (ids.length === 0) return { success: 0, failed: 0 };

    try {
        const allowedUsersRef = ref(database, 'allowedUsers');
        const updates = {};
        for (const id of ids) {
            updates[id] = null;
        }

        await update(allowedUsersRef, updates);
        return { success: ids.length, failed: 0 };
    } catch (e) {
        // 부분 실패 수 계산은 서버에서 알기 어려워 전체 실패로 처리
        return { success: 0, failed: ids.length };
    }
}

/**
 * 사전등록 유저 수정 (관리자용)
 * - name/company는 update로 부분 수정
 * - email 변경은 key가 바뀌므로(=emailToKey) 미등록 유저에 한해 "새 키로 생성 + 기존 키 삭제"로 처리
 *
 * @param {string} userId - allowedUsers의 key
 * @param {{name?: string, email?: string, company?: string}} updates
 * @returns {Promise<string|false>} 최종 userId (email 변경 시 키가 바뀔 수 있음)
 */
export async function updateAllowedUser(userId, updates) {
    if (!database || !userId) return false;

    const userRef = ref(database, `allowedUsers/${userId}`);
    const snapshot = await get(userRef);
    const existing = snapshot.val();

    if (!existing) {
        throw new Error('사전등록 유저를 찾을 수 없습니다.');
    }

    const nextName = typeof updates?.name === 'string' ? updates.name.trim() : existing.name;
    const nextCompany = typeof updates?.company === 'string' ? updates.company.trim() : existing.company;
    const nextPosition = typeof updates?.position === 'string' ? updates.position.trim() : existing.position;
    const nextSingleRoom =
        updates?.singleRoom !== undefined ? normalizeSingleRoom(updates.singleRoom) : normalizeSingleRoom(existing.singleRoom);
    const nextGender =
        updates?.gender !== undefined ? normalizeGender(updates.gender) : normalizeGender(existing.gender);

    // 이메일 변경(=키 변경) 처리
    if (typeof updates?.email === 'string') {
        const nextEmail = sanitizeEmail(updates.email);
        if (!isValidEmail(nextEmail)) {
            throw new Error('유효한 이메일 형식이 아닙니다.');
        }

        // 이메일이 변경된 경우에만 key 변경 시도
        if (nextEmail !== existing.email) {
            if (existing.registered) {
                // 왜: registeredUid / registeredSessionId 참조 무결성 깨질 수 있어 금지
                throw new Error('등록 완료된 유저는 이메일을 변경할 수 없습니다.');
            }

            const newKey = emailToKey(nextEmail);
            if (!newKey) {
                throw new Error('유효한 이메일 형식이 아닙니다.');
            }

            const newRef = ref(database, `allowedUsers/${newKey}`);
            const newSnap = await get(newRef);
            if (newKey !== userId && newSnap.exists()) {
                throw new Error('이미 존재하는 이메일입니다.');
            }

            await set(newRef, {
                ...existing,
                name: nextName,
                email: nextEmail,
                company: nextCompany || '',
                position: nextPosition || '',
                singleRoom: nextSingleRoom,
                gender: nextGender,
                updatedAt: Date.now(),
            });

            if (newKey !== userId) {
                await set(userRef, null);
            }

            return newKey;
        }
    }

    // 일반 부분 수정
    await update(userRef, {
        name: nextName,
        company: nextCompany || '',
        position: nextPosition || '',
        singleRoom: nextSingleRoom,
        gender: nextGender,
        updatedAt: Date.now(),
    });

    return userId;
}

/**
 * 사전등록 유저 일괄 추가 (CSV 업로드용)
 * @param {Array} users - [{ name, email, company? }, ...]
 */
export async function bulkAddAllowedUsers(users) {
    if (!database || !Array.isArray(users)) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    for (const user of users) {
        try {
            const email = sanitizeEmail(user?.email);
            const gender = normalizeGender(user?.gender);
            const name = typeof user?.name === 'string' ? user.name.trim() : '';

            // output.json 스키마 기준: 이메일/성명/성별은 필수
            if (!email || !isValidEmail(email) || !name || !gender) {
                failed++;
                continue;
            }

            const result = await addAllowedUser({
                company: user?.company,
                name,
                position: user?.position,
                email,
                singleRoom: user?.singleRoom,
                gender,
            });

            if (result) success++;
            else failed++;
        } catch (error) {
            failed++;
        }
    }

    return { success, failed };
}

/**
 * 사전등록 유저 전체 삭제 (관리자용, 주의!)
 */
export async function clearAllAllowedUsers() {
    if (!database) return false;

    const usersRef = ref(database, 'allowedUsers');
    await set(usersRef, null);

    return true;
}
