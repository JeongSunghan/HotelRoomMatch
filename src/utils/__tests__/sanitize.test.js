/**
 * sanitize.js 유틸리티 함수 테스트
 * XSS 방지 및 입력 검증 테스트
 */
import { describe, it, expect } from 'vitest';
import {
    escapeHtml,
    sanitizeString,
    sanitizeName,
    sanitizeCompany,
    sanitizeNumber,
    sanitizeUserData,
    sanitizeEmail,
    isValidEmail,
    emailToKey,
    isValidRoomNumber,
    isValidSessionId,
    isSafeFirebasePath
} from '../sanitize';

describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>'))
            .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should escape &, <, >, ", \'', () => {
        expect(escapeHtml('&<>"\'test')).toBe('&amp;&lt;&gt;&quot;&#039;test');
    });

    it('should return non-string values as-is', () => {
        expect(escapeHtml(null)).toBe(null);
        expect(escapeHtml(undefined)).toBe(undefined);
        expect(escapeHtml(123)).toBe(123);
    });
});

describe('sanitizeString', () => {
    it('should remove HTML tags by default', () => {
        const input = '안녕하세요<script>alert("xss")</script>테스트';
        expect(sanitizeString(input)).toBe('안녕하세요alert("xss")테스트');
    });

    it('should trim whitespace by default', () => {
        expect(sanitizeString('  test  ')).toBe('test');
    });

    it('should limit max length', () => {
        const longString = 'a'.repeat(200);
        expect(sanitizeString(longString, { maxLength: 50 }).length).toBe(50);
    });

    it('should handle empty string', () => {
        expect(sanitizeString('')).toBe('');
    });
});

describe('sanitizeName', () => {
    it('should allow Korean characters', () => {
        expect(sanitizeName('홍길동')).toBe('홍길동');
    });

    it('should allow English characters', () => {
        expect(sanitizeName('John Doe')).toBe('John Doe');
    });

    it('should remove HTML tags', () => {
        expect(sanitizeName('홍<script>길</script>동')).toBe('홍길동');
    });

    it('should remove special characters except spaces', () => {
        expect(sanitizeName('홍길동123!@#')).toBe('홍길동');
    });

    it('should limit to 50 characters', () => {
        const longName = '가'.repeat(100);
        expect(sanitizeName(longName).length).toBe(50);
    });

    it('should return empty string for non-string input', () => {
        expect(sanitizeName(null)).toBe('');
        expect(sanitizeName(undefined)).toBe('');
        expect(sanitizeName(123)).toBe('');
    });
});

describe('sanitizeCompany', () => {
    it('should trim and remove HTML tags', () => {
        expect(sanitizeCompany('  주식회사<script>테스트</script>  '))
            .toBe('주식회사테스트');
    });

    it('should limit to 100 characters', () => {
        const longCompany = 'A'.repeat(200);
        expect(sanitizeCompany(longCompany).length).toBe(100);
    });

    it('should handle non-string input', () => {
        expect(sanitizeCompany(null)).toBe('');
    });
});

describe('sanitizeNumber', () => {
    it('should extract only numbers', () => {
        expect(sanitizeNumber('abc123def456')).toBe('123456');
    });

    it('should remove all non-numeric characters', () => {
        expect(sanitizeNumber('010-1234-5678')).toBe('01012345678');
    });

    it('should return empty string for text without numbers', () => {
        expect(sanitizeNumber('abcd')).toBe('');
    });

    it('should handle non-string input', () => {
        expect(sanitizeNumber(null)).toBe('');
    });
});

describe('sanitizeUserData', () => {
    it('should sanitize all user fields', () => {
        const input = {
            name: '홍길동<script>',
            company: '  회사명  ',
            residentIdFront: '990101',
            residentIdBack: '1234567',
            age: '30',
            snoring: 'yes'
        };

        const result = sanitizeUserData(input);

        expect(result.name).toBe('홍길동');
        expect(result.company).toBe('회사명');
        expect(result.residentIdFront).toBe('990101');
        expect(result.residentIdBack).toBe('1234567');
        expect(result.age).toBe(30);
        expect(result.snoring).toBe('yes');
    });

    it('should handle missing fields', () => {
        const result = sanitizeUserData({});

        expect(result.name).toBe('');
        expect(result.company).toBe('');
        expect(result.residentIdFront).toBe('');
        expect(result.residentIdBack).toBe('');
        expect(result.age).toBe(null);
        expect(result.snoring).toBe('no');
    });

    it('should default invalid snoring values to "no"', () => {
        expect(sanitizeUserData({ snoring: 'invalid' }).snoring).toBe('no');
        expect(sanitizeUserData({ snoring: 'yes' }).snoring).toBe('yes');
        expect(sanitizeUserData({ snoring: 'sometimes' }).snoring).toBe('sometimes');
    });
});

