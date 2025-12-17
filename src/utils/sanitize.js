/**
 * 입력값 정리(Sanitization) 유틸리티
 * XSS 공격 및 injection 방지
 */

/**
 * HTML 특수문자 이스케이프
 * @param {string} str - 원본 문자열
 * @returns {string} 이스케이프된 문자열
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') return str;

    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 문자열 정리 (공백 정리, 특수문자 제거)
 * @param {string} str - 원본 문자열
 * @param {Object} options - 옵션
 * @returns {string} 정리된 문자열
 */
export function sanitizeString(str, options = {}) {
    if (typeof str !== 'string') return str;

    const {
        trim = true,           // 앞뒤 공백 제거
        removeHtml = true,     // HTML 태그 제거
        maxLength = 100,       // 최대 길이
        allowKorean = true,    // 한글 허용
        allowNumbers = true,   // 숫자 허용
        allowSpaces = true     // 공백 허용
    } = options;

    let result = str;

    // HTML 태그 제거
    if (removeHtml) {
        result = result.replace(/<[^>]*>/g, '');
    }

    // 앞뒤 공백 제거
    if (trim) {
        result = result.trim();
    }

    // 최대 길이 제한
    if (maxLength && result.length > maxLength) {
        result = result.substring(0, maxLength);
    }

    return result;
}

/**
 * 이름 정리 (한글, 영문, 공백만 허용)
 * @param {string} name - 이름
 * @returns {string} 정리된 이름
 */
export function sanitizeName(name) {
    if (typeof name !== 'string') return '';

    return name
        .trim()
        .replace(/<[^>]*>/g, '')  // HTML 태그 제거
        .replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318Fa-zA-Z\s]/g, '')  // 한글, 영문, 공백만
        .substring(0, 50);  // 최대 50자
}

/**
 * 회사명 정리
 * @param {string} company - 회사명
 * @returns {string} 정리된 회사명
 */
export function sanitizeCompany(company) {
    if (typeof company !== 'string') return '';

    return company
        .trim()
        .replace(/<[^>]*>/g, '')  // HTML 태그 제거
        .substring(0, 100);  // 최대 100자
}

/**
 * 숫자 정리 (숫자만 추출)
 * @param {string} str - 원본 문자열
 * @returns {string} 숫자만 포함된 문자열
 */
export function sanitizeNumber(str) {
    if (typeof str !== 'string') return '';

    return str.replace(/[^0-9]/g, '');
}

/**
 * 사용자 등록 데이터 전체 정리
 * @param {Object} userData - 사용자 데이터
 * @returns {Object} 정리된 사용자 데이터
 */
export function sanitizeUserData(userData) {
    return {
        name: sanitizeName(userData.name || ''),
        company: sanitizeCompany(userData.company || ''),
        residentIdFront: sanitizeNumber(userData.residentIdFront || '').substring(0, 6),
        residentIdBack: sanitizeNumber(userData.residentIdBack || '').substring(0, 7),
        age: userData.age ? parseInt(sanitizeNumber(String(userData.age)), 10) || null : null,
        snoring: ['yes', 'no'].includes(userData.snoring) ? userData.snoring : 'no'
    };
}
