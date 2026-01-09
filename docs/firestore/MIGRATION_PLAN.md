# Firebase Realtime Database → Cloud Firestore 마이그레이션 계획

**작성일**: 2025-01-02  
**목적**: Firebase Realtime Database에서 Cloud Firestore로 전환  
**규모**: 대규모 리팩토링 (전체 데이터 구조 재설계)

---

## 📊 현재 상태 분석

### 현재 사용 기술
- **Database**: Firebase Realtime Database
- **인증**: Firebase Anonymous Auth + **EmailJS OTP 이메일 인증**
  - EmailJS를 사용하여 OTP(인증번호) 이메일 발송
  - `@emailjs/browser` 패키지 사용
  - 환경 변수: `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`
  - OTP 검증은 Firebase Realtime Database의 `otp_requests` 컬렉션에서 관리
- **데이터 구조**: JSON 트리 구조
- **주요 컬렉션**: `users`, `rooms`, `allowedUsers`, `joinRequests`, `invitations`, `history`, `inquiries`, `requests`

### 변경 후 구조
- **Database**: Cloud Firestore
- **인증**: Firebase Anonymous Auth + **EmailJS OTP 이메일 인증 (유지)**
  - EmailJS 사용 방식은 변경 없음 (기존 코드 그대로 사용)
  - OTP 검증 데이터를 Firestore로 마이그레이션 (선택사항)
- **데이터 구조**: Document/Collection 구조
- **새로운 컬렉션**: `users`, `userStays`, `rooms` (구조 변경)

---

## 🎯 주요 변경사항

### 1. 데이터 구조 변경

#### [1-1] users 컬렉션 (신규 구조)
```typescript
users/{userId}
  - org: string (소속)
  - name: string (이름)
  - position: string (직위)
  - email: string (UNIQUE, 인덱스 필요)
  - phone: string (연락처)
  - gender: string (M / F)
  - singleAllowed: boolean (관리자 설정 1인실 가능 여부)
  - createdAt: Timestamp
```

#### [1-2] userStays 컬렉션 (신규)
```typescript
userStays/{stayId}
  - userId: string (users.userId 참조, FK)
  - birthDate: string (YYYY-MM-DD)
  - age: number
  - snoring: boolean (코골이 있음/없음)
  - roomType: string (SINGLE / SHARED)
  - roomId: string (방 번호)
  - status: string (UNASSIGNED / ASSIGNED)
  - assignedAt: Timestamp
```

### 2. 유저 등록 방식 변경
- **기존**: 사용자 직접 등록
- **변경**: 관리자 전용 CSV/JSON 업로드
- **입력 필드**: 소속 | 이름 | 직위 | 이메일 | 연락처 | 1인실여부 | 성별

### 3. 코골이 단계 단순화
- **기존**: 단계별 선택 (없음/가벼움/중간/심함)
- **변경**: boolean (있음/없음)

### 4. 1인실 선택 제어
- `users.singleAllowed = true` → 1인실 선택 가능
- `users.singleAllowed = false` → 1인실 선택 불가, 안내 모달 표시

---

## 📋 마이그레이션 단계 (상세)

### Phase 1: Firestore 설정 및 기본 구조
**목표**: Firestore 초기화 및 기본 인프라 구축

#### 1.1 Firestore SDK 설정
- [ ] `firebase/firestore` 패키지 확인 (이미 포함됨)
- [ ] `src/firebase/config.ts` 수정: `getFirestore` 추가
- [ ] Realtime Database와 Firestore 병행 사용 설정 (마이그레이션 기간)
- [ ] 환경 변수 확인 (Firestore는 별도 설정 불필요, Realtime Database와 동일 프로젝트)

#### 1.2 Firestore 인덱스 설정
- [ ] `firestore.indexes.json` 파일 생성/수정
- [ ] 이메일 UNIQUE 제약 (Cloud Functions로 구현 또는 클라이언트 검증)
- [ ] 필요한 복합 인덱스 정의:
  - `users.email` (단순 인덱스)
  - `userStays.userId` (단순 인덱스)
  - `userStays.status` (단순 인덱스)
  - `userStays.userId + status` (복합 인덱스)

#### 1.3 Firestore Security Rules
- [ ] `firestore.rules` 파일 작성
- [ ] `users` 컬렉션 규칙:
  - 읽기: 인증된 사용자 (자신 또는 관리자)
  - 쓰기: 관리자만
- [ ] `userStays` 컬렉션 규칙:
  - 읽기: 인증된 사용자 (자신 또는 관리자)
  - 쓰기: 자신 또는 관리자
