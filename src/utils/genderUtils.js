/**
 * 주민번호 뒷자리 첫 번째 숫자로 성별 판별
 * 1, 3 = 남성 (1900년대, 2000년대생)
 * 2, 4 = 여성 (1900년대, 2000년대생)
 * @param {string} backDigit - 주민번호 뒷자리 첫 번째 숫자
 * @returns {'M' | 'F' | null} 성별 또는 null (유효하지 않음)
 */
export function getGenderFromResidentId(backDigit) {
    const digit = String(backDigit).trim();
    if (digit === '1' || digit === '3') return 'M';
    if (digit === '2' || digit === '4') return 'F';
    return null;
}

/**
 * 성별 코드를 한글로 변환
 * @param {'M' | 'F'} gender 
 * @returns {string}
 */
export function getGenderLabel(gender) {
    if (gender === 'M') return '남성';
    if (gender === 'F') return '여성';
    return '알 수 없음';
}

/**
 * 주민번호 앞자리 유효성 검사 (YYMMDD 형식)
 * @param {string} frontPart - 앞 6자리
 * @returns {boolean}
 */
export function validateResidentIdFront(frontPart) {
    if (!/^\d{6}$/.test(frontPart)) return false;

    const year = parseInt(frontPart.substring(0, 2), 10);
    const month = parseInt(frontPart.substring(2, 4), 10);
    const day = parseInt(frontPart.substring(4, 6), 10);

    // 월: 01-12
    if (month < 1 || month > 12) return false;

    // 일: 01-31 (간단한 검증)
    if (day < 1 || day > 31) return false;

    return true;
}

/**
 * 주민번호 뒷자리 첫 번째 숫자 유효성 검사
 * @param {string} backDigit - 뒷자리 첫 번째 숫자
 * @returns {boolean}
 */
export function validateResidentIdBack(backDigit) {
    return /^[1-4]$/.test(String(backDigit).trim());
}

/**
 * 주민번호 전체 유효성 검사
 * @param {string} frontPart - 앞 6자리
 * @param {string} backDigit - 뒷자리 첫 번째 숫자
 * @returns {{ valid: boolean, gender: 'M' | 'F' | null, error?: string }}
 */
export function validateResidentId(frontPart, backDigit) {
    if (!validateResidentIdFront(frontPart)) {
        return { valid: false, gender: null, error: '주민번호 앞자리가 올바르지 않습니다.' };
    }

    if (!validateResidentIdBack(backDigit)) {
        return { valid: false, gender: null, error: '주민번호 뒷자리 첫 번째 숫자가 올바르지 않습니다.' };
    }

    const gender = getGenderFromResidentId(backDigit);
    return { valid: true, gender };
}

/**
 * 주민번호에서 출생연도 계산
 * @param {string} frontPart - 앞 6자리 (YYMMDD)
 * @param {string} backDigit - 뒷자리 첫 번째 숫자
 * @returns {number | null} 출생연도 (4자리) 또는 null
 */
export function getBirthYearFromResidentId(frontPart, backDigit) {
    if (!validateResidentIdFront(frontPart)) return null;

    const yy = parseInt(frontPart.substring(0, 2), 10);
    const digit = String(backDigit).trim();

    // 1, 2 = 1900년대생 / 3, 4 = 2000년대생
    if (digit === '1' || digit === '2') {
        return 1900 + yy;
    } else if (digit === '3' || digit === '4') {
        return 2000 + yy;
    }
    return null;
}

/**
 * 주민번호에서 나이 계산 (만 나이)
 * @param {string} frontPart - 앞 6자리 (YYMMDD)
 * @param {string} backDigit - 뒷자리 첫 번째 숫자
 * @returns {number | null} 만 나이 또는 null
 */
export function getAgeFromResidentId(frontPart, backDigit) {
    const birthYear = getBirthYearFromResidentId(frontPart, backDigit);
    if (!birthYear) return null;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const birthMonth = parseInt(frontPart.substring(2, 4), 10);
    const birthDay = parseInt(frontPart.substring(4, 6), 10);

    let age = currentYear - birthYear;

    // 생일이 지나지 않았으면 1살 빼기
    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
        age--;
    }

    return age;
}
