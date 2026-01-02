/**
 * genderUtils 테스트
 */
import { describe, it, expect } from 'vitest';
import {
    getGenderFromResidentId,
    getGenderLabel,
    validateResidentIdFront,
    validateResidentIdBack,
    validateResidentId,
    getBirthYearFromResidentId,
    getAgeFromResidentId
} from '../genderUtils';

describe('genderUtils', () => {
    describe('getGenderFromResidentId', () => {
        it('뒷자리 1은 남성 반환', () => {
            expect(getGenderFromResidentId('1')).toBe('M');
        });

        it('뒷자리 2는 여성 반환', () => {
            expect(getGenderFromResidentId('2')).toBe('F');
        });

        it('뒷자리 3은 남성 반환', () => {
            expect(getGenderFromResidentId('3')).toBe('M');
        });

        it('뒷자리 4는 여성 반환', () => {
            expect(getGenderFromResidentId('4')).toBe('F');
        });

        it('유효하지 않은 숫자는 null 반환', () => {
            expect(getGenderFromResidentId('5')).toBeNull();
            expect(getGenderFromResidentId('0')).toBeNull();
            expect(getGenderFromResidentId('9')).toBeNull();
        });

        it('공백 제거 후 처리', () => {
            expect(getGenderFromResidentId(' 1 ')).toBe('M');
            expect(getGenderFromResidentId(' 2 ')).toBe('F');
        });
    });

    describe('getGenderLabel', () => {
        it('M은 남성 반환', () => {
            expect(getGenderLabel('M')).toBe('남성');
        });

        it('F는 여성 반환', () => {
            expect(getGenderLabel('F')).toBe('여성');
        });

        it('유효하지 않은 값은 알 수 없음 반환', () => {
            expect(getGenderLabel('X')).toBe('알 수 없음');
            expect(getGenderLabel(null)).toBe('알 수 없음');
        });
    });

    describe('validateResidentIdFront', () => {
        it('유효한 주민번호 앞자리 통과', () => {
            expect(validateResidentIdFront('990101')).toBe(true);
            expect(validateResidentIdFront('001231')).toBe(true);
        });

        it('6자리 숫자가 아니면 실패', () => {
            expect(validateResidentIdFront('99010')).toBe(false);
            expect(validateResidentIdFront('9901011')).toBe(false);
            expect(validateResidentIdFront('abc123')).toBe(false);
        });

        it('월이 유효 범위를 벗어나면 실패', () => {
            expect(validateResidentIdFront('991301')).toBe(false);
            expect(validateResidentIdFront('990001')).toBe(false);
        });

        it('일이 유효 범위를 벗어나면 실패', () => {
            expect(validateResidentIdFront('990132')).toBe(false);
            expect(validateResidentIdFront('990000')).toBe(false);
        });
    });

    describe('validateResidentIdBack', () => {
        it('1-4는 유효', () => {
            expect(validateResidentIdBack('1')).toBe(true);
            expect(validateResidentIdBack('2')).toBe(true);
            expect(validateResidentIdBack('3')).toBe(true);
            expect(validateResidentIdBack('4')).toBe(true);
        });

        it('0, 5-9는 무효', () => {
            expect(validateResidentIdBack('0')).toBe(false);
            expect(validateResidentIdBack('5')).toBe(false);
            expect(validateResidentIdBack('9')).toBe(false);
        });

        it('공백 제거 후 처리', () => {
            expect(validateResidentIdBack(' 1 ')).toBe(true);
        });
    });

    describe('validateResidentId', () => {
        it('유효한 주민번호 통과', () => {
            const result = validateResidentId('990101', '1');
            expect(result.valid).toBe(true);
            expect(result.gender).toBe('M');
        });

        it('앞자리 무효시 실패', () => {
            const result = validateResidentId('990132', '1');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('뒷자리 무효시 실패', () => {
            const result = validateResidentId('990101', '5');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('getBirthYearFromResidentId', () => {
        it('1900년대생 (1, 2)', () => {
            expect(getBirthYearFromResidentId('990101', '1')).toBe(1999);
            expect(getBirthYearFromResidentId('990101', '2')).toBe(1999);
        });

        it('2000년대생 (3, 4)', () => {
            expect(getBirthYearFromResidentId('050101', '3')).toBe(2005);
            expect(getBirthYearFromResidentId('050101', '4')).toBe(2005);
        });

        it('유효하지 않은 주민번호는 null 반환', () => {
            expect(getBirthYearFromResidentId('990132', '1')).toBeNull();
            expect(getBirthYearFromResidentId('990101', '5')).toBeNull();
        });
    });

    describe('getAgeFromResidentId', () => {
        it('나이 계산 (대략적인 테스트)', () => {
            // 1999년생 (99) 테스트
            const age = getAgeFromResidentId('990101', '1');
            const currentYear = new Date().getFullYear();
            const expectedAge = currentYear - 1999;
            // 생일 전/후 고려하여 ±1 범위
            expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
            expect(age).toBeLessThanOrEqual(expectedAge);
        });

        it('2000년대생 나이 계산', () => {
            // 2005년생 (05) 테스트
            const age = getAgeFromResidentId('050101', '3');
            const currentYear = new Date().getFullYear();
            const expectedAge = currentYear - 2005;
            expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
            expect(age).toBeLessThanOrEqual(expectedAge);
        });

        it('유효하지 않은 주민번호는 null 반환', () => {
            expect(getAgeFromResidentId('990132', '1')).toBeNull();
        });
    });
});