- [ ] 이메일 기반 쿼리 보안 규칙

#### 1.4 기본 타입 정의 작성
- [ ] `src/types/firestore.ts` 신규 생성
- [ ] Firestore 전용 타입 정의:
  - `FirestoreUser` (users 컬렉션)
  - `FirestoreUserStay` (userStays 컬렉션)
  - `FirestoreTimestamp` 변환 유틸리티

**타입 정의 예시:**
```typescript
// src/types/firestore.ts
import { Timestamp } from 'firebase/firestore';

/**
 * Firestore users 컬렉션 Document
 */
export interface FirestoreUser {
  org: string;              // 소속
  name: string;             // 이름
  position: string;         // 직위
  email: string;            // 이메일 (UNIQUE)
  phone: string;            // 연락처
  gender: 'M' | 'F';        // 성별
  singleAllowed: boolean;   // 관리자 설정 1인실 가능 여부
  createdAt: Timestamp;     // 생성일
}

/**
 * Firestore userStays 컬렉션 Document
 */
export interface FirestoreUserStay {
  userId: string;           // users.userId 참조 (FK)
  birthDate: string;        // 생년월일 (YYYY-MM-DD)
  age: number;              // 나이
  snoring: boolean;         // 코골이 있음/없음
  roomType: 'SINGLE' | 'SHARED';  // 방 타입
  roomId: string | null;    // 방 번호 (배정 전에는 null)
  status: 'UNASSIGNED' | 'ASSIGNED';  // 배정 상태
  assignedAt: Timestamp | null;  // 배정일 (배정 전에는 null)
  createdAt: Timestamp;     // 생성일
}

/**
 * Firestore User 등록용 데이터 (Document ID 제외)
 */
export type FirestoreUserCreateData = Omit<FirestoreUser, 'createdAt'>;

/**
 * Firestore UserStay 생성용 데이터
 */
export type FirestoreUserStayCreateData = Omit<FirestoreUserStay, 'createdAt' | 'assignedAt'>;
```

### Phase 2: users 컬렉션 마이그레이션
**목표**: users 컬렉션 CRUD 함수 작성

#### 2.1 users 컬렉션 구조 설계
- [ ] Document ID 전략 결정 (자동 생성 vs 커스텀)
- [ ] 필드 타입 매핑 (string, boolean, Timestamp)
- [ ] 이메일 UNIQUE 제약 구현 방안

#### 2.2 users CRUD 함수 작성
- [ ] `src/firebase/firestore/users.ts` 신규 생성
- [ ] `createUser(data: FirestoreUser)`: 유저 생성
- [ ] `getUserByEmail(email: string)`: 이메일로 유저 조회
- [ ] `getUserById(userId: string)`: ID로 유저 조회
- [ ] `updateUser(userId: string, data: Partial<FirestoreUser>)`: 유저 업데이트
- [ ] `deleteUser(userId: string)`: 유저 삭제
- [ ] `getAllUsers()`: 전체 유저 조회 (관리자용)
- [ ] `subscribeToUser(userId: string, callback)`: 실시간 구독
- [ ] `subscribeToAllUsers(callback)`: 전체 유저 실시간 구독

#### 2.3 이메일 중복 검증
- [ ] `checkEmailExists(email: string)`: 이메일 중복 확인
- [ ] Cloud Functions 트리거 (선택사항, 보안 강화)
- [ ] 클라이언트 측 검증 로직

### Phase 3: userStays 컬렉션 마이그레이션
**목표**: userStays 컬렉션 및 FK 관계 관리

#### 3.1 userStays 컬렉션 구조 설계
- [ ] Document ID 전략 (자동 생성 권장)
- [ ] FK 관계 관리: `userId` 필드
- [ ] 인덱스 설계: `userId`, `status`, `roomId`

#### 3.2 userStays CRUD 함수 작성
- [ ] `src/firebase/firestore/userStays.ts` 신규 생성
- [ ] `createUserStay(data: FirestoreUserStay)`: stay 생성
- [ ] `getUserStayByUserId(userId: string)`: userId로 stay 조회
- [ ] `getUserStayById(stayId: string)`: ID로 stay 조회
- [ ] `updateUserStay(stayId: string, data: Partial<FirestoreUserStay>)`: stay 업데이트
- [ ] `deleteUserStay(stayId: string)`: stay 삭제
- [ ] `getAllUserStays()`: 전체 stay 조회
- [ ] `getUserStaysByStatus(status: string)`: 상태별 조회
- [ ] `subscribeToUserStay(userId: string, callback)`: 실시간 구독

