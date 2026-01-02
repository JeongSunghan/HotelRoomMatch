/**
 * 개발 환경에서만 출력되는 디버그 로거
 * 프로덕션 빌드에서는 자동으로 비활성화됨
 */

const isDev = import.meta.env.DEV;

/**
 * 구조화된 로그 포맷
 * @param {string} level - 로그 레벨
 * @param {Array} args - 로그 인자
 */
function formatLog(level, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (args.length === 1 && typeof args[0] === 'object') {
        // 객체인 경우 구조화된 로그
        return [prefix, args[0]];
    }
    // 일반 로그
    return [prefix, ...args];
}

export const debug = {
    log: (...args) => {
        if (isDev) {
            const formatted = formatLog('DEBUG', ...args);
            console.log(...formatted);
        }
    },
    warn: (...args) => {
        if (isDev) {
            const formatted = formatLog('WARN', ...args);
            console.warn(...formatted);
        }
    },
    error: (...args) => {
        // 에러는 프로덕션에서도 출력 (문제 추적용)
        const formatted = formatLog('ERROR', ...args);
        console.error(...formatted);
    },
    info: (...args) => {
        if (isDev) {
            const formatted = formatLog('INFO', ...args);
            console.info(...formatted);
        }
    }
};

export default debug;
