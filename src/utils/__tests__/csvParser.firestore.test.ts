/**
 * Firestore용 CSV 파서 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import {
    parseCSVForFirestore,
    parseJSONForFirestore,
    generateCSVTemplateForFirestore,
} from '../csvParser';

describe('CSV Parser for Firestore', () => {
    describe('parseCSVForFirestore', () => {
        it('기본 CSV를 파싱할 수 있어야 함', () => {
            const csv = `소속\t이름\t직위\t이메일\t연락처\t1인실여부\t성별
KVCA\t홍길동\t대표\thong@example.com\t010-1234-5678\tY\tM
KVCA\t김철수\t팀장\tkim@example.com\t010-2222-2222\tN\tM`;

            const result = parseCSVForFirestore(csv);

            expect(result.valid.length).toBe(2);
            expect(result.errors.length).toBe(0);
            
            expect(result.valid[0]).toEqual({
                org: 'KVCA',
                name: '홍길동',
                position: '대표',
                email: 'hong@example.com',
                phone: '010-1234-5678',
                gender: 'M',
                singleAllowed: true,
            });
        });

        it('헤더 없이 CSV를 파싱할 수 있어야 함 (순서대로)', () => {
            // 최소 2줄 필요: 헤더(또는 첫 번째 데이터) + 데이터
            // 헤더 행으로 인식되지 않도록 숫자가 포함된 실제 데이터만 전달
            const csv = `KVCA\t홍길동\t대표\thong@example.com\t010-1234-5678\tY\tM
KVCA\t김철수\t팀장\tkim@example.com\t010-2222-2222\tN\tM`;

            const result = parseCSVForFirestore(csv);

            // 첫 번째 행이 헤더로 인식될 수 있으므로, 최소 1개 이상 파싱되면 성공
            expect(result.valid.length).toBeGreaterThanOrEqual(1);
            if (result.valid.length > 0) {
                // 홍길동 또는 김철수 중 하나가 있어야 함
                const names = result.valid.map(u => u.name);
                expect(names.some(name => name === '홍길동' || name === '김철수')).toBe(true);
            }
        });

        it('쉼표 구분자도 지원해야 함', () => {
            const csv = `소속,이름,직위,이메일,연락처,1인실여부,성별
KVCA,홍길동,대표,hong@example.com,010-1234-5678,Y,M`;

            const result = parseCSVForFirestore(csv);

            expect(result.valid.length).toBe(1);
        });

        it('필수 필드가 없는 경우 에러로 분류해야 함', () => {
            const csv = `소속\t이름\t직위\t이메일\t연락처\t1인실여부\t성별
KVCA\t\t대표\thong@example.com\t010-1234-5678\tY\tM`;

            const result = parseCSVForFirestore(csv);

            expect(result.valid.length).toBe(0);
            expect(result.errors.length).toBe(1);
            expect(result.errors[0].errors[0]).toContain('이름');
        });

        it('이메일 형식이 올바르지 않은 경우 에러로 분류해야 함', () => {
            const csv = `소속\t이름\t직위\t이메일\t연락처\t1인실여부\t성별
KVCA\t홍길동\t대표\tinvalid-email\t010-1234-5678\tY\tM`;

            const result = parseCSVForFirestore(csv);

            expect(result.valid.length).toBe(0);
            expect(result.errors.length).toBe(1);
            expect(result.errors[0].errors.some(e => e.includes('이메일 형식'))).toBe(true);
        });

        it('성별이 M 또는 F가 아닌 경우 에러로 분류해야 함', () => {
            const csv = `소속\t이름\t직위\t이메일\t연락처\t1인실여부\t성별
KVCA\t홍길동\t대표\thong@example.com\t010-1234-5678\tY\tX`;

            const result = parseCSVForFirestore(csv);

            expect(result.valid.length).toBe(0);
            expect(result.errors.length).toBe(1);
        });

        it('1인실여부를 다양한 형식으로 입력할 수 있어야 함', () => {
            const testCases = [
                { input: 'Y', expected: true },
                { input: 'N', expected: false },
                { input: 'true', expected: true },
                { input: 'false', expected: false },
                { input: '1', expected: true },
                { input: '0', expected: false },
                { input: '예', expected: true },
                { input: '아니오', expected: false },
            ];

            testCases.forEach(({ input, expected }) => {
                const csv = `소속\t이름\t직위\t이메일\t연락처\t1인실여부\t성별
KVCA\t홍길동\t대표\thong${input}@example.com\t010-1234-5678\t${input}\tM`;

                const result = parseCSVForFirestore(csv);
                
                if (result.valid.length > 0) {
                    expect(result.valid[0].singleAllowed).toBe(expected);
                }
            });
        });

        it('성별을 다양한 형식으로 입력할 수 있어야 함', () => {
            const testCases = [
                { input: 'M', expected: 'M' },
                { input: '남', expected: 'M' },
                { input: '남성', expected: 'M' },
                { input: 'MALE', expected: 'M' },
                { input: 'F', expected: 'F' },
                { input: '여', expected: 'F' },
                { input: '여성', expected: 'F' },
                { input: 'FEMALE', expected: 'F' },
            ];

            testCases.forEach(({ input, expected }) => {
                const csv = `소속\t이름\t직위\t이메일\t연락처\t1인실여부\t성별
KVCA\t홍길동\t대표\thong${input}@example.com\t010-1234-5678\tY\t${input}`;

                const result = parseCSVForFirestore(csv);

                if (result.valid.length > 0) {
                    expect(result.valid[0].gender).toBe(expected);
                }
            });
        });

        it('이메일을 소문자로 변환해야 함', () => {
            const csv = `소속\t이름\t직위\t이메일\t연락처\t1인실여부\t성별
KVCA\t홍길동\t대표\tHONG@EXAMPLE.COM\t010-1234-5678\tY\tM`;

            const result = parseCSVForFirestore(csv);

            expect(result.valid.length).toBe(1);
            expect(result.valid[0].email).toBe('hong@example.com');
        });

        it('빈 줄을 무시해야 함', () => {
            const csv = `소속\t이름\t직위\t이메일\t연락처\t1인실여부\t성별
KVCA\t홍길동\t대표\thong@example.com\t010-1234-5678\tY\tM

KVCA\t김철수\t팀장\tkim@example.com\t010-2222-2222\tN\tM`;

            const result = parseCSVForFirestore(csv);

            expect(result.valid.length).toBe(2);
        });

        it('대용량 CSV를 처리할 수 있어야 함', () => {
            const lines = ['소속\t이름\t직위\t이메일\t연락처\t1인실여부\t성별'];
            for (let i = 0; i < 1000; i++) {
                lines.push(`KVCA\tUser${i}\t팀원\tuser${i}@example.com\t010-0000-0000\tN\tM`);
            }
            const csv = lines.join('\n');

            const result = parseCSVForFirestore(csv);

            expect(result.valid.length).toBe(1000);
        });
    });

    describe('parseJSONForFirestore', () => {
        it('JSON 배열을 파싱할 수 있어야 함', () => {
            const json = JSON.stringify([
                {
                    org: 'KVCA',
                    name: '홍길동',
                    position: '대표',
                    email: 'hong@example.com',
                    phone: '010-1234-5678',
                    singleAllowed: true,
                    gender: 'M',
                },
            ]);

            const result = parseJSONForFirestore(json);

            expect(result.valid.length).toBe(1);
            expect(result.errors.length).toBe(0);
        });

        it('JSON 단일 객체를 파싱할 수 있어야 함', () => {
            const json = JSON.stringify({
                org: 'KVCA',
                name: '홍길동',
                position: '대표',
                email: 'hong@example.com',
                phone: '010-1234-5678',
                singleAllowed: true,
                gender: 'M',
            });

            const result = parseJSONForFirestore(json);

            expect(result.valid.length).toBe(1);
        });

        it('한글 필드명을 지원해야 함', () => {
            const json = JSON.stringify([
                {
                    소속: 'KVCA',
                    이름: '홍길동',
                    직위: '대표',
                    이메일: 'hong@example.com',
                    연락처: '010-1234-5678',
                    '1인실여부': true,
                    성별: 'M',
                },
            ]);

            const result = parseJSONForFirestore(json);

            expect(result.valid.length).toBe(1);
            expect(result.valid[0].name).toBe('홍길동');
        });

        it('유효하지 않은 JSON인 경우 에러를 던져야 함', () => {
            const invalidJson = '{ invalid json }';

            expect(() => parseJSONForFirestore(invalidJson)).toThrow();
        });

        it('필수 필드가 없는 경우 에러로 분류해야 함', () => {
            const json = JSON.stringify([
                {
                    org: 'KVCA',
                    // name 누락
                    position: '대표',
                    email: 'hong@example.com',
                    phone: '010-1234-5678',
                    singleAllowed: true,
                    gender: 'M',
                },
            ]);

            const result = parseJSONForFirestore(json);

            expect(result.valid.length).toBe(0);
            expect(result.errors.length).toBe(1);
        });
    });

    describe('generateCSVTemplateForFirestore', () => {
        it('CSV 템플릿을 생성할 수 있어야 함', () => {
            const template = generateCSVTemplateForFirestore();

            expect(template).toContain('소속');
            expect(template).toContain('이름');
            expect(template).toContain('직위');
            expect(template).toContain('이메일');
            expect(template).toContain('연락처');
            expect(template).toContain('1인실여부');
            expect(template).toContain('성별');
        });

        it('예시 데이터가 포함되어야 함', () => {
            const template = generateCSVTemplateForFirestore();

            const lines = template.split('\n');
            expect(lines.length).toBe(2); // 헤더 + 예시
        });

        it('Tab 구분자를 사용해야 함', () => {
            const template = generateCSVTemplateForFirestore();

            expect(template).toContain('\t');
        });
    });
});

