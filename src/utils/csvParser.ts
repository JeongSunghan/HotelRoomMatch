/**
 * CSV 파싱 유틸리티
 * 쉼표(,) 또는 탭(\t) 구분자 지원
 */
import type { Gender } from '../types';

/**
 * CSV 파싱 결과 행 데이터
 */
export interface ParsedCSVRow {
    name: string;
    email: string;
    company: string;
    gender: Gender | '';
    age: number | null;
    roomNumber: string;
}

/**
 * CSV 텍스트를 파싱하여 객체 배열로 변환
 * @param csvText - CSV 문자열
 * @returns 파싱된 데이터 배열
 */
export function parseCSV(csvText: string): ParsedCSVRow[] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        throw new Error('CSV 파일에 데이터가 없습니다.');
    }

    // 구분자 자동 감지 (탭 vs 쉼표)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    // 헤더 파싱 (첫 줄)
    const headers = parseCSVLine(firstLine, delimiter).map(h => h.trim().toLowerCase());

    // 필수 헤더 확인
    const requiredHeaders = ['이름', 'name'];
    const hasNameHeader = headers.some(h =>
        requiredHeaders.includes(h) || h === '이름' || h === 'name'
    );

    if (!hasNameHeader) {
        throw new Error('CSV에 "이름" 또는 "name" 열이 필요합니다.');
    }

    // 데이터 파싱
    const data: ParsedCSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line, delimiter);
        const row: Record<string, string> = {};

        headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim() || '';
        });

        // 필수 필드 매핑
        const name = row['이름'] || row['name'] || '';
        const email = row['이메일'] || row['email'] || ''; // 이메일 필드 추가

        if (!name) continue;

        data.push({
            name,
            email: email, // 이메일
            company: row['소속'] || row['회사'] || row['company'] || '',
            gender: normalizeGender(row['성별'] || row['gender'] || '') as Gender | '',
            age: parseInt(row['출생연도'] || row['나이'] || row['age'] || row['birthyear'] || '0', 10) || null,
            roomNumber: row['방번호'] || row['room'] || row['roomnumber'] || ''
        });
    }

    return data;
}

/**
 * CSV 라인 파싱 (쉼표/탭, 따옴표 처리)
 * @param line - CSV 라인
 * @param delimiter - 구분자 (, 또는 \t)
 * @returns 파싱된 값 배열
 */
function parseCSVLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

/**
 * 성별 값 정규화
 * @param gender - 성별 문자열
 * @returns 정규화된 성별 ('M', 'F', 또는 원본)
 */
function normalizeGender(gender: string): string {
    const normalized = gender.trim().toUpperCase();
    
    if (normalized === 'M' || normalized === '남' || normalized === '남성' || normalized === 'MALE') {
        return 'M';
    }
    if (normalized === 'F' || normalized === '여' || normalized === '여성' || normalized === 'FEMALE') {
        return 'F';
    }
    
    return gender;
}

