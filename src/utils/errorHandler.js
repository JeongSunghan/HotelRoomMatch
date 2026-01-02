/**
 * 전역 에러 핸들러 유틸리티
 * 에러 로깅 및 처리의 일관성을 위한 중앙 집중식 핸들러
 */

import debug from './debug';
import { getErrorMessage } from './errorMessages';

/**
 * 에러 로깅 레벨
 */
export const ERROR_LEVEL = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical'
};

/**
 * 에러 컨텍스트 정보
 * @typedef {Object} ErrorContext
 * @property {string} [action] - 수행 중이던 작업
 * @property {string} [component] - 에러가 발생한 컴포넌트/모듈
 * @property {Object} [data] - 관련 데이터
 * @property {ERROR_LEVEL} [level] - 에러 레벨
 */

/**
 * 전역 에러 핸들러
 * @param {Error} error - 에러 객체
 * @param {ErrorContext} context - 에러 컨텍스트
 * @returns {string} 사용자 친화적 메시지
 */
export function handleError(error, context = {}) {
    const {
        action = '알 수 없는 작업',
        component = '알 수 없음',
        data = null,
        level = ERROR_LEVEL.ERROR
    } = context;

    // 에러 객체가 아닌 경우 변환
    const errorObj = error instanceof Error 
        ? error 
        : new Error(error?.message || String(error) || '알 수 없는 오류');

    // 구조화된 에러 로깅
    const logData = {
        message: errorObj.message,
        stack: errorObj.stack,
        code: errorObj.code,
        action,
        component,
        data,
        timestamp: new Date().toISOString(),
        level
    };

    // 레벨에 따른 로깅
    switch (level) {
        case ERROR_LEVEL.INFO:
            debug.info('[ErrorHandler]', logData);
            break;
        case ERROR_LEVEL.WARN:
            debug.warn('[ErrorHandler]', logData);
            break;
        case ERROR_LEVEL.CRITICAL:
            console.error('[CRITICAL ERROR]', logData);
            debug.error('[ErrorHandler - CRITICAL]', logData);
            break;
        case ERROR_LEVEL.ERROR:
        default:
            debug.error('[ErrorHandler]', logData);
            break;
    }

    // 사용자 친화적 메시지 반환
    return getErrorMessage(errorObj);
}

/**
 * 비동기 작업을 안전하게 실행하는 래퍼 함수
 * @param {Function} asyncFn - 비동기 함수
 * @param {ErrorContext} context - 에러 컨텍스트
 * @returns {Promise} 실행 결과
 */
export async function safeAsync(asyncFn, context = {}) {
    try {
        return await asyncFn();
    } catch (error) {
        const userMessage = handleError(error, context);
        // 에러를 다시 throw하되, 사용자 친화적 메시지를 포함
        const enhancedError = new Error(userMessage);
        enhancedError.originalError = error;
        throw enhancedError;
    }
}

/**
 * 에러를 로깅만 하고 throw하지 않는 함수 (선택적 처리)
 * @param {Error} error - 에러 객체
 * @param {ErrorContext} context - 에러 컨텍스트
 * @returns {string} 사용자 친화적 메시지
 */
export function logErrorOnly(error, context = {}) {
    return handleError(error, { ...context, level: ERROR_LEVEL.WARN });
}

