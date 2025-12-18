/**
 * Firebase 사전등록 유저 관리 모듈
 * 이름 + 휴대폰 번호로 유저 검증
 */
import { database, ref, onValue, set, get, push } from './config';

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
        const users = Object.entries(data).map(([id, user]) => ({
            id,
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

    return Object.entries(data).map(([id, user]) => ({
        id,
        ...user
    }));
}

/**
 * 휴대폰 번호 정규화 (하이픈 제거, 숫자만)
 */
function normalizePhone(phone) {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
}

/**
 * 이름 정규화 (공백 제거, 소문자)
 */
function normalizeName(name) {
    if (!name) return '';
    return name.trim().replace(/\s+/g, '').toLowerCase();
}

/**
 * 유저 검증 (이름 + 휴대폰 번호)
 * @param {string} name - 입력된 이름
 * @param {string} phone - 입력된 휴대폰 번호
 * @returns {Promise<{valid: boolean, user: Object|null, message: string}>}
 */
export async function verifyUser(name, phone) {
    const allowedUsers = await getAllowedUsers();

    const normalizedName = normalizeName(name);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedName || !normalizedPhone) {
        return {
            valid: false,
            user: null,
            message: '이름과 휴대폰 번호를 모두 입력해주세요.'
        };
    }

    // 휴대폰 번호 형식 검증 (10-11자리)
    if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
        return {
            valid: false,
            user: null,
            message: '유효한 휴대폰 번호를 입력해주세요.'
        };
    }

    // 이름 + 휴대폰 번호로 검색
    const matchedUser = allowedUsers.find(user => {
        const userNormalizedName = normalizeName(user.name);
        const userNormalizedPhone = normalizePhone(user.phone);

        return userNormalizedName === normalizedName &&
            userNormalizedPhone === normalizedPhone;
    });

    if (matchedUser) {
        // 이미 등록 완료된 유저인지 확인
        if (matchedUser.registered) {
            return {
                valid: false,
                user: null,
                message: '이미 등록이 완료된 사용자입니다.'
            };
        }

        return {
            valid: true,
            user: matchedUser,
            message: '인증 성공'
        };
    }

    return {
        valid: false,
        user: null,
        message: '등록된 정보와 일치하지 않습니다. 이름과 휴대폰 번호를 확인해주세요.'
    };
}

/**
 * 유저 등록 완료 표시
 * @param {string} userId - 사전등록 유저 ID
 * @param {string} sessionId - 등록된 세션 ID
 */
export async function markUserAsRegistered(userId, sessionId) {
    if (!database || !userId) return false;

    const userRef = ref(database, `allowedUsers/${userId}`);
    const snapshot = await get(userRef);
    const user = snapshot.val();

    if (!user) return false;

    await set(userRef, {
        ...user,
        registered: true,
        registeredSessionId: sessionId,
        registeredAt: Date.now()
    });

    return true;
}

/**
 * 사전등록 유저 추가 (관리자용)
 * @param {Object} userData - { name, phone, company? }
 */
export async function addAllowedUser(userData) {
    if (!database) return null;

    const usersRef = ref(database, 'allowedUsers');
    const newUserRef = push(usersRef);

    await set(newUserRef, {
        name: userData.name?.trim() || '',
        phone: normalizePhone(userData.phone) || '',
        company: userData.company?.trim() || '',
        registered: false,
        createdAt: Date.now()
    });

    return newUserRef.key;
}

/**
 * 사전등록 유저 삭제 (관리자용)
 */
export async function removeAllowedUser(userId) {
    if (!database || !userId) return false;

    const userRef = ref(database, `allowedUsers/${userId}`);
    await set(userRef, null);

    return true;
}

/**
 * 사전등록 유저 일괄 추가 (CSV 업로드용)
 * @param {Array} users - [{ name, phone, company? }, ...]
 */
export async function bulkAddAllowedUsers(users) {
    if (!database || !Array.isArray(users)) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    for (const user of users) {
        try {
            if (user.name && user.phone) {
                await addAllowedUser(user);
                success++;
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
