/**
 * 개발 환경에서만 출력되는 디버그 로거
 * 프로덕션 빌드에서는 자동으로 비활성화됨
 */

const isDev = import.meta.env.DEV;

export const debug = {
    log: (...args) => {
        if (isDev) console.log('[DEBUG]', ...args);
    },
    warn: (...args) => {
        if (isDev) console.warn('[DEBUG]', ...args);
    },
    error: (...args) => {
        // 에러는 프로덕션에서도 출력 (문제 추적용)
        console.error('[ERROR]', ...args);
    },
    info: (...args) => {
        if (isDev) console.info('[DEBUG]', ...args);
    }
};

export default debug;
