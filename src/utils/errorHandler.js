/**
 * 글로벌 에러 핸들러 유틸리티
 * Firebase 및 기타 에러를 일관되게 처리하고 사용자 친화적인 메시지를 제공합니다.
 */

/**
 * Firebase 에러 코드를 한글 메시지로 변환
 */
const FIREBASE_ERROR_MESSAGES = {
    // Auth 에러
    'auth/user-not-found': '사용자를 찾을 수 없습니다.',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password': '비밀번호가 너무 약합니다. (최소 6자 이상)',
    'auth/invalid-email': '올바른 이메일 형식이 아닙니다.',
    'auth/operation-not-allowed': '허용되지 않은 작업입니다.',
    'auth/too-many-requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',

    // Database 에러
    'permission-denied': '권한이 없습니다. 로그인이 필요합니다.',
    'PERMISSION_DENIED': '권한이 없습니다. 로그인이 필요합니다.',
    'unavailable': '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.',
    'network-request-failed': '네트워크 연결을 확인해주세요.',

    // 일반 에러
    'timeout': '요청 시간이 초과되었습니다.',
    'cancelled': '작업이 취소되었습니다.',
};

/**
 * 에러 심각도 레벨
 */
export const ERROR_SEVERITY = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};

/**
 * 에러를 분석하여 사용자 친화적 메시지와 메타데이터 반환
 * @param {Error} error - 처리할 에러 객체
 * @param {Object} context - 에러 발생 컨텍스트 정보
 * @returns {Object} 에러 정보 객체
 */
export function analyzeError(error, context = {}) {
    const errorCode = error?.code || error?.name || 'unknown';
    const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다.';

    // Firebase 에러 코드 매칭
    const userMessage = FIREBASE_ERROR_MESSAGES[errorCode] || errorMessage;

    // 심각도 판단
    let severity = ERROR_SEVERITY.ERROR;
    if (errorCode.includes('permission') || errorCode.includes('auth')) {
        severity = ERROR_SEVERITY.CRITICAL;
    } else if (errorCode.includes('network') || errorCode.includes('unavailable')) {
        severity = ERROR_SEVERITY.WARNING;
    }

    return {
        code: errorCode,
        message: userMessage,
        originalMessage: errorMessage,
        severity,
        context,
        timestamp: Date.now(),
        stack: error?.stack
    };
}

/**
 * Firebase 에러 핸들러
 * @param {Error} error - Firebase 에러
 * @param {Object} options - 처리 옵션
 * @param {string} options.context - 에러 발생 위치 (예: 'deleteUser', 'selectRoom')
 * @param {boolean} options.showToast - Toast 알림 표시 여부
 * @param {boolean} options.rethrow - 에러 재발생 여부
 * @param {Function} options.onError - 커스텀 에러 핸들러
 * @returns {Object} 분석된 에러 정보
 */
export function handleFirebaseError(error, options = {}) {
    const {
        context = 'unknown',
        showToast = false,
        rethrow = true,
        onError = null
    } = options;

    // 에러 분석
    const errorInfo = analyzeError(error, { location: context });

    // 개발 환경에서 상세 로그
    if (import.meta.env.DEV) {
        console.group(`🔴 Firebase Error [${context}]`);
        console.error('Code:', errorInfo.code);
        console.error('Message:', errorInfo.message);
        console.error('Original:', errorInfo.originalMessage);
        console.error('Severity:', errorInfo.severity);
        if (errorInfo.stack) {
            console.error('Stack:', errorInfo.stack);
        }
        console.groupEnd();
    } else {
        // 프로덕션 환경에서는 간단히 로깅
        console.error(`[${context}]`, errorInfo.code, errorInfo.message);
    }

    // 에러 리포팅 서비스 연동 준비 (Sentry 등)
    if (errorInfo.severity === ERROR_SEVERITY.CRITICAL) {
        reportErrorToService(errorInfo);
    }

    // Toast 표시 (옵션)
    if (showToast) {
        showErrorToast(errorInfo.message);
    }

    // 커스텀 핸들러 실행
    if (onError && typeof onError === 'function') {
        onError(errorInfo);
    }

    // 에러 재발생
    if (rethrow) {
        const enhancedError = new Error(errorInfo.message);
        enhancedError.code = errorInfo.code;
        enhancedError.severity = errorInfo.severity;
        enhancedError.context = errorInfo.context;
        throw enhancedError;
    }

    return errorInfo;
}

/**
 * 일반 에러 핸들러
 * @param {Error} error - 일반 에러
 * @param {Object} options - 처리 옵션
 */
export function handleError(error, options = {}) {
    const {
        context = 'unknown',
        showToast = false,
        rethrow = false
    } = options;

    const errorInfo = analyzeError(error, { location: context });

    if (import.meta.env.DEV) {
        console.error(`[${context}]`, error);
    }

    if (showToast) {
        showErrorToast(errorInfo.message);
    }

    if (rethrow) {
        throw error;
    }

    return errorInfo;
}

/**
 * Toast 알림 표시 (동적 import로 순환 참조 방지)
 */
function showErrorToast(message) {
    // Toast 컴포넌트를 동적으로 불러와서 표시
    // 실제 구현은 Toast 훅이나 전역 이벤트 사용
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('show-toast', {
            detail: {
                type: 'error',
                message
            }
        }));
    }
}

/**
 * 에러 리포팅 서비스에 전송 (향후 Sentry 등 연동)
 */
function reportErrorToService(errorInfo) {
    // 프로덕션 환경에서만 보고
    if (import.meta.env.PROD) {
        // TODO: Sentry, LogRocket 등 에러 트래킹 서비스 연동
        console.log('📊 Error reported:', errorInfo);
    }
}

/**
 * 네트워크 에러 여부 확인
 */
export function isNetworkError(error) {
    const code = error?.code || '';
    return code.includes('network') ||
        code.includes('unavailable') ||
        code.includes('timeout');
}

/**
 * 권한 에러 여부 확인
 */
export function isPermissionError(error) {
    const code = error?.code || '';
    return code.includes('permission') ||
        code.includes('PERMISSION') ||
        code.includes('auth/');
}

/**
 * 재시도 가능한 에러 여부 확인
 */
export function isRetryableError(error) {
    return isNetworkError(error) ||
        error?.code === 'timeout' ||
        error?.code === 'unavailable';
}

export default {
    handleFirebaseError,
    handleError,
    analyzeError,
    isNetworkError,
    isPermissionError,
    isRetryableError,
    ERROR_SEVERITY
};
