/**
 * CSV 파싱 유틸리티
 * 쉼표(,) 또는 탭(\t) 구분자 지원
 */
import type { Gender } from '../types';
import type { FirestoreUserCreateData } from '../types/firestore';

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

// ==================== Firestore 전용 파서 ====================

/**
 * Firestore User 등록용 CSV 파싱 결과
 */
export interface FirestoreUserParseResult {
    valid: FirestoreUserCreateData[];
    errors: Array<{
        line: number;
        data: Partial<Record<keyof FirestoreUserCreateData, string>>;
        errors: string[];
    }>;
}

/**
 * Firestore User 등록용 CSV 파싱
 * 필드 순서: 소속 | 이름 | 직위 | 이메일 | 연락처 | 1인실여부 | 성별
 * 
 * @param csvText - CSV 문자열
 * @returns 파싱 및 검증 결과
 */
export function parseCSVForFirestore(csvText: string): FirestoreUserParseResult {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        throw new Error('CSV 파일에 데이터가 없습니다.');
    }

    // 구분자 자동 감지 (탭 vs 쉼표)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    // 헤더 파싱 (첫 줄)
    const headers = parseCSVLine(firstLine, delimiter).map(h => h.trim().toLowerCase());
    
    // 헤더가 있는지 확인
    const hasHeaders = headers.some(h => 
        h.includes('소속') || h.includes('이름') || h.includes('email') || h.includes('name')
    );

    let startIndex = hasHeaders ? 1 : 0;
    const fieldMapping = hasHeaders ? mapHeadersToFields(headers) : null;

    const valid: FirestoreUserCreateData[] = [];
    const errors: Array<{
        line: number;
        data: Partial<Record<keyof FirestoreUserCreateData, string>>;
        errors: string[];
    }> = [];

    // 데이터 파싱
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line, delimiter);
        const lineNumber = i + 1; // 실제 라인 번호 (1부터 시작)

        try {
            let userData: Partial<Record<keyof FirestoreUserCreateData, string>>;

            if (fieldMapping) {
                // 헤더가 있는 경우: 헤더 매핑 사용
                userData = {};
                headers.forEach((header, idx) => {
                    const field = fieldMapping[header];
                    if (field) {
                        userData[field] = values[idx]?.trim() || '';
                    }
                });
            } else {
                // 헤더가 없는 경우: 순서대로 매핑 (소속 | 이름 | 직위 | 이메일 | 연락처 | 1인실여부 | 성별)
                userData = {
                    org: values[0]?.trim() || '',
                    name: values[1]?.trim() || '',
                    position: values[2]?.trim() || '',
                    email: values[3]?.trim() || '',
                    phone: values[4]?.trim() || '',
                    singleAllowed: values[5]?.trim() || '',
                    gender: values[6]?.trim() || ''
                };
            }

            // 유효성 검증
            const validation = validateFirestoreUserData(userData, lineNumber);
            
            if (validation.isValid && validation.data) {
                valid.push(validation.data);
            } else {
                errors.push({
                    line: lineNumber,
                    data: userData,
                    errors: validation.errors
                });
            }
        } catch (error) {
            errors.push({
                line: lineNumber,
                data: {},
                errors: [`파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`]
            });
        }
    }

    return { valid, errors };
}

/**
 * 헤더를 필드명으로 매핑
 */
function mapHeadersToFields(headers: string[]): Record<string, keyof FirestoreUserCreateData> {
    const mapping: Record<string, keyof FirestoreUserCreateData> = {};

    headers.forEach((header, idx) => {
        const lowerHeader = header.toLowerCase();
        
        if (lowerHeader.includes('소속') || lowerHeader.includes('org') || lowerHeader.includes('company')) {
            mapping[header] = 'org';
        } else if (lowerHeader.includes('이름') || lowerHeader === 'name') {
            mapping[header] = 'name';
        } else if (lowerHeader.includes('직위') || lowerHeader.includes('position') || lowerHeader.includes('title')) {
            mapping[header] = 'position';
        } else if (lowerHeader.includes('이메일') || lowerHeader === 'email') {
            mapping[header] = 'email';
        } else if (lowerHeader.includes('연락처') || lowerHeader.includes('phone') || lowerHeader.includes('전화')) {
            mapping[header] = 'phone';
        } else if (lowerHeader.includes('1인실') || lowerHeader.includes('single') || lowerHeader.includes('singleallowed')) {
            mapping[header] = 'singleAllowed';
        } else if (lowerHeader.includes('성별') || lowerHeader === 'gender') {
            mapping[header] = 'gender';
        }
    });

    return mapping;
}

