# 시스템 아키텍처 문서

**작성일**: 2025-01-02  
**프로젝트**: V-Up Hotel Room Match  
**목적**: 시스템의 전체 구조, 데이터 흐름, 컴포넌트 계층 구조를 문서화

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [아키텍처 다이어그램](#아키텍처-다이어그램)
3. [데이터 흐름](#데이터-흐름)
4. [컴포넌트 계층 구조](#컴포넌트-계층-구조)
5. [Firebase 데이터 구조](#firebase-데이터-구조)
6. [상태 관리 전략](#상태-관리-전략)
7. [인증 및 권한 관리](#인증-및-권한-관리)

---

## 시스템 개요

V-Up Hotel Room Match는 워크샵/행사 참가자를 위한 호텔 객실 매칭 시스템입니다. React 기반의 SPA(Single Page Application)로 구성되어 있으며, Firebase Realtime Database를 백엔드로 사용합니다.

### 핵심 기능

- **사용자 인증**: EmailJS를 통한 OTP 이메일 인증
- **객실 선택**: 실시간 객실 배정 현황 확인 및 선택
- **룸메이트 매칭**: 2인실 룸메이트 자동 매칭 및 호환성 검사
- **관리자 기능**: CSV 일괄 등록, 객실 관리, 유저 관리

### 기술 스택

- **Frontend**: React 18, TypeScript, Vite 5
- **Styling**: Tailwind CSS
- **Backend**: Firebase Realtime Database
- **Auth**: Firebase Anonymous Auth + EmailJS OTP
- **State Management**: React Context API, React Query
- **Testing**: Vitest, React Testing Library

---

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 브라우저                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │              React Application (SPA)              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │Components│  │  Hooks   │  │ Contexts │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘       │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │         Firebase Client SDK                │   │   │
│  │  └──────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Firebase Services                           │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ Realtime DB  │  │  Auth Service │                   │
│  │  (Backend)   │  │  (Anonymous)  │                   │
│  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ API
                          ▼
┌─────────────────────────────────────────────────────────┐
│              EmailJS Service                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │         OTP Email Delivery                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 데이터 흐름

### 사용자 등록 플로우

```
1. 사용자 이메일 입력
   ↓
2. EmailJS로 OTP 발송
   ↓
3. OTP 코드 입력 및 검증
   ↓
4. Firebase Anonymous Auth 생성
   ↓
5. allowedUsers에서 이메일 확인
   ↓
6. 사용자 정보 입력 (이름, 주민번호, 회사 등)
   ↓
7. users/{sessionId}에 저장
   ↓
8. 로컬 스토리지에 세션 저장
```

### 객실 선택 플로우

```
1. 사용자 로그인 상태 확인
   ↓
2. Firebase에서 rooms 데이터 실시간 구독
   ↓
3. 객실 그리드 렌더링 (성별 필터링)
   ↓
4. 사용자가 객실 선택
   ↓
5. 매칭 호환성 검사 (나이, 코골이)
   ↓
6. joinRequests/{roomNumber}에 요청 생성
   ↓
7. (2인실인 경우) 룸메이트 초대 또는 승인 대기
   ↓
8. 관리자 승인 또는 자동 배정
   ↓
9. rooms/{roomNumber}/guests에 게스트 추가
   ↓
10. users/{sessionId}에 selectedRoom 업데이트
```

### 관리자 작업 플로우

```
1. Admin 로그인 (Firebase Auth)
   ↓
2. admins/{uid} 확인 (Security Rules)
   ↓
3. 관리자 대시보드 접근
   ↓
4. CSV 업로드 → allowedUsers에 일괄 등록
   ↓
5. 객실 관리 → rooms/{roomNumber} 직접 수정
   ↓
6. 유저 관리 → users/{sessionId} 수정/삭제
   ↓
7. 변경 이력 → history에 로그 기록
```

---

## 컴포넌트 계층 구조

```
App.tsx (Root)
├── ThemeProvider
├── UIProvider
├── QueryProvider
├── ErrorBoundary
├── Header
│   ├── FloorSelector
│   └── SearchModal
├── RoomGrid
│   └── RoomCard (×N)
│       └── SelectionModal
│           ├── MatchingWarningModal
│           └── JoinRequestModal
├── MyRoomModal
├── RegistrationModal
│   └── AdditionalInfoModal
└── AdminPage (Route)
    └── AdminDashboard
        ├── Sidebar
        ├── AdminPanel
        │   ├── UserManagementTab
        │   ├── RoomManagementTab
        │   ├── AllowedUsersTab
        │   │   └── CsvUploadModal
        │   ├── RequestsTab
        │   ├── HistoryTab
        │   ├── InquiryManagement
        │   └── DeadlineSettings
        └── AdminLoginModal
```

### 주요 컴포넌트 역할

#### App.tsx
- 애플리케이션의 루트 컴포넌트
- 전역 Context Provider 설정
- 라우팅 관리
- 모달 lazy loading

#### RoomGrid
- 객실 그리드 레이아웃
- 층별 필터링
- 성별 필터링
- 실시간 객실 상태 구독

#### RoomCard
- 개별 객실 카드 UI
- 객실 상태에 따른 색상 표시
- 클릭 이벤트 처리

#### AdminDashboard
- 관리자 전용 대시보드
- 탭 기반 UI
- 통계 및 요약 정보 표시

---

## Firebase 데이터 구조

### 데이터베이스 스키마

```json
{
  "users": {
    "session_abc123": {
      "name": "홍길동",
      "email": "hong@example.com",
      "gender": "M",
      "age": 30,
      "company": "회사명",
      "selectedRoom": "1207",
      "selectedAt": 1704067200000,
      "locked": true,
      "snoring": "no",
      "ageTolerance": 5
    }
  },
  "rooms": {
    "1207": {
      "guests": [
        {
          "sessionId": "session_abc123",
          "name": "홍길동",
          "gender": "M",
          "age": 30,
          "selectedAt": 1704067200000
        }
      ],
      "lastUpdated": 1704067200000
    }
  },
  "allowedUsers": {
    "dXNlckBleGFtcGxlLmNvbQ==": {
      "email": "user@example.com",
      "registered": true,
      "registeredAt": 1704067200000
    }
  },
  "joinRequests": {
    "1207": {
      "session_abc123": {
        "sessionId": "session_abc123",
        "roomNumber": "1207",
        "status": "pending",
        "requestedAt": 1704067200000
      }
    }
  },
  "invitations": {
    "session_abc123": {
      "from": "session_xyz789",
      "roomNumber": "1207",
      "status": "pending",
      "createdAt": 1704067200000
    }
  },
  "admins": {
    "firebase_uid_123": {
      "email": "admin@example.com",
      "createdAt": 1704067200000
    }
  },
  "history": {
    "log_001": {
      "action": "ROOM_SELECTED",
      "userId": "session_abc123",
      "roomNumber": "1207",
      "timestamp": 1704067200000,
      "details": {}
    }
  },
  "settings": {
    "deadline": {
      "year": 2025,
      "month": 1,
      "day": 15,
      "hour": 23,
      "minute": 59
    }
  }
}
```

### 주요 노드 설명

#### users/{sessionId}
- 활성 사용자 정보
- 세션 ID를 키로 사용
- `selectedRoom`: 선택한 객실 번호
- `locked`: 객실 선택 후 잠금 여부

#### rooms/{roomNumber}
- 객실별 게스트 목록
- 실시간 동기화
- `guests`: 게스트 배열 (최대 capacity)

#### allowedUsers/{emailKey}
- 사전등록된 사용자 목록
- 이메일을 Base64 인코딩하여 키로 사용
- `registered`: 등록 완료 여부

#### joinRequests/{roomNumber}
- 입실 요청 목록
- `status`: pending, approved, rejected

#### invitations/{sessionId}
- 룸메이트 초대 목록
- `status`: pending, accepted, rejected

#### admins/{firebaseUid}
- 관리자 목록
- Firebase Auth UID를 키로 사용
- Security Rules에서 권한 확인에 사용

#### history/{logId}
- 시스템 변경 이력
- 모든 중요한 액션 기록
- 감사(audit) 목적

---

## 상태 관리 전략

### React Context API

#### UIContext
- 전역 UI 상태 관리
- Toast 알림
- 모달 표시/숨김
- 로딩 상태

#### QueryProvider (React Query)
- 서버 상태 관리
- 캐싱 및 동기화
- 백그라운드 업데이트

### 로컬 상태 관리

#### useState
- 컴포넌트 내부 상태
- 폼 입력값
- UI 토글 상태

#### localStorage
- 세션 정보 저장
- 오프라인 폴백 데이터
- 테마 설정

### Firebase 실시간 구독

#### onValue
- 실시간 데이터 동기화
- rooms, users 데이터 구독
- 자동 업데이트

---

## 인증 및 권한 관리

### 사용자 인증

1. **OTP 이메일 인증**
   - EmailJS를 통한 OTP 발송
   - OTP 코드 검증
   - Firebase Anonymous Auth 생성

2. **세션 관리**
   - `session_` 접두사로 세션 ID 생성
   - localStorage에 세션 저장
   - 세션 만료 시간 관리

### 관리자 인증

1. **Firebase Auth**
   - 이메일/비밀번호 로그인
   - Firebase Auth UID 확인

2. **권한 확인**
   - `admins/{uid}` 노드 확인
   - Security Rules에서 자동 검증

### Security Rules

```json
{
  "rules": {
    "users": {
      "$sessionId": {
        ".read": "auth != null && root.child('admins').child(auth.uid).exists() || $sessionId.startsWith('session_')",
        ".write": "auth != null && root.child('admins').child(auth.uid).exists() || ($sessionId.startsWith('session_') && !data.exists())"
      }
    },
    "rooms": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "admins": {
      "$uid": {
        ".read": "auth != null && $uid === auth.uid",
        ".write": false
      }
    }
  }
}
```

---

## 성능 최적화

### Code Splitting
- 모달 컴포넌트 lazy loading
- React.lazy() 사용
- 동적 import

### 빌드 최적화
- Vite 빌드 최적화
- Chunk 분리 (firebase, vendor, index)
- Tree shaking
- Sourcemap 제거 (프로덕션)

### 실시간 데이터 최적화
- 필요한 노드만 구독
- 구독 해제 관리
- 로컬 캐싱 (오프라인 지원)

---

## 보안 고려사항

### 입력값 검증
- XSS 방지 (HTML 이스케이프)
- SQL Injection 방지 (NoSQL이지만 유사 패턴 차단)
- 경로 traversal 방지

### Firebase Security Rules
- 읽기/쓰기 권한 제한
- Admin 권한 확인
- 데이터 무결성 보장

### 민감정보 보호
- 주민번호 부분 마스킹
- 이메일 Base64 인코딩
- 세션 ID 안전한 생성

---

**참고**: 이 문서는 시스템의 현재 상태를 반영하며, 변경 사항이 있을 때마다 업데이트됩니다.

