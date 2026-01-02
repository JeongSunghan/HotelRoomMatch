/**
 * sanitize 테스트
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

describe('sanitize', () => {
    describe('escapeHtml', () => {
        it('HTML 특수문자 이스케이프', () => {
            expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
            expect(escapeHtml('Hello & World')).toBe('Hello &amp; World');
            expect(escapeHtml("It's a test")).toBe('It&#039;s a test');
        });

        it('문자열이 아닌 경우 그대로 반환', () => {
            expect(escapeHtml(123)).toBe(123);
            expect(escapeHtml(null)).toBe(null);
        });
    });

    describe('sanitizeString', () => {
        it('HTML 태그 제거', () => {
            expect(sanitizeString('<p>Hello</p>')).toBe('Hello');
        });

        it('최대 길이 제한', () => {
            const longString = 'a'.repeat(200);
            expect(sanitizeString(longString, { maxLength: 100 }).length).toBe(100);
        });

        it('앞뒤 공백 제거', () => {
            expect(sanitizeString('  Hello  ')).toBe('Hello');
        });
    });

    describe('sanitizeName', () => {
        it('한글, 영문, 공백만 허용', () => {
            expect(sanitizeName('홍길동')).toBe('홍길동');
            expect(sanitizeName('John Doe')).toBe('John Doe');
            expect(sanitizeName('홍길동123')).toBe('홍길동');
            // HTML 태그 제거 후 한글/영문이 남으면 유지됨
            expect(sanitizeName('<script>alert("xss")</script>')).toBe('alertxss');
        });

        it('HTML 태그 제거', () => {
            expect(sanitizeName('<p>홍길동</p>')).toBe('홍길동');
        });

        it('최대 50자 제한', () => {
            const longName = '가'.repeat(100);
            expect(sanitizeName(longName).length).toBe(50);
        });

        it('문자열이 아닌 경우 빈 문자열 반환', () => {
            expect(sanitizeName(123)).toBe('');
            expect(sanitizeName(null)).toBe('');
        });
    });

    describe('sanitizeCompany', () => {
        it('회사명 정리', () => {
            expect(sanitizeCompany('  삼성전자  ')).toBe('삼성전자');
            // sanitizeCompany는 HTML 태그만 제거하고 나머지는 유지
            expect(sanitizeCompany('<script>test</script>')).toBe('test');
        });

        it('최대 100자 제한', () => {
            const longCompany = '가'.repeat(150);
            expect(sanitizeCompany(longCompany).length).toBe(100);
        });
    });

    describe('sanitizeNumber', () => {
        it('숫자만 추출', () => {
            expect(sanitizeNumber('123abc456')).toBe('123456');
            expect(sanitizeNumber('abc')).toBe('');
            expect(sanitizeNumber('123')).toBe('123');
        });
    });

    describe('sanitizeUserData', () => {
        it('사용자 데이터 전체 정리', () => {
            const userData = {
                name: '<script>test</script>홍길동',
                company: '  삼성전자  ',
                residentIdFront: '990101',
                residentIdBack: '1234567',
                age: '25',
                snoring: 'yes'
            };

            const sanitized = sanitizeUserData(userData);
            // sanitizeName은 HTML 태그 제거 후 한글/영문을 유지
            expect(sanitized.name).toBe('test홍길동');
            expect(sanitized.company).toBe('삼성전자');
            expect(sanitized.residentIdFront).toBe('990101');
            expect(sanitized.residentIdBack).toBe('1234567');
            expect(sanitized.age).toBe(25);
            expect(sanitized.snoring).toBe('yes');
        });

        it('유효하지 않은 snoring 값은 no로 기본값 설정', () => {
            const userData = { snoring: 'invalid' };
            const sanitized = sanitizeUserData(userData);
            expect(sanitized.snoring).toBe('no');
        });
    });

    describe('sanitizeEmail', () => {
        it('소문자 변환 및 공백 제거', () => {
            expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
        });

        it('문자열이 아닌 경우 빈 문자열 반환', () => {
            expect(sanitizeEmail(123)).toBe('');
        });
    });

    describe('isValidEmail', () => {
        it('유효한 이메일 통과', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
        });

        it('무효한 이메일 실패', () => {
            expect(isValidEmail('invalid')).toBe(false);
            expect(isValidEmail('test@')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('')).toBe(false);
        });
    });

    describe('emailToKey', () => {
        it('유효한 이메일을 키로 변환', () => {
            const key = emailToKey('test@example.com');
            expect(key).toBeTruthy();
            expect(typeof key).toBe('string');
        });

        it('무효한 이메일은 null 반환', () => {
            expect(emailToKey('invalid')).toBeNull();
        });
    });

    describe('isValidRoomNumber', () => {
        it('유효한 방번호 통과', () => {
            expect(isValidRoomNumber('601')).toBe(true);
            expect(isValidRoomNumber('701')).toBe(true);
            expect(isValidRoomNumber('1001')).toBe(true);
            expect(isValidRoomNumber('1207')).toBe(true);
        });

        it('무효한 방번호 실패', () => {
            expect(isValidRoomNumber('501')).toBe(false);
            expect(isValidRoomNumber('1301')).toBe(false);
            expect(isValidRoomNumber('60')).toBe(false);
            expect(isValidRoomNumber('10001')).toBe(false);
            expect(isValidRoomNumber('../rooms')).toBe(false);
        });

        it('문자열이 아닌 경우 false 반환', () => {
            expect(isValidRoomNumber(601)).toBe(false);
            expect(isValidRoomNumber(null)).toBe(false);
        });
    });

    describe('isValidSessionId', () => {
        it('유효한 세션 ID 통과', () => {
            expect(isValidSessionId('session_abc123')).toBe(true);
            expect(isValidSessionId('admin-xyz789')).toBe(true);
        });

        it('무효한 세션 ID 실패', () => {
            expect(isValidSessionId('invalid')).toBe(false);
            expect(isValidSessionId('session_../')).toBe(false);
            expect(isValidSessionId('')).toBe(false);
        });

        it('문자열이 아닌 경우 false 반환', () => {
            expect(isValidSessionId(123)).toBe(false);
            expect(isValidSessionId(null)).toBe(false);
        });
    });

    describe('isSafeFirebasePath', () => {
        it('안전한 경로 통과', () => {
            expect(isSafeFirebasePath('users/session123')).toBe(true);
            expect(isSafeFirebasePath('rooms/601')).toBe(true);
        });

        it('위험한 패턴 차단', () => {
            expect(isSafeFirebasePath('users/../admin')).toBe(false);
            expect(isSafeFirebasePath('users/.json')).toBe(false);
            expect(isSafeFirebasePath('users/.priority')).toBe(false);
        });

        it('문자열이 아닌 경우 false 반환', () => {
            expect(isSafeFirebasePath(123)).toBe(false);
            expect(isSafeFirebasePath(null)).toBe(false);
        });
    });
});