describe('sanitizeEmail', () => {
    it('should convert to lowercase and trim', () => {
        expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });

    it('should handle non-string input', () => {
        expect(sanitizeEmail(null)).toBe('');
    });
});

describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
        expect(isValidEmail('test.user@company.co.kr')).toBe(true);
        expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('user@example')).toBe(false);
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail(null)).toBe(false);
    });
});

describe('emailToKey', () => {
    it('should convert email to Base64 key', () => {
        const result = emailToKey('test@example.com');
        expect(result).toBeTruthy();
        expect(result).not.toContain('='); // padding 제거 확인
    });

    it('should return null for invalid email', () => {
        expect(emailToKey('invalid')).toBe(null);
        expect(emailToKey('')).toBe(null);
    });
});

describe('isValidRoomNumber', () => {
    it('should accept valid room numbers', () => {
        expect(isValidRoomNumber('601')).toBe(true);
        expect(isValidRoomNumber('701')).toBe(true);
        expect(isValidRoomNumber('801')).toBe(true);
        expect(isValidRoomNumber('1001')).toBe(true);
        expect(isValidRoomNumber('1101')).toBe(true);
        expect(isValidRoomNumber('1201')).toBe(true);
    });

    it('should reject invalid room numbers', () => {
        expect(isValidRoomNumber('101')).toBe(false);  // 1층 (지원 안함)
        expect(isValidRoomNumber('501')).toBe(false);  // 5층 (지원 안함)
        expect(isValidRoomNumber('1301')).toBe(false); // 13층 (지원 안함)
        expect(isValidRoomNumber('abc')).toBe(false);
        expect(isValidRoomNumber('')).toBe(false);
    });

    it('should reject path traversal attempts', () => {
        expect(isValidRoomNumber('../601')).toBe(false);
        expect(isValidRoomNumber('601/../../')).toBe(false);
        expect(isValidRoomNumber('601\\..\\')).toBe(false);
    });

    it('should handle non-string input', () => {
        expect(isValidRoomNumber(null)).toBe(false);
        expect(isValidRoomNumber(601)).toBe(false);
    });
});

describe('isValidSessionId', () => {
    it('should validate correct session ID formats', () => {
        expect(isValidSessionId('session_abc123-def456')).toBe(true);
        expect(isValidSessionId('admin-user123')).toBe(true);
    });

    it('should reject invalid session ID formats', () => {
        expect(isValidSessionId('invalid')).toBe(false);
        expect(isValidSessionId('user_123')).toBe(false); // 잘못된 접두사
        expect(isValidSessionId('')).toBe(false);
    });

    it('should reject path traversal attempts', () => {
        expect(isValidSessionId('session_../admin')).toBe(false);
        expect(isValidSessionId('session_test/path')).toBe(false);
    });

    it('should enforce max length of 100', () => {
        const longId = 'session_' + 'a'.repeat(200);
        expect(isValidSessionId(longId)).toBe(false);
    });

    it('should handle non-string input', () => {
        expect(isValidSessionId(null)).toBe(false);
    });
});

describe('isSafeFirebasePath', () => {
    it('should accept safe paths', () => {
        expect(isSafeFirebasePath('users/session123')).toBe(true);
        expect(isSafeFirebasePath('rooms/601')).toBe(true);
    });

    it('should reject path traversal', () => {
        expect(isSafeFirebasePath('users/../admin')).toBe(false);
    });

    it('should reject Firebase internal paths', () => {
        expect(isSafeFirebasePath('users.json')).toBe(false);
        expect(isSafeFirebasePath('data.priority')).toBe(false);
        expect(isSafeFirebasePath('data.value')).toBe(false);
        expect(isSafeFirebasePath('.info/connected')).toBe(false);
    });

    it('should handle non-string input', () => {
        expect(isSafeFirebasePath(null)).toBe(false);
    });
});