/**
 * Firestore User 데이터 유효성 검증
 */
interface ValidationResult {
    isValid: boolean;
    data?: FirestoreUserCreateData;
    errors: string[];
}

function validateFirestoreUserData(
    data: Partial<Record<keyof FirestoreUserCreateData, string>>,
    lineNumber: number
): ValidationResult {
    const errors: string[] = [];

    // 필수 필드 검증
    if (!data.org || !data.org.trim()) {
        errors.push(`라인 ${lineNumber}: 소속(org)이 필요합니다.`);
    }
    if (!data.name || !data.name.trim()) {
        errors.push(`라인 ${lineNumber}: 이름(name)이 필요합니다.`);
    }
    if (!data.position || !data.position.trim()) {
        errors.push(`라인 ${lineNumber}: 직위(position)이 필요합니다.`);
    }
    if (!data.email || !data.email.trim()) {
        errors.push(`라인 ${lineNumber}: 이메일(email)이 필요합니다.`);
    } else {
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email.trim())) {
            errors.push(`라인 ${lineNumber}: 이메일 형식이 올바르지 않습니다: ${data.email}`);
        }
    }
    if (!data.phone || !data.phone.trim()) {
        errors.push(`라인 ${lineNumber}: 연락처(phone)이 필요합니다.`);
    }
    if (data.singleAllowed === undefined || data.singleAllowed === null || data.singleAllowed === '') {
        errors.push(`라인 ${lineNumber}: 1인실여부(singleAllowed)가 필요합니다.`);
    }
    if (!data.gender || !data.gender.trim()) {
        errors.push(`라인 ${lineNumber}: 성별(gender)이 필요합니다.`);
    }

    if (errors.length > 0) {
        return { isValid: false, errors };
    }

    // 데이터 변환
    const singleAllowed = parseBoolean(data.singleAllowed!, lineNumber, errors);
    const gender = normalizeGender(data.gender!) as 'M' | 'F';

    if (gender !== 'M' && gender !== 'F') {
        errors.push(`라인 ${lineNumber}: 성별은 M 또는 F여야 합니다. (입력: ${data.gender})`);
    }

    if (errors.length > 0) {
        return { isValid: false, errors };
    }

    return {
        isValid: true,
        data: {
            org: data.org!.trim(),
            name: data.name!.trim(),
            position: data.position!.trim(),
            email: data.email!.trim().toLowerCase(),
            phone: data.phone!.trim(),
            gender: gender,
            singleAllowed: singleAllowed!
        },
        errors: []
    };
}

/**
 * boolean 값 파싱 (Y/N, true/false, 1/0 지원)
 */
function parseBoolean(value: string, lineNumber: number, errors: string[]): boolean | undefined {
    const normalized = value.trim().toLowerCase();
    
    if (normalized === 'true' || normalized === 'y' || normalized === 'yes' || normalized === '1' || normalized === '예') {
        return true;
    }
    if (normalized === 'false' || normalized === 'n' || normalized === 'no' || normalized === '0' || normalized === '아니오') {
        return false;
    }
    
    errors.push(`라인 ${lineNumber}: 1인실여부는 Y/N, true/false, 1/0, 예/아니오 중 하나여야 합니다. (입력: ${value})`);
    return undefined;
}

/**
 * Firestore User 등록용 JSON 파싱
 * 
 * @param jsonText - JSON 문자열
 * @returns 파싱 및 검증 결과
 */
