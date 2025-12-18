/**
 * CSV 파싱 유틸리티
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

    // 헤더 파싱 (첫 줄)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // 필수 헤더 확인
    const requiredHeaders = ['이름', 'name'];
    const hasNameHeader = headers.some(h =>
        requiredHeaders.includes(h) || h === '이름' || h === 'name'
    );

    if (!hasNameHeader) {
        throw new Error('CSV에 "이름" 또는 "name" 열이 필요합니다.');
    }

    // 데이터 파싱
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const row = {};

        headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim() || '';
        });

        // 필수 필드 매핑
        const name = row['이름'] || row['name'] || '';
        if (!name) continue;

        data.push({
            name,
            company: row['소속'] || row['회사'] || row['company'] || '',
            gender: normalizeGender(row['성별'] || row['gender'] || ''),
            age: parseInt(row['출생연도'] || row['나이'] || row['age'] || row['birthyear']) || null,
            roomNumber: row['방번호'] || row['room'] || row['roomnumber'] || ''
        });
    }

    return data;
}

/**
 * CSV 라인 파싱 (쉼표, 따옴표 처리)
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
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
 * 업로드 데이터 유효성 검사
 * @param {Array<Object>} data - 파싱된 데이터
 * @param {Object} roomData - 방 정보
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
            rowErrors.push('이름이 없습니다.');
        }

        // 방번호 필수
        if (!row.roomNumber) {
            rowErrors.push('방번호가 없습니다.');
        } else if (!roomData[row.roomNumber]) {
            rowErrors.push(`${row.roomNumber}호는 존재하지 않는 방입니다.`);
        }

        // 성별 체크 (방과 매칭)
        if (row.roomNumber && roomData[row.roomNumber]) {
            const room = roomData[row.roomNumber];
            if (row.gender && row.gender !== room.gender) {
                rowErrors.push(`성별(${row.gender})이 방(${room.gender})과 맞지 않습니다.`);
            }
            // 성별이 없으면 방 성별로 자동 설정
            if (!row.gender) {
                row.gender = room.gender;
            }
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
    const header = '이름,소속,성별,출생연도,방번호';
    const sample = '홍길동,ABC회사,M,1990,701';
    return `${header}\n${sample}`;
}
