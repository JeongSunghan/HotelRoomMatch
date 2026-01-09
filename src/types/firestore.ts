/**
 * Firestore 전용 타입 정의
 * Firebase Realtime Database → Cloud Firestore 마이그레이션용
 */
import { Timestamp } from 'firebase/firestore';

// ==================== Firestore 컬렉션 타입 ====================

/**
 * Firestore users 컬렉션 Document
 * 관리자에 의해 사전 등록된 사용자 정보
 */
export interface FirestoreUser {
    org: string;              // 소속
    name: string;             // 이름
    position: string;         // 직위
    email: string;            // 이메일 (UNIQUE, Document ID로 사용 가능)
    phone: string;            // 연락처
    gender: 'M' | 'F';        // 성별
    singleAllowed: boolean;   // 관리자 설정 1인실 가능 여부
    createdAt: Timestamp;     // 생성일
}

/**
 * Firestore userStays 컬렉션 Document
 * 사용자의 숙박 및 방 배정 정보
 */
export interface FirestoreUserStay {
    userId: string;           // users.userId 참조 (FK)
    birthDate: string;        // 생년월일 (YYYY-MM-DD)
    age: number;              // 나이
    snoring: boolean;         // 코골이 있음/없음 (boolean)
    roomType: 'SINGLE' | 'SHARED' | null;  // 방 타입 (배정 전에는 null)
    roomId: string | null;    // 방 번호 (배정 전에는 null)
    status: 'UNASSIGNED' | 'ASSIGNED';  // 배정 상태
    assignedAt: Timestamp | null;  // 배정일 (배정 전에는 null)
    createdAt: Timestamp;     // 생성일
}

/**
 * Firestore OTP 요청 Document (선택사항)
 * EmailJS OTP 검증용 (기존 Realtime Database 대체)
 */
export interface FirestoreOtpRequest {
    email: string;            // 이메일
    hashedCode: string;       // 해시된 OTP 코드
    expiresAt: Timestamp;     // 만료 시간
    attempts: number;         // 시도 횟수
    createdAt: Timestamp;     // 생성일
}

// ==================== 생성용 데이터 타입 ====================

/**
 * Firestore User 등록용 데이터 (Document ID 및 createdAt 제외)
 */
export type FirestoreUserCreateData = Omit<FirestoreUser, 'createdAt'>;

/**
 * Firestore UserStay 생성용 데이터
 */
export type FirestoreUserStayCreateData = Omit<FirestoreUserStay, 'createdAt' | 'assignedAt'>;

/**
 * Firestore UserStay 업데이트용 데이터
 */
export type FirestoreUserStayUpdateData = Partial<Pick<FirestoreUserStay, 
    'birthDate' | 'age' | 'snoring' | 'roomType' | 'roomId' | 'status' | 'assignedAt'>>;

// ==================== 유틸리티 타입 ====================

/**
 * Firestore Timestamp를 JavaScript Date로 변환
 */
export function firestoreTimestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
}

/**
 * JavaScript Date를 Firestore Timestamp로 변환
 */
export function dateToFirestoreTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
}

/**
 * 현재 시간을 Firestore Timestamp로 반환
 */
export function nowTimestamp(): Timestamp {
    return Timestamp.now();
}

// ==================== 타입 가드 ====================

/**
 * Timestamp 검증 (Firestore Timestamp 또는 호환 객체)
 */
function isTimestampLike(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (value instanceof Timestamp) return true;
    // Firestore SDK 버전 차이로 인한 호환성 처리
    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        return typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number';
    }
    return false;
}

/**
 * FirestoreUser 타입 가드 (유연한 버전)
 * 필수 필드만 엄격히 검증하고, 선택 필드는 유연하게 처리
 */
