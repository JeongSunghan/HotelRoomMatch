/**
 * 전역 에러 핸들러 유틸리티
 * 에러 로깅 및 처리의 일관성을 위한 중앙 집중식 핸들러
 */

import debug, { logError, LOG_LEVEL } from './debug';
import { getErrorMessage, getErrorMessageText, type ErrorMessage } from './errorMessages';

/**
 * 에러 로깅 레벨
 */
export const ERROR_LEVEL = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical'
} as const;

export type ErrorLevel = typeof ERROR_LEVEL[keyof typeof ERROR_LEVEL];

/**
 * 에러 컨텍스트 정보
 */
export interface ErrorContext {
    /** 수행 중이던 작업 */
    action?: string;
    /** 에러가 발생한 컴포넌트/모듈 */
    component?: string;
    /** 관련 데이터 */
    data?: unknown;
    /** 에러 레벨 */
    level?: ErrorLevel;
}

/**
 * Firebase Auth 에러 코드 타입
 */
interface FirebaseAuthError extends Error {
    code?: string;
}

/**
 * 전역 에러 핸들러
 * @param error - 에러 객체
 * @param context - 에러 컨텍스트
 * @returns 사용자 친화적 메시지 객체
 */
export function handleError(error: unknown, context: ErrorContext = {}): ErrorMessage {
    const {
        action = '알 수 없는 작업',
        component = '알 수 없음',
        data = null,
        level = ERROR_LEVEL.ERROR
    } = context;

    // 에러 객체가 아닌 경우 변환
    const errorObj = error instanceof Error 
        ? error 
        : new Error(error && typeof error === 'object' && 'message' in error 
            ? String((error as { message?: unknown }).message) 
            : String(error) || '알 수 없는 오류');

    // 구조화된 에러 로깅
    const err = errorObj as FirebaseAuthError;
    const logData = {
        message: errorObj.message,
        stack: errorObj.stack,
        code: err.code,
        action,
        component,
        data,
        timestamp: new Date().toISOString(),
        level
    };

    // 레벨에 따른 로깅 (새로운 logError 함수 사용)
    const logLevel = level === ERROR_LEVEL.CRITICAL ? LOG_LEVEL.CRITICAL :
                     level === ERROR_LEVEL.ERROR ? LOG_LEVEL.ERROR :
                     level === ERROR_LEVEL.WARN ? LOG_LEVEL.WARN :
                     LOG_LEVEL.INFO;
    
    logError(errorObj, {
        action,
        component,
        data,
        level: logLevel
    });

    // 사용자 친화적 메시지 반환
    return getErrorMessage(errorObj);
}

/**
 * 전역 에러 핸들러 (문자열 반환 - 기존 호환성)
 * @param error - 에러 객체
 * @param context - 에러 컨텍스트
 * @returns 사용자 친화적 메시지 문자열
 */
export function handleErrorText(error: unknown, context: ErrorContext = {}): string {
    const errorMsg = handleError(error, context);
    return errorMsg.message;
}

/**
 * 비동기 작업을 안전하게 실행하는 래퍼 함수
 * @param asyncFn - 비동기 함수
 * @param context - 에러 컨텍스트
 * @returns 실행 결과
 */
export async function safeAsync<T>(
    asyncFn: () => Promise<T>,
    context: ErrorContext = {}
): Promise<T> {
    try {
        return await asyncFn();
    } catch (error) {
        const errorMsg = handleError(error, context);
        // 에러를 다시 throw하되, 사용자 친화적 메시지를 포함
        const enhancedError = new Error(errorMsg.message);
        (enhancedError as { originalError?: unknown; errorMessage?: ErrorMessage }).originalError = error;
        (enhancedError as { originalError?: unknown; errorMessage?: ErrorMessage }).errorMessage = errorMsg;
        throw enhancedError;
    }
}

/**
 * 에러를 로깅만 하고 throw하지 않는 함수 (선택적 처리)
 * @param error - 에러 객체
 * @param context - 에러 컨텍스트
 * @returns 사용자 친화적 메시지 객체
 */
export function logErrorOnly(error: unknown, context: ErrorContext = {}): ErrorMessage {
    return handleError(error, { ...context, level: ERROR_LEVEL.WARN });
}

/**
 * 에러를 로깅만 하고 throw하지 않는 함수 (문자열 반환 - 기존 호환성)
 * @param error - 에러 객체
 * @param context - 에러 컨텍스트
 * @returns 사용자 친화적 메시지 문자열
 */
export function logErrorOnlyText(error: unknown, context: ErrorContext = {}): string {
    const errorMsg = logErrorOnly(error, context);
    return errorMsg.message;
}


