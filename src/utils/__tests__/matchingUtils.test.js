/**
 * matchingUtils 테스트
 */
import { describe, it, expect } from 'vitest';
import { checkCompatibility } from '../matchingUtils';

describe('matchingUtils', () => {
    describe('checkCompatibility', () => {
        it('나이 차이가 허용 범위 내일 때 경고 없음', () => {
            const me = { age: 25, ageTolerance: 5 };
            const roommate = { age: 27 };
            
            const warnings = checkCompatibility(me, roommate);
            expect(warnings).toEqual([]);
        });

        it('나이 차이가 허용 범위를 초과할 때 경고 발생', () => {
            const me = { age: 25, ageTolerance: 5 };
            const roommate = { age: 32 };
            
            const warnings = checkCompatibility(me, roommate);
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0]).toContain('나이 차이');
        });

        it('나이 정보가 없을 때 경고 없음', () => {
            const me = { ageTolerance: 5 };
            const roommate = {};
            
            const warnings = checkCompatibility(me, roommate);
            expect(warnings).toEqual([]);
        });

        it('기본 허용 범위가 5살일 때 올바르게 동작', () => {
            const me = { age: 25 };
            const roommate = { age: 31 };
            
            const warnings = checkCompatibility(me, roommate);
            expect(warnings.length).toBeGreaterThan(0);
        });

        it('룸메이트가 코골이 심함이고 내가 예민할 때 경고', () => {
            const me = { snoring: 'no' };
            const roommate = { snoring: 'yes' };
            
            const warnings = checkCompatibility(me, roommate);
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0]).toContain('코골이 심함');
        });

        it('룸메이트가 코골이 가끔이고 내가 예민할 때 경고', () => {
            const me = { snoring: 'no' };
            const roommate = { snoring: 'sometimes' };
            
            const warnings = checkCompatibility(me, roommate);
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0]).toContain('가끔');
        });

        it('내가 코골이 심함이고 룸메이트가 예민할 때 경고', () => {
            const me = { snoring: 'yes' };
            const roommate = { snoring: 'no' };
            
            const warnings = checkCompatibility(me, roommate);
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0]).toContain('본인의 코골이');
        });

        it('둘 다 코골이 없을 때 경고 없음', () => {
            const me = { snoring: 'no' };
            const roommate = { snoring: 'no' };
            
            const warnings = checkCompatibility(me, roommate);
            expect(warnings).toEqual([]);
        });

        it('복합 조건: 나이 차이 + 코골이 경고', () => {
            const me = { age: 25, ageTolerance: 5, snoring: 'no' };
            const roommate = { age: 32, snoring: 'yes' };
            
            const warnings = checkCompatibility(me, roommate);
            expect(warnings.length).toBeGreaterThanOrEqual(2);
        });

        it('경고가 없을 때 빈 배열 반환', () => {
            const me = { age: 25, ageTolerance: 5, snoring: 'no' };
            const roommate = { age: 27, snoring: 'no' };
            
            const warnings = checkCompatibility(me, roommate);
            expect(warnings).toEqual([]);
        });
    });
});

