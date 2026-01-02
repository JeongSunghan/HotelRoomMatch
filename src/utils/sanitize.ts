/**
 * 입력값 정리(Sanitization) 유틸리티
 * XSS 공격 및 injection 방지
 */
import type { UserRegistrationData, SnoringLevel } from '../types';

/**
 * 문자열 정리 옵션
 */
export interface SanitizeStringOptions {
    /** 앞뒤 공백 제거 */
    trim?: boolean;
    /** HTML 태그 제거 */
    removeHtml?: boolean;
    /** 최대 길이 */
    maxLength?: number;
}

/**
 * HTML 특수문자 이스케이프
 * @param str - 원본 문자열
 * @returns 이스케이프된 문자열
 */
export function escapeHtml(str: unknown): unknown {
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
 * @param str - 원본 문자열
 * @param options - 옵션
 * @returns 정리된 문자열
 */
export function sanitizeString(str: unknown, options: SanitizeStringOptions = {}): string {
    if (typeof str !== 'string') return String(str || '');

    const {
        trim = true,           // 앞뒤 공백 제거
        removeHtml = true,     // HTML 태그 제거
        maxLength = 100,       // 최대 길이
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
 * @param name - 이름
 * @returns 정리된 이름
 */
export function sanitizeName(name: unknown): string {
    if (typeof name !== 'string') return '';

    return name
        .trim()
        .replace(/<[^>]*>/g, '')  // HTML 태그 제거
        .replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318Fa-zA-Z\s]/g, '')  // 한글, 영문, 공백만
        .substring(0, 50);  // 최대 50자
}

/**
 * 회사명 정리
 * @param company - 회사명
 * @returns 정리된 회사명
 */
export function sanitizeCompany(company: unknown): string {
    if (typeof company !== 'string') return '';

    return company
        .trim()
        .replace(/<[^>]*>/g, '')  // HTML 태그 제거
        .substring(0, 100);  // 최대 100자
}

/**
 * 숫자 정리 (숫자만 추출)
 * @param str - 원본 문자열
 * @returns 숫자만 포함된 문자열
 */
export function sanitizeNumber(str: unknown): string {
    if (typeof str !== 'string') return '';

    return str.replace(/[^0-9]/g, '');
}

/**
 * 사용자 데이터 전체 정리
 * @param userData - 원본 사용자 데이터
 * @returns 정리된 사용자 데이터
 */
export function sanitizeUserData(userData: Partial<UserRegistrationData>): Partial<UserRegistrationData> {
    const sanitized: Partial<UserRegistrationData> = {};

    if (userData.name) {
        sanitized.name = sanitizeName(userData.name);
    }

    if (userData.company) {
        sanitized.company = sanitizeCompany(userData.company);
    }

    if (userData.residentIdFront) {
        sanitized.residentIdFront = sanitizeNumber(userData.residentIdFront).substring(0, 6);
    }

    if (userData.residentIdBack) {
        sanitized.residentIdBack = sanitizeNumber(userData.residentIdBack).substring(0, 1);
    }

    if (userData.age) {
        const age = typeof userData.age === 'string' ? parseInt(userData.age, 10) : userData.age;
        sanitized.age = isNaN(age) ? undefined : Math.max(0, Math.min(150, age));
    }

    if (userData.snoring) {
        const validSnoring: SnoringLevel[] = ['no', 'sometimes', 'yes'];
        sanitized.snoring = validSnoring.includes(userData.snoring as SnoringLevel)
            ? (userData.snoring as SnoringLevel)
            : 'no';
    }

    return sanitized;
}

/**
 * 이메일 정리 (소문자 변환, 공백 제거)
 * @param email - 이메일 주소
 * @returns 정리된 이메일
 */
export function sanitizeEmail(email: unknown): string {
    if (typeof email !== 'string') return '';

    return email.trim().toLowerCase();
}

/**
 * 이메일 유효성 검사
 * @param email - 이메일 주소
 * @returns 유효성 여부
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 이메일을 Firebase 키로 변환 (Base64 인코딩)
 * @param email - 이메일 주소
 * @returns Base64 인코딩된 키 또는 null
 */
export function emailToKey(email: string): string | null {
    if (!isValidEmail(email)) return null;

    try {
        return btoa(email).replace(/=/g, '');
    } catch {
        return null;
    }
}

/**
 * 방 번호 유효성 검사 (6층 이상, 4자리 이하 숫자)
 * @param roomNumber - 방 번호
 * @returns 유효성 여부
 */
export function isValidRoomNumber(roomNumber: unknown): boolean {
    if (typeof roomNumber !== 'string') return false;

    // 경로 traversal 방지
    if (roomNumber.includes('.') || roomNumber.includes('/') || roomNumber.includes('\\')) {
        return false;
    }

    // 3자리: 6xx, 7xx, 8xx / 4자리: 10xx, 11xx, 12xx
    return /^([678]\d{2}|1[012]\d{2})$/.test(roomNumber);
}

/**
 * 세션 ID 유효성 검사
 * @param sessionId - 세션 ID
 * @returns 유효성 여부
 */
export function isValidSessionId(sessionId: unknown): boolean {
    if (typeof sessionId !== 'string') return false;

    // 경로 traversal 문자 차단
    if (sessionId.includes('.') || sessionId.includes('/') || sessionId.includes('\\')) {
        return false;
    }

    // 세션 ID 형식: session_ 또는 admin- 접두사 + 영숫자/-만 허용
    return /^(session_|admin-)[a-zA-Z0-9\-_]+$/.test(sessionId) && sessionId.length <= 100;
}

/**
 * Firebase 경로 안전성 검사
 * @param path - Firebase 경로
 * @returns 안전성 여부
 */
export function isSafeFirebasePath(path: unknown): boolean {
    if (typeof path !== 'string') return false;

    // 위험한 패턴 차단
    const dangerousPatterns = [
        '..',           // 경로 traversal
        '.json',        // Firebase REST API 엔드포인트
        '.priority',    // Firebase 내부 키
        '.value',       // Firebase 내부 키
        '.info',        // Firebase 시스템 경로
    ];

    return !dangerousPatterns.some(pattern => path.includes(pattern));
}

