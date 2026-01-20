/**
 * matchingUtils.js 테스트
 * 룸메이트 매칭 적합성 검사 로직 테스트
 */
import { describe, it, expect } from 'vitest';
import { checkCompatibility } from '../matchingUtils';

describe('checkCompatibility', () => {
    describe('나이 차이 검증', () => {
        it('should warn when age difference exceeds tolerance', () => {
            const me = { age: 25, ageTolerance: 5, snoring: 'no' };
            const roommate = { age: 35, snoring: 'no' };

            const warnings = checkCompatibility(me, roommate);

            expect(warnings).toHaveLength(1);
            expect(warnings[0]).toContain('나이 차이가 10살');
            expect(warnings[0]).toContain('허용 범위: ±5살');
        });

        it('should not warn when age difference is within tolerance', () => {
            const me = { age: 25, ageTolerance: 10, snoring: 'no' };
            const roommate = { age: 30, snoring: 'no' };

            const warnings = checkCompatibility(me, roommate);

            expect(warnings).toHaveLength(0);
        });

        it('should use default tolerance of 5 when not specified', () => {
            const me = { age: 25, snoring: 'no' }; // ageTolerance 미지정
            const roommate = { age: 32, snoring: 'no' };

            const warnings = checkCompatibility(me, roommate);

            expect(warnings).toHaveLength(1);
            expect(warnings[0]).toContain('허용 범위: ±5살');
        });

        it('should not warn when ages are missing', () => {
            const me = { snoring: 'no' };
            const roommate = { snoring: 'no' };

            const warnings = checkCompatibility(me, roommate);

            expect(warnings).toHaveLength(0);
        });

        it('should not warn when only one age is missing', () => {
            const me = { age: 25, snoring: 'no' };
            const roommate = { snoring: 'no' };

            const warnings = checkCompatibility(me, roommate);

            expect(warnings).toHaveLength(0);
        });
    });

    describe('코골이 검증', () => {
        describe('상대방이 코를 고는 경우', () => {
            it('should warn when roommate snores severely and I am sensitive', () => {
                const me = { snoring: 'no' };
                const roommate = { snoring: 'yes' };

                const warnings = checkCompatibility(me, roommate);

                expect(warnings).toContain('룸메이트가 "코골이 심함" 상태입니다.');
            });

            it('should warn when roommate snores severely and I snore sometimes', () => {
                const me = { snoring: 'sometimes' };
                const roommate = { snoring: 'yes' };

                const warnings = checkCompatibility(me, roommate);

                expect(warnings).toContain('룸메이트가 "코골이 심함" 상태입니다.');
            });

            it('should not warn when both snore severely', () => {
                const me = { snoring: 'yes' };
                const roommate = { snoring: 'yes' };

                const warnings = checkCompatibility(me, roommate);

                // "내가 코를 심하게 고는 경우" 경고는 상대가 'no'나 'sometimes'일 때만
                expect(warnings).not.toContain('룸메이트가 "코골이 심함" 상태입니다.');
            });

            it('should warn when roommate snores sometimes and I am very sensitive', () => {
                const me = { snoring: 'no' };
                const roommate = { snoring: 'sometimes' };

                const warnings = checkCompatibility(me, roommate);

                expect(warnings).toContain('룸메이트가 코를 가끔 곯니다.');
            });

            it('should not warn when roommate snores sometimes and I also snore sometimes', () => {
                const me = { snoring: 'sometimes' };
                const roommate = { snoring: 'sometimes' };

                const warnings = checkCompatibility(me, roommate);

                expect(warnings).toHaveLength(0);
            });
        });

        describe('내가 코를 고는 경우', () => {
            it('should warn when I snore severely and roommate is sensitive', () => {
                const me = { snoring: 'yes' };
                const roommate = { snoring: 'no' };

                const warnings = checkCompatibility(me, roommate);

                expect(warnings).toContain('본인의 코골이 성향(심함)으로 인해 룸메이트가 불편해할 수 있습니다.');
            });

            it('should warn when I snore severely and roommate snores sometimes', () => {
                const me = { snoring: 'yes' };
                const roommate = { snoring: 'sometimes' };

                const warnings = checkCompatibility(me, roommate);

                expect(warnings).toContain('본인의 코골이 성향(심함)으로 인해 룸메이트가 불편해할 수 있습니다.');
            });
        });

        describe('양쪽 모두 코골이 없음', () => {
            it('should not warn when both do not snore', () => {
                const me = { snoring: 'no' };
                const roommate = { snoring: 'no' };

                const warnings = checkCompatibility(me, roommate);

                expect(warnings).toHaveLength(0);
            });
        });
    });

    describe('복합 경고', () => {
        it('should return multiple warnings when both age and snoring are incompatible', () => {
            const me = { age: 25, ageTolerance: 3, snoring: 'no' };
            const roommate = { age: 35, snoring: 'yes' };

            const warnings = checkCompatibility(me, roommate);

            expect(warnings).toHaveLength(2);
            expect(warnings.some(w => w.includes('나이 차이'))).toBe(true);
            expect(warnings.some(w => w.includes('코골이'))).toBe(true);
        });

        it('should return warnings in correct order', () => {
            const me = { age: 20, ageTolerance: 2, snoring: 'yes' };
            const roommate = { age: 30, snoring: 'no' };

            const warnings = checkCompatibility(me, roommate);

            // 나이 경고가 먼저, 코골이 경고가 나중
            expect(warnings[0]).toContain('나이 차이');
            expect(warnings[1]).toContain('본인의 코골이');
        });
    });

    describe('엣지 케이스', () => {
        it('should handle empty objects', () => {
            const warnings = checkCompatibility({}, {});
            expect(warnings).toHaveLength(0);
        });

        it('should handle null values gracefully', () => {
            const me = { age: null, snoring: null };
            const roommate = { age: null, snoring: null };

            const warnings = checkCompatibility(me, roommate);
            expect(warnings).toHaveLength(0);
        });

        it('should handle undefined snoring values', () => {
            const me = { age: 25 };
            const roommate = { age: 25 };

            const warnings = checkCompatibility(me, roommate);
            expect(warnings).toHaveLength(0);
        });

        it('should handle zero age difference', () => {
            const me = { age: 25, ageTolerance: 5, snoring: 'no' };
            const roommate = { age: 25, snoring: 'no' };

            const warnings = checkCompatibility(me, roommate);
            expect(warnings).toHaveLength(0);
        });

        it('should handle exact tolerance boundary', () => {
            const me = { age: 25, ageTolerance: 5, snoring: 'no' };
            const roommate = { age: 30, snoring: 'no' }; // 정확히 5살 차이

            const warnings = checkCompatibility(me, roommate);
            expect(warnings).toHaveLength(0); // 5살 차이는 허용 (> 가 아닌 경우)
        });

        it('should warn at tolerance boundary + 1', () => {
            const me = { age: 25, ageTolerance: 5, snoring: 'no' };
            const roommate = { age: 31, snoring: 'no' }; // 6살 차이

            const warnings = checkCompatibility(me, roommate);
            expect(warnings).toHaveLength(1);
            expect(warnings[0]).toContain('나이 차이가 6살');
        });
    });
});
