/**
 * 로깅 시스템 유틸리티
 * 개발 환경과 프로덕션 환경에서 다른 로깅 전략을 제공
 * 민감정보 자동 마스킹 및 구조화된 로그 포맷 지원
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

/**
 * 로그 레벨 정의
 */
export const LOG_LEVEL = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
} as const;

export type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL];

/**
 * 로그 레벨 우선순위 (낮을수록 높은 우선순위)
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    [LOG_LEVEL.DEBUG]: 0,
    [LOG_LEVEL.INFO]: 1,
    [LOG_LEVEL.WARN]: 2,
    [LOG_LEVEL.ERROR]: 3,
    [LOG_LEVEL.CRITICAL]: 4
};

/**
 * 환경별 최소 로그 레벨 설정
 */
const MIN_LOG_LEVEL: LogLevel = isDev ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR;

/**
 * 로그 필터 설정 (환경 변수로 제어 가능)
 */
const LOG_FILTER = {
    components: [] as string[],
    enabled: true
};

/**
 * 민감정보 패턴 정의
 */
const SENSITIVE_PATTERNS = {
    email: /([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})/g,
    sessionId: /(session_|admin-)([a-zA-Z0-9\-_]+)/g,
    passkey: /(passkey|password|pwd|secret|token)=([^\s&]+)/gi
};

/**
 * 이메일 마스킹 (user@example.com → u***@e***.com)
 */
function maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    
    const [local, domain] = parts;
    const maskedLocal = local.length > 1 
        ? local[0] + '*'.repeat(Math.min(3, local.length - 1))
        : '*';
    const domainParts = domain.split('.');
    const maskedDomain = domainParts[0].length > 1
        ? domainParts[0][0] + '*'.repeat(Math.min(3, domainParts[0].length - 1))
        : '*';
    
    return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
}

/**
 * 세션 ID 마스킹 (session_abc123 → session_***)
 */
function maskSessionId(sessionId: string): string {
    if (sessionId.startsWith('session_') || sessionId.startsWith('admin-')) {
        const prefix = sessionId.substring(0, sessionId.indexOf('_') + 1 || sessionId.indexOf('-') + 1);
        return prefix + '***';
    }
    return '***';
}

/**
 * 민감정보 마스킹
 */
function maskSensitiveData(data: unknown): unknown {
    if (typeof data === 'string') {
        let masked = data;
        
        // 이메일 마스킹
        masked = masked.replace(SENSITIVE_PATTERNS.email, (match) => maskEmail(match));
        
        // 세션 ID 마스킹
        masked = masked.replace(SENSITIVE_PATTERNS.sessionId, (match) => maskSessionId(match));
        
        // PassKey 마스킹
        masked = masked.replace(SENSITIVE_PATTERNS.passkey, (match, key, value) => {
            return `${key}=***`;
        });
        
        return masked;
    }
    
    if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
            return data.map(item => maskSensitiveData(item));
        }
        
        const masked: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            // 민감정보 키 필터링
            if (key.toLowerCase().includes('password') || 
                key.toLowerCase().includes('secret') ||
                key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('key')) {
                masked[key] = '***';
            } else if (key === 'email') {
                masked[key] = typeof value === 'string' ? maskEmail(value) : value;
            } else if (key === 'sessionId') {
                masked[key] = typeof value === 'string' ? maskSessionId(value) : value;
            } else {
                masked[key] = maskSensitiveData(value);
            }
        }
        return masked;
    }
    
    return data;
}

/**
 * 로그 레벨이 출력 가능한지 확인
 */
function shouldLog(level: LogLevel): boolean {
    if (!LOG_FILTER.enabled) return false;
    
    const levelPriority = LOG_LEVEL_PRIORITY[level];
    const minPriority = LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
    
    return levelPriority >= minPriority;
}

/**
 * 구조화된 로그 포맷
 */
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    component?: string;
    action?: string;
    message?: string;
    data?: unknown;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
}

function formatLog(level: LogLevel, ...args: unknown[]): LogEntry {
    const timestamp = new Date().toISOString();
    
    // 첫 번째 인자가 객체인 경우 구조화된 로그로 처리
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
        const firstArg = args[0] as Record<string, unknown>;
        return {
            timestamp,
            level,
            component: firstArg.component as string | undefined,
            action: firstArg.action as string | undefined,
            message: firstArg.message as string | undefined,
            data: firstArg.data !== undefined ? maskSensitiveData(firstArg.data) : undefined,
            error: firstArg.error as { message: string; stack?: string; code?: string } | undefined
        };
    }
    
    // 일반 로그
    const message = args.map(arg => {
        if (typeof arg === 'string') return arg;
        return maskSensitiveData(arg);
    }).join(' ');
    
    return {
        timestamp,
        level,
        message
    };
}

/**
 * 로그 출력
 */
