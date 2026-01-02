/**
 * 에러 메시지 상수
 * 사용자에게 표시되는 에러 메시지를 중앙 관리
 */

export const ERROR_MESSAGES = {
    // 일반 에러
    GENERIC: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    NETWORK: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
    TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    
    // 인증 관련
    AUTH_FAILED: '인증에 실패했습니다.',
    AUTH_EXPIRED: '로그인이 만료되었습니다. 다시 로그인해주세요.',
    INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
    INVALID_EMAIL: '올바른 이메일 형식이 아닙니다.',
    
    // 사용자 관련
    USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
    USER_ALREADY_EXISTS: '이미 등록된 사용자입니다.',
    INVALID_USER_DATA: '유효하지 않은 사용자 정보입니다.',
    
    // 객실 관련
    ROOM_NOT_FOUND: '객실을 찾을 수 없습니다.',
    ROOM_FULL: '객실 정원이 가득 찼습니다.',
    ROOM_GENDER_MISMATCH: '성별이 맞지 않는 객실입니다.',
    ROOM_ALREADY_ASSIGNED: '이미 다른 객실에 배정되어 있습니다.',
    ROOM_SELECTION_FAILED: '객실 선택에 실패했습니다.',
    
    // 초대/요청 관련
    INVITATION_EXPIRED: '초대가 만료되었습니다.',
    INVITATION_INVALID: '유효하지 않은 초대입니다.',
    INVITATION_ACCEPT_FAILED: '초대 수락에 실패했습니다.',
    INVITATION_REJECT_FAILED: '초대 거절에 실패했습니다.',
    REQUEST_FAILED: '요청 처리에 실패했습니다.',
    REQUEST_ACCEPT_FAILED: '요청 수락에 실패했습니다.',
    REQUEST_REJECT_FAILED: '요청 거절에 실패했습니다.',
    
    // 관리자 관련
    ADMIN_ONLY: '관리자만 접근할 수 있습니다.',
    ADMIN_OPERATION_FAILED: '관리자 작업에 실패했습니다.',
    
    // 데이터 관련
    DATA_LOAD_FAILED: '데이터를 불러오는데 실패했습니다.',
    DATA_SAVE_FAILED: '데이터 저장에 실패했습니다.',
    DATA_DELETE_FAILED: '데이터 삭제에 실패했습니다.',
    INVALID_DATA: '유효하지 않은 데이터입니다.',
    
    // Firebase 관련
    FIREBASE_NOT_CONNECTED: 'Firebase 연결이 실패했습니다.',
    FIREBASE_OPERATION_FAILED: 'Firebase 작업에 실패했습니다.',
    
    // CSV 관련
    CSV_PARSE_FAILED: 'CSV 파일 파싱에 실패했습니다.',
    CSV_INVALID_FORMAT: 'CSV 파일 형식이 올바르지 않습니다.',
    CSV_UPLOAD_FAILED: 'CSV 업로드에 실패했습니다.',
} as const;

/**
 * Firebase Auth 에러 코드 타입
 */
interface FirebaseAuthError extends Error {
    code?: string;
}

/**
 * 에러 코드에 따른 사용자 친화적 메시지 반환
 * @param error - 에러 객체
 * @returns 사용자 친화적 메시지
 */
export function getErrorMessage(error: unknown): string {
    if (!error) return ERROR_MESSAGES.GENERIC;
    
    const err = error as FirebaseAuthError;
    
    // Firebase Auth 에러 코드 처리
    if (err.code) {
        switch (err.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return ERROR_MESSAGES.INVALID_CREDENTIALS;
            case 'auth/invalid-email':
                return ERROR_MESSAGES.INVALID_EMAIL;
            case 'auth/user-disabled':
                return '계정이 비활성화되었습니다. 관리자에게 문의해주세요.';
            case 'auth/network-request-failed':
                return ERROR_MESSAGES.NETWORK;
            case 'auth/timeout':
                return ERROR_MESSAGES.TIMEOUT;
            default:
                // 코드가 있지만 매핑되지 않은 경우
                if (err.message) {
                    return err.message;
                }
        }
    }
    
    // 메시지가 있는 경우 사용
    if (err.message) {
        return err.message;
    }
    
    // 기본 메시지
    return ERROR_MESSAGES.GENERIC;
}

/**
 * 에러 타입에 따른 메시지 반환
 * @param errorType - 에러 타입 (ERROR_MESSAGES의 키)
 * @param defaultMessage - 기본 메시지 (선택)
 * @returns 에러 메시지
 */
export function getErrorByType(
    errorType: keyof typeof ERROR_MESSAGES,
    defaultMessage: string = ERROR_MESSAGES.GENERIC
): string {
    return ERROR_MESSAGES[errorType] || defaultMessage;
}