#### 3.3 FK 관계 관리
- [ ] userId 유효성 검증 (users 컬렉션 존재 확인)
- [ ] 참조 무결성 체크 함수
- [ ] Cascade 삭제 로직 (선택사항)

### Phase 4: 유저 등록 시스템 변경
**목표**: 관리자 전용 CSV/JSON 업로드 시스템

#### 4.1 CSV/JSON 파서 구현
- [ ] `src/utils/csvParser.ts` 수정 또는 신규
- [ ] Tab/쉼표 구분 파싱
- [ ] 헤더 자동 감지 및 매핑
- [ ] 필드 순서: 소속 | 이름 | 직위 | 이메일 | 연락처 | 1인실여부 | 성별
- [ ] 유효성 검증: 이메일 형식, 성별 (M/F), 1인실여부 (Y/N)

#### 4.2 관리자 업로드 UI 구현
- [ ] `src/components/admin/UserBulkUploadModal.tsx` 신규 생성
- [ ] 파일 업로드 UI (드래그 앤 드롭)
- [ ] CSV/JSON 선택
- [ ] 미리보기 기능
- [ ] 에러 표시 및 수정 제안
- [ ] 일괄 등록 진행 상태 표시

#### 4.3 일괄 등록 API
- [ ] `bulkCreateUsers(users: FirestoreUser[])`: 일괄 생성
- [ ] 트랜잭션 또는 배치 처리 (Firestore batch)
- [ ] 중복 이메일 처리 (스킵 또는 에러)
- [ ] 진행률 표시

### Phase 5: 로그인 및 인증 흐름 변경
**목표**: 이메일 기반 인증 및 userStays 관리

#### 5.1 이메일 인증 로직 수정
- [ ] `src/firebase/auth.ts` 검토 및 수정
- [ ] **EmailJS OTP 이메일 인증 로직 유지 (변경 없음)**
  - 현재 `RegistrationModal.tsx`에서 사용 중인 EmailJS 코드 그대로 사용
  - `@emailjs/browser` 패키지 사용 유지
  - 환경 변수: `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY` 그대로 사용
  - OTP 발송: `emailjs.send(serviceId, templateId, { to_email, otp_code, message }, publicKey)`
- [ ] OTP 검증 로직 검토
  - 현재: Realtime Database의 `otp_requests` 컬렉션 사용
  - 옵션 1: 기존 Realtime Database 유지 (병행 사용)
  - 옵션 2: Firestore의 `otpRequests` 컬렉션으로 마이그레이션
- [ ] `users` 컬렉션에서 이메일 조회 (Firestore 쿼리로 변경)
- [ ] 관리자 선배정 유저 처리 (인증 생략)

#### 5.2 userStays 생성/조회 로직
- [ ] 로그인 후 `getUserStayByUserId` 호출
- [ ] userStay 없으면 생성 (`status: UNASSIGNED`)
- [ ] 기존 userStay 있으면 조회
- [ ] 세션 관리 (localStorage 또는 Context)

#### 5.3 생년월일 등록 흐름
- [ ] 생년월일 입력 모달 (`BirthDateModal.tsx`)
- [ ] `YYYY-MM-DD` 형식 검증
- [ ] age 자동 계산
- [ ] userStay 업데이트

### Phase 6: 방 배정 로직 변경
**목표**: 코골이 boolean 처리 및 1인실 제어

#### 6.1 코골이 선택 단순화
- [ ] `src/types/index.ts` 수정: `SnoringLevel` → `boolean`
- [ ] UI 컴포넌트 수정: 있음/없음 선택
- [ ] userStays.snoring 필드 업데이트
- [ ] 기존 데이터 마이그레이션 (선택사항)

#### 6.2 1인실 선택 제어 로직
- [ ] `users.singleAllowed` 필드 확인
- [ ] 1인실 선택 UI 조건부 렌더링
- [ ] `singleAllowed = false` 시 안내 모달 표시
- [ ] 모달 문구: "1인실은 관리자에게 문의 후 추가 결제 이후 이용 가능합니다."

#### 6.3 방 배정 완료 로직
- [ ] 조건 검증 (성별, 정원, 1인실 권한)
- [ ] userStay 업데이트:
  - `status: ASSIGNED`
  - `roomId` 저장
  - `roomType: SINGLE | SHARED`
  - `assignedAt` 저장
- [ ] rooms 컬렉션 업데이트 (기존 로직 활용)

### Phase 7: 기존 데이터 마이그레이션 (필요 시)
**목표**: Realtime Database → Firestore 데이터 이전