export function isFirestoreUser(data: unknown): data is FirestoreUser {
    if (typeof data !== 'object' || data === null) return false;
    const user = data as Record<string, unknown>;
    
    // 필수 필드 검증 (email, name, gender만 필수)
    const hasRequiredFields = (
        typeof user.email === 'string' && user.email.length > 0 &&
        typeof user.name === 'string' && user.name.length > 0 &&
        (user.gender === 'M' || user.gender === 'F')
    );
    
    if (!hasRequiredFields) return false;
    
    // 선택 필드 타입 검증 (존재하는 경우에만)
    if (user.org !== undefined && typeof user.org !== 'string') return false;
    if (user.position !== undefined && typeof user.position !== 'string') return false;
    if (user.phone !== undefined && typeof user.phone !== 'string') return false;
    if (user.singleAllowed !== undefined && typeof user.singleAllowed !== 'boolean') return false;
    if (user.createdAt !== undefined && !isTimestampLike(user.createdAt)) return false;
    
    return true;
}

/**
 * FirestoreUserStay 타입 가드 (유연한 버전)
 */
export function isFirestoreUserStay(data: unknown): data is FirestoreUserStay {
    if (typeof data !== 'object' || data === null) return false;
    const stay = data as Record<string, unknown>;
    
    // 필수 필드: userId만 엄격히 검증
    if (typeof stay.userId !== 'string' || stay.userId.length === 0) return false;
    
    // birthDate: 문자열이거나 없을 수 있음
    if (stay.birthDate !== undefined && stay.birthDate !== null && typeof stay.birthDate !== 'string') return false;
    
    // age: 숫자이거나 없을 수 있음
    if (stay.age !== undefined && stay.age !== null && typeof stay.age !== 'number') return false;
    
    // snoring: boolean이거나 없을 수 있음
    if (stay.snoring !== undefined && stay.snoring !== null && typeof stay.snoring !== 'boolean') return false;
    
    // roomType: 특정 값 또는 null
    if (stay.roomType !== undefined && stay.roomType !== null && 
        stay.roomType !== 'SINGLE' && stay.roomType !== 'SHARED') return false;
    
    // roomId: 문자열 또는 null
    if (stay.roomId !== undefined && stay.roomId !== null && typeof stay.roomId !== 'string') return false;
    
    // status: 특정 값 (기본값 UNASSIGNED)
    if (stay.status !== undefined && stay.status !== 'UNASSIGNED' && stay.status !== 'ASSIGNED') return false;
    
    // assignedAt: Timestamp 또는 null
    if (stay.assignedAt !== undefined && stay.assignedAt !== null && !isTimestampLike(stay.assignedAt)) return false;
    
    // createdAt: Timestamp (있으면)
    if (stay.createdAt !== undefined && stay.createdAt !== null && !isTimestampLike(stay.createdAt)) return false;
    
    return true;
}

/**
 * FirestoreUser 데이터 정규화 (기본값 적용)
 */
export function normalizeFirestoreUser(data: Record<string, unknown>): FirestoreUser {
    return {
        org: (data.org as string) || '',
        name: (data.name as string) || '',
        position: (data.position as string) || '',
        email: (data.email as string) || '',
        phone: (data.phone as string) || '',
        gender: (data.gender as 'M' | 'F') || 'M',
        singleAllowed: (data.singleAllowed as boolean) ?? false,
        createdAt: (data.createdAt as Timestamp) || Timestamp.now()
    };
}

/**
 * FirestoreUserStay 데이터 정규화 (기본값 적용)
 */
export function normalizeFirestoreUserStay(data: Record<string, unknown>): FirestoreUserStay {
    return {
        userId: (data.userId as string) || '',
        birthDate: (data.birthDate as string) || '',
        age: (data.age as number) || 0,
        snoring: (data.snoring as boolean) ?? false,
        roomType: (data.roomType as 'SINGLE' | 'SHARED' | null) ?? null,
        roomId: (data.roomId as string | null) ?? null,
        status: (data.status as 'UNASSIGNED' | 'ASSIGNED') || 'UNASSIGNED',
        assignedAt: (data.assignedAt as Timestamp | null) ?? null,
        createdAt: (data.createdAt as Timestamp) || Timestamp.now()
    };
}

