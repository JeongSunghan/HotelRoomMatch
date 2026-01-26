/**
 * CSV 파싱 유틸리티
 * output.json 형식 지원: 소속명 | 성명 | 직위 | 이메일 | 1인실 여부 | 성별
 */

/**
 * CSV 텍스트를 파싱하여 객체 배열로 변환
 * @param {string} csvText - CSV 문자열
 * @returns {Array<Object>} 파싱된 데이터 배열
 */
export function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        throw new Error('CSV 파일에 데이터가 없습니다.');
    }

    // 구분자 자동 감지 (탭 vs 쉼표)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    // 헤더 파싱 (첫 줄)
    const headers = parseCSVLine(firstLine, delimiter).map(h => h.trim());

    // 필수 헤더 확인
    const requiredHeaders = ['성명', '이메일', '성별'];
    const missingHeaders = requiredHeaders.filter(required =>
        !headers.some(h => h === required || h.toLowerCase() === required.toLowerCase())
    );

    if (missingHeaders.length > 0) {
        throw new Error(`CSV에 필수 열이 없습니다: ${missingHeaders.join(', ')}`);
    }

    // 데이터 파싱
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line, delimiter);
        const row = {};

        headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim() || '';
        });

        // 필드 매핑 (output.json 형식)
        const name = row['성명'] || row['이름'] || row['name'] || '';
        const email = row['이메일'] || row['email'] || '';
        const company = row['소속명'] || row['소속'] || row['회사'] || row['company'] || '';
        const position = row['직위'] || row['position'] || '';
        const gender = normalizeGender(row['성별'] || row['gender'] || '');
        const singleRoom = normalizeSingleRoom(row['1인실 여부'] || row['1인실'] || '');

        if (!name || !email || !gender) continue;

        data.push({
            name,
            email,
            company,
            position,
            gender,
            singleRoom,
            // roomNumber는 자동 할당되므로 제거
        });
    }

    return data;
}

/**
 * CSV 라인 파싱 (쉼표/탭, 따옴표 처리)
 * @param {string} line - CSV 라인
 * @param {string} delimiter - 구분자 (, 또는 \t)
 */
function parseCSVLine(line, delimiter = ',') {
    const result = [];
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
 * 성별 정규화
 */
function normalizeGender(value) {
    const v = value.toLowerCase();
    if (v === 'm' || v === '남' || v === '남성' || v === 'male') return 'M';
    if (v === 'f' || v === '여' || v === '여성' || v === 'female') return 'F';
    return '';
}

/**
 * 1인실 여부 정규화
 */
function normalizeSingleRoom(value) {
    const v = value.toUpperCase().trim();
    if (v === 'Y' || v === 'YES' || v === '예' || v === '1인실') return true;
    if (v === 'N' || v === 'NO' || v === '아니오' || v === '2인실') return false;
    return false; // 기본값은 2인실
}

/**
 * 업로드 데이터 유효성 검사
 * @param {Array<Object>} data - 파싱된 데이터
 * @param {Object} roomData - 방 정보 (사용 안함, 자동 할당)
 * @returns {{valid: Array, errors: Array}}
 */
export function validateUploadData(data, roomData) {
    const valid = [];
    const errors = [];

    data.forEach((row, idx) => {
        const lineNum = idx + 2; // 헤더가 1줄이므로 +2
        const rowErrors = [];

        // 이름 필수
        if (!row.name) {
            rowErrors.push('성명이 없습니다.');
        }

        // 이메일 필수
        if (!row.email) {
            rowErrors.push('이메일이 없습니다.');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            rowErrors.push('이메일 형식이 올바르지 않습니다.');
        }

        // 성별 필수
        if (!row.gender) {
            rowErrors.push('성별이 없습니다.');
        } else if (row.gender !== 'M' && row.gender !== 'F') {
            rowErrors.push('성별은 M 또는 F여야 합니다.');
        }

        if (rowErrors.length > 0) {
            errors.push({ line: lineNum, data: row, errors: rowErrors });
        } else {
            valid.push(row);
        }
    });

    return { valid, errors };
}

/**
 * 샘플 CSV 템플릿 생성
 */
export function generateCSVTemplate() {
    const header = '소속명,성명,직위,이메일,1인실 여부,성별';
    const sample1 = 'ABC회사,홍길동,부장,hong@example.com,Y,M';
    const sample2 = 'XYZ그룹,김영희,과장,kim@example.com,N,F';
    return `${header}\n${sample1}\n${sample2}`;
}