#### 7.1 마이그레이션 스크립트 작성
- [ ] `scripts/migrate-to-firestore.ts` 신규 생성
- [ ] Realtime Database 데이터 읽기
- [ ] Firestore 형식으로 변환
- [ ] Firestore에 쓰기 (배치 처리)
- [ ] 진행률 표시

#### 7.2 데이터 검증
- [ ] 이메일 중복 확인
- [ ] FK 관계 유효성 검증
- [ ] 데이터 무결성 체크
- [ ] 롤백 계획

### Phase 8: 테스트 및 검증
**목표**: 전체 시스템 테스트

#### 8.1 단위 테스트 작성/수정
- [ ] Firestore 함수 테스트 (Mock 사용)
- [ ] CSV 파서 테스트
- [ ] 유효성 검증 로직 테스트

#### 8.2 통합 테스트
- [ ] 로그인 흐름 테스트
- [ ] 방 배정 흐름 테스트
- [ ] 관리자 업로드 테스트

#### 8.3 E2E 테스트
- [ ] 전체 사용자 시나리오 테스트
- [ ] 에러 케이스 테스트
- [ ] 성능 테스트

---

## ⚠️ 주의사항 및 고려사항

### Firestore 특성
1. **데이터 호환성**: 기존 Realtime Database 데이터와 구조가 완전히 다름
2. **인덱스 설정**: Firestore는 복합 인덱스가 필요할 수 있음 (firestore.indexes.json)
3. **UNIQUE 제약**: Firestore는 기본적으로 UNIQUE 제약이 없음
   - 해결책 1: Cloud Functions로 검증
   - 해결책 2: 클라이언트 측 검증 (보안 취약)
   - 해결책 3: 이메일을 Document ID로 사용 (권장)
4. **쿼리 제한**: 
   - 단순 쿼리는 무료, 복합 쿼리는 인덱스 필요
   - `where` 절은 최대 1개 필드 (복합 인덱스 사용 시 여러 필드 가능)
5. **실시간 구독**: `onSnapshot` 사용 (Realtime Database의 `onValue`와 유사)
6. **트랜잭션**: `runTransaction` 사용 (배치 쓰기는 `writeBatch`)

### EmailJS OTP 인증 관련
- **EmailJS는 변경 없음**: 마이그레이션 후에도 그대로 사용
- **OTP 검증 데이터**: 
  - 현재: Realtime Database의 `otp_requests` 컬렉션
  - 마이그레이션 옵션:
    1. 기존 Realtime Database 유지 (병행 사용)
    2. Firestore의 `otpRequests` 컬렉션으로 마이그레이션
- **현재 코드 위치**: 
  - `src/components/auth/RegistrationModal.tsx` (OTP 발송)
  - `src/firebase/users.ts` (OTP 검증: `createOtpRequest`, `verifyOtpRequest`)

### 데이터 구조 차이점
| Realtime Database | Firestore |
|------------------|-----------|
| JSON 트리 구조 | Document/Collection 구조 |
| `ref(database, 'users/123')` | `doc(firestore, 'users/123')` |
| `onValue(ref, callback)` | `onSnapshot(doc, callback)` |
| `set(ref, data)` | `setDoc(doc, data)` |
| `update(ref, data)` | `updateDoc(doc, data)` |
| `get(ref)` | `getDoc(doc)` |
| `push(ref)` | `addDoc(collection, data)` |

### 마이그레이션 전략
1. **병행 운영**: 일정 기간 Realtime Database와 Firestore 병행 사용
2. **단계적 전환**: 컬렉션별로 순차 마이그레이션
3. **데이터 검증**: 마이그레이션 후 데이터 무결성 확인
4. **롤백 계획**: 문제 발생 시 Realtime Database로 복귀 가능하도록 준비

---

## 📝 예상 작업 시간 및 우선순위

### Phase 1: Firestore 설정 및 기본 구조
**예상 시간**: 2-3일  
**우선순위**: 최우선
- Firestore 초기화: 0.5일
- 인덱스 설정: 0.5일
- Security Rules: 1일
- 타입 정의: 1일

### Phase 2: users 컬렉션 마이그레이션
**예상 시간**: 2-3일  
**우선순위**: 최우선
- CRUD 함수 작성: 1.5일
- 이메일 중복 검증: 1일
- 실시간 구독: 0.5일

### Phase 3: userStays 컬렉션 마이그레이션
**예상 시간**: 1-2일  
**우선순위**: 높음
- CRUD 함수 작성: 1일
- FK 관계 관리: 0.5일

