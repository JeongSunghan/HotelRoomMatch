/**
 * Firebase RTDB Rules는 대부분 auth != null 을 요구한다.
 * 따라서 모든 read/write/subscribe 동작 전에 최소한 익명 인증을 보장해야 permission_denied가 나지 않는다.
 *
 * 주의:
 * - 서버 보안(권한 모델)은 Rules가 담당한다.
 * - 이 유틸은 "auth != null" 조건을 만족시키기 위한 클라이언트 측 보강이다.
 */
import { auth } from './config';

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 익명 인증 보장
 * @param {Object} options
 * @param {string} options.context - 로그/토스트 컨텍스트
 * @param {boolean} options.showToast - 실패 시 토스트 표시 여부
 * @param {boolean} options.rethrow - 실패 시 throw 여부
 * @param {number} options.maxAttempts - 재시도 횟수
 * @returns {Promise<boolean>}
 */
export async function ensureAnonymousAuth(options = {}) {
    const {
        context = 'ensureAnonymousAuth',
        showToast = false,
        rethrow = true,
        maxAttempts = 3
    } = options;

    // Firebase 미초기화(로컬 모드)라면 아무것도 하지 않는다.
    if (!auth) return false;

    if (auth.currentUser) return true;

    const { signInAnonymously } = await import('firebase/auth');

    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await signInAnonymously(auth);
            if (auth.currentUser) return true;
        } catch (e) {
            lastError = e;
            // 점진적 backoff (100ms, 200ms, 300ms...)
            await sleep(100 * attempt);
        }
    }

    if (lastError) {
        try {
            const { handleFirebaseError } = await import('../utils/errorHandler');
            handleFirebaseError(lastError, { context, showToast, rethrow: false });
        } catch (_) {
            // ignore
        }
    }

    if (rethrow) {
        throw lastError || new Error('익명 인증에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
    return false;
}