function outputLog(level: LogLevel, entry: LogEntry): void {
    if (!shouldLog(level)) return;
    
    const prefix = `[${entry.timestamp}] [${level}]`;
    
    switch (level) {
        case LOG_LEVEL.DEBUG:
            console.log(prefix, entry);
            break;
        case LOG_LEVEL.INFO:
            console.info(prefix, entry);
            break;
        case LOG_LEVEL.WARN:
            console.warn(prefix, entry);
            break;
        case LOG_LEVEL.ERROR:
        case LOG_LEVEL.CRITICAL:
            console.error(prefix, entry);
            if (level === LOG_LEVEL.CRITICAL) {
                // Critical 에러는 추가 알림 (필요시 외부 서비스 연동)
                console.error('[CRITICAL ERROR DETECTED]', entry);
            }
            break;
    }
}

/**
 * 기본 로거 객체
 */
export const debug = {
    /**
     * DEBUG 레벨 로그 (개발 환경에서만)
     */
    log: (...args: unknown[]): void => {
        if (shouldLog(LOG_LEVEL.DEBUG)) {
            const entry = formatLog(LOG_LEVEL.DEBUG, ...args);
            outputLog(LOG_LEVEL.DEBUG, entry);
        }
    },
    
    /**
     * INFO 레벨 로그 (개발 환경에서만)
     */
    info: (...args: unknown[]): void => {
        if (shouldLog(LOG_LEVEL.INFO)) {
            const entry = formatLog(LOG_LEVEL.INFO, ...args);
            outputLog(LOG_LEVEL.INFO, entry);
        }
    },
    
    /**
     * WARN 레벨 로그 (개발 환경에서만)
     */
    warn: (...args: unknown[]): void => {
        if (shouldLog(LOG_LEVEL.WARN)) {
            const entry = formatLog(LOG_LEVEL.WARN, ...args);
            outputLog(LOG_LEVEL.WARN, entry);
        }
    },
    
    /**
     * ERROR 레벨 로그 (프로덕션에서도 출력)
     */
    error: (...args: unknown[]): void => {
        if (shouldLog(LOG_LEVEL.ERROR)) {
            const entry = formatLog(LOG_LEVEL.ERROR, ...args);
            outputLog(LOG_LEVEL.ERROR, entry);
        }
    },
    
    /**
     * CRITICAL 레벨 로그 (프로덕션에서도 출력, 추가 알림)
     */
    critical: (...args: unknown[]): void => {
        if (shouldLog(LOG_LEVEL.CRITICAL)) {
            const entry = formatLog(LOG_LEVEL.CRITICAL, ...args);
            outputLog(LOG_LEVEL.CRITICAL, entry);
        }
    }
};

/**
 * 사용자 액션 로깅
 * @param action - 수행한 액션 이름
 * @param component - 컴포넌트/모듈 이름
 * @param data - 관련 데이터
 */
export function logAction(
    action: string,
    component?: string,
    data?: unknown
): void {
    debug.info({
        action,
        component: component || 'Unknown',
        data,
        message: `Action: ${action}`
    });
}

/**
 * 에러 로깅 (errorHandler와 통합)
 * @param error - 에러 객체
 * @param context - 에러 컨텍스트
 */
export function logError(
    error: unknown,
    context: {
        action?: string;
        component?: string;
        data?: unknown;
        level?: LogLevel;
    } = {}
): void {
    const level = context.level || LOG_LEVEL.ERROR;
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const entry = formatLog(level, {
        action: context.action || 'Unknown',
        component: context.component || 'Unknown',
        data: context.data,
        error: {
            message: errorObj.message,
            stack: errorObj.stack,
            code: (errorObj as { code?: string }).code
        },
        message: `Error in ${context.component || 'Unknown'}: ${errorObj.message}`
    });
    
    outputLog(level, entry);
}

/**
 * 성능 측정 로깅
 * @param label - 측정 라벨
 * @param startTime - 시작 시간 (performance.now())
 * @param component - 컴포넌트/모듈 이름
 */
export function logPerformance(
    label: string,
    startTime: number,
    component?: string
): void {
    const duration = performance.now() - startTime;
    
    debug.info({
        action: 'Performance',
        component: component || 'Unknown',
        message: `${label}: ${duration.toFixed(2)}ms`,
        data: {
            label,
            duration,
            unit: 'ms'
        }
    });
}

/**
 * 로그 그룹 시작
 * @param label - 그룹 라벨
 */
export function logGroupStart(label: string): void {
    if (isDev && shouldLog(LOG_LEVEL.DEBUG)) {
        console.group(`[${new Date().toISOString()}] ${label}`);
    }
}

/**
 * 로그 그룹 종료
 */
export function logGroupEnd(): void {
    if (isDev && shouldLog(LOG_LEVEL.DEBUG)) {
        console.groupEnd();
    }
}

/**
 * 로그 필터 설정
 * @param options - 필터 옵션
 */
export function setLogFilter(options: {
    components?: string[];
    enabled?: boolean;
}): void {
    if (options.components !== undefined) {
        LOG_FILTER.components = options.components;
    }
    if (options.enabled !== undefined) {
        LOG_FILTER.enabled = options.enabled;
    }
}

/**
 * 로그 필터 초기화
 */
export function resetLogFilter(): void {
    LOG_FILTER.components = [];
    LOG_FILTER.enabled = true;
}

export default debug;
