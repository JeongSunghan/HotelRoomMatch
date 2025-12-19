/**
 * 애플리케이션 전역 상수
 */

// ==================== Storage Keys ====================
export const STORAGE_KEYS = {
    USER: 'vup58_user',
    ROOM_GUESTS: 'vup58_room_guests'
};

// ==================== Security ====================
export const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;  // 세션 만료: 30일
export const SESSION_REFRESH_INTERVAL_MS = 60 * 1000;  // 세션 갱신 체크: 1분

// Rate Limiting 설정
export const RATE_LIMIT = {
    MAX_REQUESTS: 10,         // 윈도우 내 최대 요청 수
    WINDOW_MS: 60 * 1000,     // 윈도우 크기: 1분
    COOLDOWN_MS: 30 * 1000    // 제한 시 대기 시간: 30초
};

// ==================== Invitation ====================
export const INVITATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24시간

// ==================== Room Types ====================
export const ROOM_TYPES = {
    SINGLE: 'single',
    TWIN: 'twin'
};

// ==================== Gender ====================
export const GENDER = {
    MALE: 'M',
    FEMALE: 'F'
};

// ==================== Snoring Options ====================
export const SNORING = {
    NO: 'no',
    SOMETIMES: 'sometimes',
    YES: 'yes'
};

export const SNORING_LABELS = {
    [SNORING.NO]: '😴 없음',
    [SNORING.SOMETIMES]: '😪 가끔',
    [SNORING.YES]: '😤 자주'
};

// ==================== Invitation Status ====================
export const INVITATION_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
};

// ==================== Request Types ====================
export const REQUEST_TYPES = {
    CANCEL: 'cancel',
    CHANGE: 'change'
};

export const REQUEST_STATUS = {
    PENDING: 'pending',
    RESOLVED: 'resolved'
};
