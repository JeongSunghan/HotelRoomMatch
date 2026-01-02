/**
 * 타입 정의 파일
 * 애플리케이션 전역에서 사용되는 타입들을 정의
 */

// ==================== 기본 타입 ====================

/**
 * 성별 타입
 */
export type Gender = 'M' | 'F';

/**
 * 코골이 상태 타입
 */
export type SnoringLevel = 'no' | 'sometimes' | 'yes';

/**
 * 객실 타입
 */
export type RoomType = 'single' | 'double';

/**
 * 초대 상태 타입
 */
export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

/**
 * 요청 상태 타입
 */
export type RequestStatus = 'pending' | 'accepted' | 'rejected';

/**
 * 요청 타입
 */
export type RequestType = 'change' | 'cancel';

// ==================== 사용자 관련 ====================

/**
 * 사용자 정보
 */
export interface User {
    sessionId: string;
    name: string;
    company?: string;
    gender: Gender;
    age?: number;
    snoring: SnoringLevel;
    selectedRoom: string | null;
    locked: boolean;
    registeredAt: number;
    selectedAt?: number;
    ageTolerance?: number;
}

/**
 * 사용자 등록 데이터
 */
export interface UserRegistrationData {
    name: string;
    company?: string;
    residentIdFront: string;
    residentIdBack: string;
    age?: number;
    snoring?: SnoringLevel;
    ageTolerance?: number;
}

/**
 * 사용자 업데이트 데이터
 */
export interface UserUpdateData {
    name?: string;
    company?: string;
    age?: number;
    snoring?: SnoringLevel;
    ageTolerance?: number;
    selectedRoom?: string | null;
    selectedAt?: number;
    locked?: boolean;
}

// ==================== 객실 관련 ====================

/**
 * 객실 위치 정보
 */
export interface RoomPosition {
    row: number;
    col: number;
}

/**
 * 객실 정보 (정적 데이터)
 */
export interface RoomInfo {
    floor: number;
    type: RoomType;
    gender: Gender;
    capacity: number;
    roomType: string; // "더블", "스탠다드더블", "디럭스더블" 등
    position: RoomPosition;
}

/**
 * 객실 게스트 정보
 */
export interface Guest {
    sessionId: string;
    name: string;
    company?: string;
    gender: Gender;
    age?: number;
    snoring?: SnoringLevel;
    registeredAt?: number;
}

/**
 * Firebase Rooms 데이터 구조
 */
export interface RoomData {
    guests?: Guest[] | Record<string, Guest>;
}

/**
 * RoomGuests 맵 타입 (방 번호 -> 게스트 배열)
 */
export type RoomGuestsMap = Record<string, Guest[]>;

// ==================== 초대 관련 ====================

/**
 * 룸메이트 초대 정보
 */
export interface RoommateInvitation {
    id?: string;
    roomNumber: string;
    inviterSessionId: string;
    inviterName: string;
    inviterCompany?: string;
    inviterGender: Gender;
    inviteeName: string;
    status: InvitationStatus;
    createdAt: number;
    acceptedAt?: number;
    rejectedAt?: number;
    notified?: boolean;
}

/**
 * 초대 생성 데이터
 */
export interface CreateInvitationData {
    roomNumber: string;
    sessionId: string;
    name: string;
    company?: string;
    gender: Gender;
}

// ==================== 요청 관련 ====================

/**
 * 입실 요청 정보
 */
export interface JoinRequest {
    id?: string;
    fromUserId: string;
    fromUserName: string;
    toRoomNumber: string;
    toUserId?: string;
    status: RequestStatus;
    createdAt: number;
    acceptedAt?: number;
    rejectedAt?: number;
}

/**
 * 객실 변경 요청 정보
 */
export interface RoomChangeRequest {
    id?: string;
    userId: string;
    userName: string;
    currentRoom: string;
    requestType: RequestType;
    phoneNumber: string;
    reason?: string;
    status: RequestStatus;
    createdAt: number;
    processedAt?: number;
}

// ==================== 관리자 관련 ====================

/**
 * 허용된 사용자 정보 (사전등록)
 */
export interface AllowedUser {
    email: string;
    name?: string;
    registered?: boolean;
    registeredAt?: number;
}

/**
 * 이력 정보
 */
export interface HistoryEntry {
    id?: string;
    action: string;
    userId?: string;
    userName?: string;
    roomNumber?: string;
    details?: Record<string, unknown>;
    timestamp: number;
    adminId?: string;
}

/**
 * 문의 정보
 */
export interface Inquiry {
    id?: string;
    userId?: string;
    userName?: string;
    email?: string;
    subject: string;
    message: string;
    createdAt: number;
    replied?: boolean;
    repliedAt?: number;
}

/**
 * 설정 정보
 */
export interface Settings {
    deadline?: number;
    enabled?: boolean;
    [key: string]: unknown;
}

// ==================== 유틸리티 타입 ====================

/**
 * Firebase Realtime Database에서 가져온 데이터 (null 가능)
 */
export type FirebaseData<T> = T | null;

/**
 * 선택적 필드를 가진 타입
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 필수 필드를 가진 타입
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ==================== 함수 타입 ====================

/**
 * 콜백 함수 타입
 */
export type Callback<T = void> = (data: T) => void;

/**
 * 에러 핸들러 타입
 */
export type ErrorHandler = (error: Error, context?: Record<string, unknown>) => string;

