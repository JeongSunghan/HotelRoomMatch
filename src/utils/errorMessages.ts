/**
 * 에러 메시지 상수
 * 사용자에게 표시되는 에러 메시지를 중앙 관리
 * 각 메시지는 사용자 친화적이고 복구 방법을 포함합니다.
 */

export interface ErrorMessage {
    /** 사용자에게 표시할 메시지 */
    message: string;
    /** 에러 복구 방법 (선택) */
    recovery?: string;
    /** 에러 타입 */
    type?: 'error' | 'warning' | 'info';
}

export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
    // 일반 에러
    GENERIC: {
        message: '오류가 발생했습니다.',
        recovery: '잠시 후 다시 시도해주세요. 문제가 계속되면 페이지를 새로고침해주세요.',
        type: 'error'
    },
    NETWORK: {
        message: '인터넷 연결을 확인해주세요.',
        recovery: 'Wi-Fi 또는 모바일 데이터 연결 상태를 확인하고, 다시 시도해주세요.',
        type: 'error'
    },
    TIMEOUT: {
        message: '요청 시간이 초과되었습니다.',
        recovery: '네트워크 상태를 확인하고 잠시 후 다시 시도해주세요.',
        type: 'warning'
    },
    
    // 인증 관련
    AUTH_FAILED: {
        message: '인증에 실패했습니다.',
        recovery: '이메일과 비밀번호를 확인하고 다시 시도해주세요.',
        type: 'error'
    },
    AUTH_EXPIRED: {
        message: '로그인 세션이 만료되었습니다.',
        recovery: '다시 로그인해주세요.',
        type: 'warning'
    },
    INVALID_CREDENTIALS: {
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        recovery: '입력한 정보를 확인하고 다시 시도해주세요.',
        type: 'error'
    },
    INVALID_EMAIL: {
        message: '올바른 이메일 형식이 아닙니다.',
        recovery: '예: user@example.com 형식으로 입력해주세요.',
        type: 'error'
    },
    
    // 사용자 관련
    USER_NOT_FOUND: {
        message: '사용자 정보를 찾을 수 없습니다.',
        recovery: '다시 등록하거나 관리자에게 문의해주세요.',
        type: 'error'
    },
    USER_ALREADY_EXISTS: {
        message: '이미 등록된 사용자입니다.',
        recovery: '다른 이메일로 등록하거나 로그인해주세요.',
        type: 'warning'
    },
    INVALID_USER_DATA: {
        message: '입력한 정보가 올바르지 않습니다.',
        recovery: '모든 필수 항목을 올바르게 입력했는지 확인해주세요.',
        type: 'error'
    },
    
    // 객실 관련
    ROOM_NOT_FOUND: {
        message: '객실 정보를 찾을 수 없습니다.',
        recovery: '다른 객실을 선택하거나 페이지를 새로고침해주세요.',
        type: 'error'
    },
    ROOM_FULL: {
        message: '선택하신 객실은 이미 정원이 가득 찼습니다.',
        recovery: '다른 객실을 선택해주세요.',
        type: 'warning'
    },
    ROOM_GENDER_MISMATCH: {
        message: '성별이 맞지 않는 객실입니다.',
        recovery: '본인 성별에 맞는 층의 객실을 선택해주세요.',
        type: 'warning'
    },
    ROOM_ALREADY_ASSIGNED: {
        message: '이미 다른 객실에 배정되어 있습니다.',
        recovery: '현재 배정된 객실을 확인하거나 방 변경 요청을 해주세요.',
        type: 'warning'
    },
    ROOM_SELECTION_FAILED: {
        message: '객실 선택에 실패했습니다.',
        recovery: '다시 시도하거나 다른 객실을 선택해주세요.',
        type: 'error'
    },
    
    // 초대/요청 관련
    INVITATION_EXPIRED: {
        message: '초대가 만료되었습니다.',
        recovery: '새로운 초대를 요청하거나 직접 객실을 선택해주세요.',
        type: 'warning'
    },
    INVITATION_INVALID: {
        message: '유효하지 않은 초대입니다.',
        recovery: '초대 링크를 확인하거나 새로운 초대를 요청해주세요.',
        type: 'error'
    },
    INVITATION_ACCEPT_FAILED: {
        message: '초대 수락에 실패했습니다.',
        recovery: '다시 시도하거나 직접 객실을 선택해주세요.',
        type: 'error'
    },
    INVITATION_REJECT_FAILED: {
        message: '초대 거절에 실패했습니다.',
        recovery: '페이지를 새로고침하고 다시 시도해주세요.',
        type: 'error'
    },
    REQUEST_FAILED: {
        message: '요청 처리에 실패했습니다.',
        recovery: '잠시 후 다시 시도해주세요.',
        type: 'error'
    },
    REQUEST_ACCEPT_FAILED: {
        message: '요청 수락에 실패했습니다.',
        recovery: '다시 시도해주세요.',
        type: 'error'
    },
    REQUEST_REJECT_FAILED: {
        message: '요청 거절에 실패했습니다.',
        recovery: '다시 시도해주세요.',
        type: 'error'
    },
    
    // 관리자 관련
    ADMIN_ONLY: {
        message: '관리자만 접근할 수 있는 기능입니다.',
        recovery: '관리자 계정으로 로그인해주세요.',
        type: 'error'
    },
    ADMIN_OPERATION_FAILED: {
        message: '관리자 작업에 실패했습니다.',
        recovery: '다시 시도하거나 시스템 관리자에게 문의해주세요.',
        type: 'error'
    },
    
    // 데이터 관련
    DATA_LOAD_FAILED: {
        message: '데이터를 불러오는데 실패했습니다.',
        recovery: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요.',
        type: 'error'
    },
    DATA_SAVE_FAILED: {
        message: '데이터 저장에 실패했습니다.',
        recovery: '입력한 정보를 확인하고 다시 시도해주세요.',
        type: 'error'
    },
    DATA_DELETE_FAILED: {
        message: '데이터 삭제에 실패했습니다.',
        recovery: '다시 시도해주세요.',
        type: 'error'
    },
    INVALID_DATA: {
        message: '입력한 정보가 올바르지 않습니다.',
        recovery: '모든 필드를 올바르게 입력했는지 확인해주세요.',
        type: 'error'
    },
    
    // Firebase 관련
    FIREBASE_NOT_CONNECTED: {
        message: '서버 연결에 실패했습니다.',
        recovery: '인터넷 연결을 확인하고 페이지를 새로고침해주세요. 로컬 모드로 동작 중일 수 있습니다.',
        type: 'warning'
    },
    FIREBASE_OPERATION_FAILED: {
        message: '서버 작업에 실패했습니다.',
        recovery: '잠시 후 다시 시도해주세요.',
        type: 'error'
    },
    
    // CSV 관련
    CSV_PARSE_FAILED: {
        message: 'CSV 파일을 읽는데 실패했습니다.',
        recovery: '파일 형식을 확인하고 다시 업로드해주세요.',
        type: 'error'
    },
    CSV_INVALID_FORMAT: {
        message: 'CSV 파일 형식이 올바르지 않습니다.',
        recovery: '필수 컬럼(이름, 이메일 등)이 포함되어 있는지 확인해주세요.',
        type: 'error'
    },
    CSV_UPLOAD_FAILED: {
        message: 'CSV 파일 업로드에 실패했습니다.',
        recovery: '파일 크기와 형식을 확인하고 다시 시도해주세요.',
        type: 'error'
    },
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
 * @returns 사용자 친화적 메시지 객체
 */
