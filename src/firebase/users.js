/**
 * Firebase 사용자 관련 모듈
 */
import { database, ref, onValue, set, update, get } from './config';

export async function saveUser(sessionId, userData) {
    if (!database) return false;

    const userRef = ref(database, `users/${sessionId}`);
    await set(userRef, {
        ...userData,
        selectedAt: Date.now(),
        locked: true
    });

    return true;
}

export async function updateUser(sessionId, updates) {
    if (!database) return false;

    const userRef = ref(database, `users/${sessionId}`);
    await update(userRef, updates);
    return true;
}

export async function getUser(sessionId) {
    if (!database) return null;

    const userRef = ref(database, `users/${sessionId}`);
    const snapshot = await get(userRef);
    return snapshot.val();
}

// 사용자 세션 실시간 구독 (관리자 삭제 감지용)
export function subscribeToUserSession(sessionId, callback) {
    if (!database || !sessionId) {
        callback(null);
        return () => { };
    }

    const userRef = ref(database, `users/${sessionId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
        callback(snapshot.val());
    });

    return unsubscribe;
}

export async function clearUserSession(sessionId) {
    if (!database) return false;

    const userRef = ref(database, `users/${sessionId}`);
    await set(userRef, null);

    return true;
}