### Phase 4: 유저 등록 시스템 변경
**예상 시간**: 2-3일  
**우선순위**: 높음
- CSV/JSON 파서: 1일
- 업로드 UI: 1일
- 일괄 등록 API: 1일

### Phase 5: 로그인 및 인증 흐름 변경
**예상 시간**: 2-3일  
**우선순위**: 높음
- 이메일 인증 수정: 1일 (EmailJS는 변경 없음, Firestore 조회만 변경)
- userStays 생성/조회: 1일
- 생년월일 등록: 1일

### Phase 6: 방 배정 로직 변경
**예상 시간**: 2일  
**우선순위**: 중간
- 코골이 boolean 처리: 0.5일
- 1인실 제어 로직: 1일
- 모달 문구 변경: 0.5일

### Phase 7: 기존 데이터 마이그레이션 (필요 시)
**예상 시간**: 1-2일  
**우선순위**: 낮음 (데이터 마이그레이션 필요 시에만)
- 마이그레이션 스크립트: 1일
- 데이터 검증: 1일

### Phase 8: 테스트 및 검증
**예상 시간**: 2-3일  
**우선순위**: 필수
- 단위 테스트: 1일
- 통합 테스트: 1일
- E2E 테스트: 1일

**총 예상 시간**: 14-20일 (데이터 마이그레이션 제외)

---

## 🚀 시작 전 체크리스트

### 필수 사항
- [ ] Firebase 프로젝트에 Firestore 활성화 확인
- [ ] Firestore 모드 선택 (Native mode 권장)
- [ ] 기존 Realtime Database 데이터 백업
- [ ] 마이그레이션 브랜치 생성 (`git checkout -b firestore-migration`)
- [ ] 개발 환경에서 Firestore 테스트 설정
- [ ] **EmailJS 환경 변수 확인** (변경 없음)
  - `VITE_EMAILJS_SERVICE_ID` 확인
  - `VITE_EMAILJS_TEMPLATE_ID` 확인
  - `VITE_EMAILJS_PUBLIC_KEY` 확인

### 권장 사항
- [ ] Firestore 콘솔에서 테스트 컬렉션 생성/삭제 테스트
- [ ] 인덱스 생성 권한 확인
- [ ] Security Rules 테스트 환경 준비
- [ ] 마이그레이션 롤백 계획 수립
- [ ] EmailJS 서비스 상태 확인 (OTP 발송 테스트)

---

## 📚 참고 자료

### Firestore 주요 함수
```typescript
// 초기화
import { getFirestore } from 'firebase/firestore';
const firestore = getFirestore(app);

// CRUD
import { 
  collection, doc, getDoc, getDocs, 
  setDoc, updateDoc, deleteDoc, 
  addDoc, query, where, orderBy 
} from 'firebase/firestore';

// 실시간 구독
import { onSnapshot } from 'firebase/firestore';

// 트랜잭션
import { runTransaction } from 'firebase/firestore';

// 배치
import { writeBatch } from 'firebase/firestore';
```

### 이메일 UNIQUE 구현 예시
```typescript
// 방법 1: Document ID로 이메일 사용 (권장)
const userRef = doc(firestore, 'users', email);
await setDoc(userRef, userData);

// 방법 2: 쿼리로 중복 확인
const q = query(
  collection(firestore, 'users'), 
  where('email', '==', email)
);
const snapshot = await getDocs(q);
if (!snapshot.empty) {
  throw new Error('이미 등록된 이메일입니다.');
}
```

---

## 🔄 마이그레이션 순서 권장사항

1. **Phase 1** 완료 후 즉시 **Phase 2** 시작
2. **Phase 2** 완료 후 **Phase 3** 시작
3. **Phase 3** 완료 후 **Phase 4-6** 병렬 또는 순차 진행 가능
4. **Phase 7**은 실제 운영 데이터 마이그레이션 시에만 수행
5. **Phase 8**은 각 Phase 완료 시마다 부분 테스트 수행

---

## 📝 진행 상황 추적

- [ ] Phase 1 시작
- [ ] Phase 1 완료
- [ ] Phase 2 시작
- [ ] Phase 2 완료
- [ ] Phase 3 시작
- [ ] Phase 3 완료
- [ ] Phase 4 시작
- [ ] Phase 4 완료
- [ ] Phase 5 시작
- [ ] Phase 5 완료
- [ ] Phase 6 시작
- [ ] Phase 6 완료
- [ ] Phase 7 시작 (필요 시)
- [ ] Phase 7 완료 (필요 시)
- [ ] Phase 8 시작
- [ ] Phase 8 완료
- [ ] 프로덕션 배포

