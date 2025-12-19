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

// ==================== OTP 서버사이드 검증 ====================

/**
 * 간단한 해시 함수 (Web Crypto API)
 * @param {string} text - 해시할 텍스트
 * @returns {Promise<string>} 해시 문자열
 */
async function simpleHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text + 'vup58_otp_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * 해시 검증
 */
async function verifyHash(input, hash) {
    const inputHash = await simpleHash(input);
    return inputHash === hash;
}

/**
 * OTP 생성 및 DB 저장
 * @param {string} email - 사용자 이메일
 * @returns {Promise<string>} 생성된 OTP 코드 (이메일 전송용)
 */
export async function createOtpRequest(email) {
    if (!database) {
        // Firebase 미연결 시 코드만 반환 (개발용)
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    const emailKey = btoa(email.toLowerCase()).replace(/=/g, '');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await simpleHash(code);

    const otpRef = ref(database, `otp_requests/${emailKey}`);
    await set(otpRef, {
        hashedCode,
        expiresAt: Date.now() + 180000, // 3분
        attempts: 0,
        createdAt: Date.now()
    });

    return code;
}

/**
 * OTP 검증 (서버 측)
 * @param {string} email - 사용자 이메일
 * @param {string} inputCode - 입력된 OTP 코드
 * @returns {Promise<{valid: boolean, message?: string}>}
 */
export async function verifyOtpRequest(email, inputCode) {
    if (!database) {
        // Firebase 미연결 시 항상 실패 (보안)
        return { valid: false, message: 'Firebase 연결이 필요합니다.' };
    }

    const emailKey = btoa(email.toLowerCase()).replace(/=/g, '');
    const otpRef = ref(database, `otp_requests/${emailKey}`);
    const snapshot = await get(otpRef);

    if (!snapshot.exists()) {
        return { valid: false, message: '인증 요청을 찾을 수 없습니다. 다시 요청해주세요.' };
    }

    const data = snapshot.val();

    // 만료 확인
    if (Date.now() > data.expiresAt) {
        await set(otpRef, null); // 만료된 OTP 삭제
        return { valid: false, message: '인증 시간이 만료되었습니다. 다시 요청해주세요.' };
    }

    // 시도 횟수 제한 (5회)
    if (data.attempts >= 5) {
        await set(otpRef, null); // 초과 시 삭제
        return { valid: false, message: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' };
    }

    // 코드 검증
    const isValid = await verifyHash(inputCode, data.hashedCode);

    if (!isValid) {
        // 시도 횟수 증가
        await update(otpRef, { attempts: data.attempts + 1 });
        const remaining = 5 - (data.attempts + 1);
        return { valid: false, message: `인증번호가 일치하지 않습니다. (${remaining}회 남음)` };
    }

    // 성공 시 OTP 삭제 (재사용 방지)
    await set(otpRef, null);
    return { valid: true };
}

/**
 * 안전한 PassKey 생성 (Base64 대신 완전 랜덤)
 * @returns {string} 64자 hex 문자열
 */
export function generateSecurePassKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