export function parseJSONForFirestore(jsonText: string): FirestoreUserParseResult {
    try {
        const parsed = JSON.parse(jsonText);
        
        // 배열인지 객체인지 확인
        const dataArray = Array.isArray(parsed) ? parsed : [parsed];
        
        const valid: FirestoreUserCreateData[] = [];
        const errors: Array<{
            line: number;
            data: Partial<Record<keyof FirestoreUserCreateData, string>>;
            errors: string[];
        }> = [];

        dataArray.forEach((item, index) => {
            const lineNumber = index + 1;
            
            try {
                // 객체를 문자열 맵으로 변환
                const userData: Partial<Record<keyof FirestoreUserCreateData, string>> = {
                    org: String(item.org || item.소속 || ''),
                    name: String(item.name || item.이름 || ''),
                    position: String(item.position || item.직위 || ''),
                    email: String(item.email || item.이메일 || ''),
                    phone: String(item.phone || item.연락처 || item.phoneNumber || ''),
                    singleAllowed: String(item.singleAllowed || item['1인실여부'] || item.singleAllowed || ''),
                    gender: String(item.gender || item.성별 || '')
                };

                // 유효성 검증
                const validation = validateFirestoreUserData(userData, lineNumber);
                
                if (validation.isValid && validation.data) {
                    valid.push(validation.data);
                } else {
                    errors.push({
                        line: lineNumber,
                        data: userData,
                        errors: validation.errors
                    });
                }
            } catch (error) {
                errors.push({
                    line: lineNumber,
                    data: {},
                    errors: [`파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`]
                });
            }
        });

        return { valid, errors };
    } catch (error) {
        throw new Error(`JSON 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
}

/**
 * CSV 템플릿 생성 (Firestore용)
 */
export function generateCSVTemplateForFirestore(): string {
    const headers = ['소속', '이름', '직위', '이메일', '연락처', '1인실여부', '성별'];
    const example = ['KVCA', '홍길동', '대표', 'hong@example.com', '010-1234-5678', 'Y', 'M'];
    
    return [headers.join('\t'), example.join('\t')].join('\n');
}

// ==================== 기존 호환성 함수 ====================

/**
 * 업로드 데이터 유효성 검증 (기존 Realtime DB용)
 * @param data - 파싱된 CSV 데이터
 * @param roomData - 방 데이터
 * @returns 검증 결과
 */
export function validateUploadData(
    data: ParsedCSVRow[],
    roomData: Record<string, unknown>
): {
    valid: ParsedCSVRow[];
    errors: Array<{ row: ParsedCSVRow; errors: string[] }>;
} {
    const valid: ParsedCSVRow[] = [];
    const errors: Array<{ row: ParsedCSVRow; errors: string[] }> = [];

    data.forEach((row) => {
        const rowErrors: string[] = [];

        // 필수 필드 검증
        if (!row.name || row.name.trim() === '') {
            rowErrors.push('이름이 필요합니다.');
        }

        // 성별 검증
        if (row.gender && row.gender !== 'M' && row.gender !== 'F') {
            rowErrors.push('성별은 M 또는 F여야 합니다.');
        }

        // 방번호 검증 (있는 경우)
        if (row.roomNumber && roomData) {
            const roomExists = Object.keys(roomData).some((floor) => {
                const floorData = roomData[floor] as Record<string, unknown> | undefined;
                return floorData && Object.keys(floorData).includes(row.roomNumber);
            });
            
            if (!roomExists) {
                rowErrors.push(`방번호 ${row.roomNumber}이(가) 존재하지 않습니다.`);
            }
        }

        if (rowErrors.length > 0) {
            errors.push({ row, errors: rowErrors });
        } else {
            valid.push(row);
        }
    });

    return { valid, errors };
}

/**
 * CSV 템플릿 생성 (기존 Realtime DB용)
 * @returns CSV 템플릿 문자열
 */
export function generateCSVTemplate(): string {
    const headers = ['이름', '소속', '성별', '나이', '방번호'];
    const example = ['홍길동', 'KVCA', 'M', '35', '701'];
    
    return [headers.join(','), example.join(',')].join('\n');
}


