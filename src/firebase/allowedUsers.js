/**
 * Firebase 사전등록 유저 관리 모듈
 * 이메일 기반 유저 검증 (Phase 10)
 */
import { database, ref, onValue, set, get, push } from './config';
import { emailToKey, sanitizeEmail, isValidEmail } from '../utils/sanitize';

/**
 * 사전등록 유저 목록 구독 (실시간)
 */
export function subscribeToAllowedUsers(callback) {
    if (!database) {
        callback([]);
        return () => { };
    }

    const usersRef = ref(database, 'allowedUsers');

    const unsubscribe = onValue(usersRef, (snapshot) => {
        const data = snapshot.val() || {};
        const users = Object.entries(data).map(([key, user]) => ({
            id: key,
            ...user
        }));
        callback(users);
    });

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
        name: userData.name?.trim() || '',
        email: email,
        company: userData.company?.trim() || '',
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
 * 사전등록 유저 일괄 추가 (CSV 업로드용)
 * @param {Array} users - [{ name, email, company? }, ...]
 */
export async function bulkAddAllowedUsers(users) {
    if (!database || !Array.isArray(users)) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    for (const user of users) {
        try {
            if (user.email) {
                const result = await addAllowedUser(user);
                if (result) success++;
                else failed++;
            } else {
                failed++;
            }
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
