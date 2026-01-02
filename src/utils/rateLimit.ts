/**
 * Rate Limiting 유틸리티
 * 클라이언트 측 요청 제한으로 DoS 방지
 */
import { RATE_LIMIT } from './constants';

/**
 * 요청 기록
 */
interface RequestHistory {
    timestamps: number[];
    blockedUntil: number;
}

/**
 * Rate Limit 체크 결과
 */
export interface RateLimitResult {
    allowed: boolean;
    retryAfter: number;
}

// 요청 기록 저장 (메모리)
const requestHistory = new Map<string, RequestHistory>();

/**
 * Rate Limit 체크
 * @param action - 액션명 (예: 'selectRoom', 'register')
 * @returns 허용 여부 및 대기 시간(ms)
 */
export function checkRateLimit(action: string = 'default'): RateLimitResult {
    const now = Date.now();
    const key = action;

    // 기존 기록 가져오기
    let history = requestHistory.get(key) || { timestamps: [], blockedUntil: 0 };

    // 차단 상태 확인
    if (history.blockedUntil > now) {
        return {
            allowed: false,
            retryAfter: history.blockedUntil - now
        };
    }

    // 윈도우 밖의 오래된 기록 제거
    history.timestamps = history.timestamps.filter(
        ts => now - ts < RATE_LIMIT.WINDOW_MS
    );

    // 현재 윈도우 내 요청 수 확인
    if (history.timestamps.length >= RATE_LIMIT.MAX_REQUESTS) {
        // Rate limit 초과 - 쿨다운 적용
        history.blockedUntil = now + RATE_LIMIT.COOLDOWN_MS;
        requestHistory.set(key, history);

        return {
            allowed: false,
            retryAfter: RATE_LIMIT.COOLDOWN_MS
        };
    }

    // 요청 기록 추가
    history.timestamps.push(now);
    requestHistory.set(key, history);

    return { allowed: true, retryAfter: 0 };
}

/**
 * Rate Limit 래퍼 함수
 * @param action - 액션명
 * @param fn - 실행할 함수
 * @returns 함수 실행 결과 또는 에러
 */
export async function withRateLimit<T>(
    action: string,
    fn: () => Promise<T>
): Promise<T> {
    const { allowed, retryAfter } = checkRateLimit(action);

    if (!allowed) {
        const seconds = Math.ceil(retryAfter / 1000);
        throw new Error(`요청이 너무 많습니다. ${seconds}초 후에 다시 시도해주세요.`);
    }

    return await fn();
}

/**
 * Rate Limit 상태 초기화 (테스트용)
 * @param action - 액션명 (없으면 전체 초기화)
 */
export function resetRateLimit(action?: string): void {
    if (action) {
        requestHistory.delete(action);
    } else {
        requestHistory.clear();
    }
}

/**
 * Throttle 함수 (연속 호출 방지)
 * @param fn - 실행할 함수
 * @param delay - 최소 간격 (ms)
 * @returns Throttled 함수
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number = 1000
): (...args: Parameters<T>) => ReturnType<T> | undefined {
    let lastCall = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function (this: unknown, ...args: Parameters<T>): ReturnType<T> | undefined {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;

        if (timeSinceLastCall >= delay) {
            lastCall = now;
            return fn.apply(this, args) as ReturnType<T>;
        }

        // 마지막 호출 예약
        if (!timeoutId) {
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                timeoutId = null;
                fn.apply(this, args);
            }, delay - timeSinceLastCall);
        }

        return undefined;
    };
}

/**
 * Debounce 함수 (마지막 호출만 실행)
 * @param fn - 실행할 함수
 * @param delay - 대기 시간 (ms)
 * @returns Debounced 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function (this: unknown, ...args: Parameters<T>): void {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            timeoutId = null;
            fn.apply(this, args);
        }, delay);
    };
}