export function getErrorMessage(error: unknown): ErrorMessage {
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
                return {
                    message: '계정이 비활성화되었습니다.',
                    recovery: '관리자에게 문의해주세요.',
                    type: 'error'
                };
            case 'auth/network-request-failed':
                return ERROR_MESSAGES.NETWORK;
            case 'auth/timeout':
                return ERROR_MESSAGES.TIMEOUT;
            default:
                // 코드가 있지만 매핑되지 않은 경우
                if (err.message) {
                    return {
                        message: err.message,
                        recovery: '잠시 후 다시 시도해주세요.',
                        type: 'error'
                    };
                }
        }
    }
    
    // 메시지가 있는 경우 사용
    if (err.message) {
        // 이미 ErrorMessage 형식인지 확인
        if (typeof err.message === 'object' && 'message' in err.message) {
            return err.message as ErrorMessage;
        }
        
        // 문자열 메시지인 경우
        const messageStr = String(err.message);
        
        // 에러 메시지에서 키워드 매칭
        if (messageStr.includes('네트워크') || messageStr.includes('network')) {
            return ERROR_MESSAGES.NETWORK;
        }
        if (messageStr.includes('시간 초과') || messageStr.includes('timeout')) {
            return ERROR_MESSAGES.TIMEOUT;
        }
        if (messageStr.includes('객실') && messageStr.includes('가득')) {
            return ERROR_MESSAGES.ROOM_FULL;
        }
        if (messageStr.includes('성별')) {
            return ERROR_MESSAGES.ROOM_GENDER_MISMATCH;
        }
        if (messageStr.includes('이미 배정')) {
            return ERROR_MESSAGES.ROOM_ALREADY_ASSIGNED;
        }
        
        return {
            message: messageStr,
            recovery: '잠시 후 다시 시도해주세요.',
            type: 'error'
        };
    }
    
    // 기본 메시지
    return ERROR_MESSAGES.GENERIC;
}

/**
 * 에러 메시지 문자열만 반환 (기존 호환성)
 * @param error - 에러 객체
 * @returns 사용자 친화적 메시지 문자열
 */
export function getErrorMessageText(error: unknown): string {
    const errorMsg = getErrorMessage(error);
    return errorMsg.message;
}

/**
 * 에러 타입에 따른 메시지 반환
 * @param errorType - 에러 타입 (ERROR_MESSAGES의 키)
 * @param defaultMessage - 기본 메시지 (선택)
 * @returns 에러 메시지 객체
 */
export function getErrorByType(
    errorType: keyof typeof ERROR_MESSAGES,
    defaultMessage: ErrorMessage = ERROR_MESSAGES.GENERIC
): ErrorMessage {
    return ERROR_MESSAGES[errorType] || defaultMessage;
}

/**
 * 에러 타입에 따른 메시지 문자열 반환 (기존 호환성)
 * @param errorType - 에러 타입 (ERROR_MESSAGES의 키)
 * @param defaultMessage - 기본 메시지 (선택)
 * @returns 에러 메시지 문자열
 */
export function getErrorByTypeText(
    errorType: keyof typeof ERROR_MESSAGES,
    defaultMessage: string = ERROR_MESSAGES.GENERIC.message
): string {
    const errorMsg = getErrorByType(errorType);
    return errorMsg.message;
}


