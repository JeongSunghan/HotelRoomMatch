/**
 * genderUtils.js 테스트
 * 주민번호에서 성별 추출 로직 테스트
 */
import { describe, it, expect } from 'vitest';
import { getGenderFromResidentId } from '../genderUtils';

describe('getGenderFromResidentId', () => {
    describe('남성 (1, 3, 5, 7)', () => {
        it('should return "M" for gender code 1 (1900s male)', () => {
            expect(getGenderFromResidentId('1')).toBe('M');
        });

        it('should return "M" for gender code 3 (2000s male)', () => {
            expect(getGenderFromResidentId('3')).toBe('M');
        });

        it('should return "M" for gender code 5 (foreigner male)', () => {
            expect(getGenderFromResidentId('5')).toBe(null); // 5는 지원 안함
        });

        it('should return "M" for gender code 7', () => {
            expect(getGenderFromResidentId('7')).toBe(null); // 7은 지원 안함
        });
    });

    describe('여성 (2, 4, 6, 8)', () => {
        it('should return "F" for gender code 2 (1900s female)', () => {
            expect(getGenderFromResidentId('2')).toBe('F');
        });

        it('should return "F" for gender code 4 (2000s female)', () => {
            expect(getGenderFromResidentId('4')).toBe('F');
        });

        it('should return "F" for gender code 6 (foreigner female)', () => {
            expect(getGenderFromResidentId('6')).toBe(null); // 6은 지원 안함
        });

        it('should return "F" for gender code 8', () => {
            expect(getGenderFromResidentId('8')).toBe(null); // 8은 지원 안함
        });
    });

    describe('잘못된 입력 처리', () => {
        it('should return null for invalid gender code (0)', () => {
            expect(getGenderFromResidentId('0')).toBe(null);
        });

        it('should return null for invalid gender code (9)', () => {
            expect(getGenderFromResidentId('9')).toBe(null);
        });

        it('should return null for empty string', () => {
            expect(getGenderFromResidentId('')).toBe(null);
        });

        it('should return null for null input', () => {
            expect(getGenderFromResidentId(null)).toBe(null);
        });

        it('should return null for undefined input', () => {
            expect(getGenderFromResidentId(undefined)).toBe(null);
        });

        it('should return null for non-string input', () => {
            expect(getGenderFromResidentId(1234567)).toBe(null);
        });

        it('should return null for too short input', () => {
            expect(getGenderFromResidentId('')).toBe(null);
        });
    });

    describe('엣지 케이스', () => {
        it('should handle string with extra characters (takes first char)', () => {
            // 첫 번째 문자가 성별 코드
            expect(getGenderFromResidentId('1234567')).toBe(null); // 전체 문자열과 일치하지 않으므로 null
        });

        it('should handle whitespace (trim 적용)', () => {
            expect(getGenderFromResidentId('  1  ')).toBe('M'); // trim 후 '1'
            expect(getGenderFromResidentId(' 2 ')).toBe('F'); // trim 후 '2'
        });
    });
});
