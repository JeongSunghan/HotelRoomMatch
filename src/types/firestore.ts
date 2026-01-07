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
 * FirestoreUser 타입 가드
 */
export function isFirestoreUser(data: unknown): data is FirestoreUser {
    if (typeof data !== 'object' || data === null) return false;
    const user = data as Record<string, unknown>;
    return (
        typeof user.org === 'string' &&
        typeof user.name === 'string' &&
        typeof user.position === 'string' &&
        typeof user.email === 'string' &&
        typeof user.phone === 'string' &&
        (user.gender === 'M' || user.gender === 'F') &&
        typeof user.singleAllowed === 'boolean' &&
        user.createdAt instanceof Timestamp
    );
}

/**
 * FirestoreUserStay 타입 가드
 */
export function isFirestoreUserStay(data: unknown): data is FirestoreUserStay {
    if (typeof data !== 'object' || data === null) return false;
    const stay = data as Record<string, unknown>;
    return (
        typeof stay.userId === 'string' &&
        typeof stay.birthDate === 'string' &&
        typeof stay.age === 'number' &&
        typeof stay.snoring === 'boolean' &&
        (stay.roomType === 'SINGLE' || stay.roomType === 'SHARED' || stay.roomType === null) &&
        (typeof stay.roomId === 'string' || stay.roomId === null) &&
        (stay.status === 'UNASSIGNED' || stay.status === 'ASSIGNED') &&
        (stay.assignedAt instanceof Timestamp || stay.assignedAt === null) &&
        stay.createdAt instanceof Timestamp
    );
}

