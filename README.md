<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/Firebase-10.14-FFCA28?style=for-the-badge&logo=firebase" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwindcss" />
</p>

# 🏨 V-Up Hotel Room Match

**워크샵/행사 참가자를 위한 호텔 객실 매칭 시스템**

> 참가자들이 원하는 객실을 선택하고, 2인실의 경우 룸메이트와 매칭하는 웹 애플리케이션

---

## ✨ 주요 기능

### 👤 사용자 기능
- **OTP 이메일 인증** - 사전등록된 이메일로 간편 인증
- **객실 선택** - 성별에 맞는 층/객실 선택
- **룸메이트 매칭** - 2인실 입실 요청 및 룸메이트 초대
- **매칭 경고** - 코골이/나이 호환성 체크
- **다크 모드** - 시스템 테마 연동

### 🔧 관리자 기능
- **CSV 일괄 등록** - 엑셀에서 복사 붙여넣기 지원
- **객실 관리** - 실시간 배정 현황 관리
- **유저 관리** - 수정/삭제/정렬/필터
- **마감일 설정** - 등록 마감 관리
- **이력 조회** - 변경 이력 추적

---

## 📁 프로젝트 구조

```
V_Up_HotelRoomMatch/
├── src/
│   ├── components/           # React 컴포넌트
│   │   ├── admin/            # 관리자 컴포넌트 (11개)
│   │   │   ├── AdminDashboard.tsx      # 관리자 대시보드
│   │   │   ├── AdminPanel.tsx          # 관리자 패널
│   │   │   ├── AllowedUsersTab.tsx     # 사전등록 유저 관리
│   │   │   ├── CsvUploadModal.tsx      # CSV 일괄 업로드
│   │   │   ├── DeadlineSettings.tsx    # 마감 시간 설정
│   │   │   ├── HistoryTab.tsx          # 변경 이력 조회
│   │   │   ├── InquiryManagement.tsx   # 1:1 문의 관리
│   │   │   ├── RequestsTab.tsx          # 요청 관리
│   │   │   ├── RoomManagementTab.tsx    # 객실 관리
│   │   │   ├── Sidebar.tsx              # 사이드바
│   │   │   └── UserManagementTab.tsx    # 유저 관리
│   │   ├── auth/             # 인증 모달 (3개)
│   │   │   ├── AdditionalInfoModal.tsx # 추가 정보 입력
│   │   │   ├── AdminLoginModal.tsx      # 관리자 로그인
│   │   │   └── RegistrationModal.tsx    # 이메일 인증
│   │   ├── room/             # 객실 관련 (10개)
│   │   │   ├── CancelledModal.tsx       # 방 배정 취소 알림
│   │   │   ├── InvitationModal.tsx      # 룸메이트 초대
│   │   │   ├── JoinRequestModal.tsx     # 입실 요청
│   │   │   ├── MatchingWarningModal.tsx # 매칭 경고
│   │   │   ├── MyRoomModal.tsx          # 내 객실 정보
│   │   │   ├── RoomCard.tsx             # 개별 객실 카드
│   │   │   ├── RoomGrid.tsx             # 객실 그리드
│   │   │   ├── SelectionModal.tsx       # 객실 선택 확인
│   │   │   ├── SingleRoomInfoModal.tsx # 1인실 안내
│   │   │   └── WaitingApprovalModal.tsx # 승인 대기
│   │   └── ui/               # 공통 UI (8개)
│   │       ├── ConfirmModal.tsx         # 확인 모달
│   │       ├── ErrorBoundary.tsx        # 에러 바운더리
│   │       ├── FloorSelector.tsx        # 층 선택기
│   │       ├── Header.tsx               # 헤더
│   │       ├── LoadingSpinner.tsx       # 로딩 스피너
│   │       ├── OfflineBanner.tsx        # 오프라인 배너
│   │       ├── SearchModal.tsx          # 검색 모달
│   │       └── Toast.tsx                # Toast 알림
│   ├── firebase/             # Firebase 모듈 (12개)
│   │   ├── config.ts         # Firebase 설정 및 초기화
│   │   ├── auth.ts           # Firebase Admin 인증
│   │   ├── users.ts          # 사용자 관리
│   │   ├── rooms.ts          # 객실 관리
│   │   ├── invitations.ts    # 룸메이트 초대
│   │   ├── allowedUsers.ts   # 사전등록 유저 관리
│   │   ├── joinRequests.ts  # 입실 요청 관리
│   │   ├── history.ts        # 히스토리 로깅
│   │   ├── inquiries.ts      # 문의 관리
│   │   ├── requests.ts       # 방 변경 요청
│   │   ├── settings.ts       # 설정 관리
│   │   └── index.ts         # Firebase 모듈 진입점
│   ├── hooks/                # 커스텀 훅 (8개)
│   │   ├── useInvitation.ts  # 룸메이트 초대 관리
│   │   ├── useJoinRequests.ts # 입실 요청 관리
│   │   ├── useLoading.ts     # 로딩 상태 관리
│   │   ├── useOnlineStatus.ts # 온라인 상태 감지
│   │   ├── useRooms.ts       # 객실 상태 관리
│   │   ├── useRoomSelection.ts # 객실 선택 로직
│   │   ├── useUser.ts        # 사용자 관리
│   │   └── useTheme.tsx      # 테마 관리
│   ├── utils/                # 유틸리티 (11개)
│   │   ├── constants.ts      # 애플리케이션 상수
│   │   ├── csvExport.ts      # CSV 내보내기
│   │   ├── csvParser.ts      # CSV 파싱
│   │   ├── debug.ts          # 디버그 로거
│   │   ├── errorHandler.ts   # 전역 에러 핸들러
│   │   ├── errorMessages.ts  # 에러 메시지
│   │   ├── genderUtils.ts    # 성별 및 주민번호 유틸
│   │   ├── matchingUtils.ts  # 룸메이트 매칭 검사
│   │   ├── notifications.ts  # 브라우저 알림
│   │   ├── rateLimit.ts      # Rate Limiting
│   │   └── sanitize.ts       # 입력값 정리 및 검증
│   ├── contexts/             # React Context
│   │   ├── UIContext.tsx     # UI 상태 관리
│   │   ├── QueryProvider.tsx # Query 상태 관리
│   │   └── index.js          # Context 진입점
│   ├── pages/                # 페이지 컴포넌트
│   │   ├── AdminPage.tsx     # 관리자 페이지
│   │   └── ContactPage.tsx   # 문의사항 페이지
│   ├── types/                # TypeScript 타입 정의
│   │   └── index.ts          # 타입 정의 파일
│   ├── data/                 # 정적 데이터
│   │   └── roomData.js       # 객실 데이터
│   ├── test/                 # 테스트 설정
│   │   └── setup.js          # Vitest 설정
│   ├── App.tsx               # 메인 앱 컴포넌트
│   ├── main.tsx              # 애플리케이션 진입점
│   └── index.css             # 전역 스타일
├── docs/                     # 문서
│   ├── ARCHITECTURE.md       # 아키텍처 문서
│   ├── DEVELOPMENT_GUIDE.md  # 개발 가이드라인
│   ├── SECURITY_RULES_MIGRATION.md # 보안 규칙 마이그레이션
│   ├── TEST_SETUP.md         # 테스트 설정 가이드
│   └── PHASE2_PLAN.md        # Phase 2 작업 계획
├── database.rules.json        # Firebase Security Rules
├── vercel.json               # Vercel 배포 설정
├── tsconfig.json             # TypeScript 설정
├── vite.config.js            # Vite 설정
├── tailwind.config.js        # Tailwind CSS 설정
├── package.json              # 프로젝트 의존성
└── README.md                 # 프로젝트 문서
```

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | React 18, Vite 5 |
| **Styling** | Tailwind CSS |
| **Backend** | Firebase Realtime Database |
| **Auth** | Firebase Anonymous + OTP |
| **Deploy** | Vercel |

---

## 🚀 설치 및 실행

### 사전 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- Firebase 프로젝트 (Realtime Database 활성화)
- EmailJS 계정 (OTP 이메일 발송용)

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd V_Up_HotelRoomMatch

# 의존성 설치
npm install
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

```env
# Firebase 설정 (필수)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# EmailJS 설정 (OTP 이메일 발송용, 필수)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

#### Firebase 설정 방법
1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Realtime Database 생성 및 활성화
3. 프로젝트 설정 > 일반 > 앱에서 웹 앱 추가
4. Firebase SDK 설정에서 환경 변수 값 복사

#### EmailJS 설정 방법
1. [EmailJS](https://www.emailjs.com/) 계정 생성
2. 이메일 서비스 연결 (Gmail, Outlook 등)
3. 이메일 템플릿 생성 (OTP 코드 변수 포함)
4. 통합 > API Keys에서 Public Key 확인
5. 환경 변수에 Service ID, Template ID, Public Key 입력

### 실행

```bash
# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 테스트 실행
npm test

# 테스트 UI 모드
npm run test:ui

# 테스트 커버리지 확인
npm run test:coverage
```

---

## 📊 데이터 흐름

```
사용자 등록 → OTP 인증 → 객실 선택 → 룸메이트 매칭 → 배정 완료
     ↓              ↓           ↓              ↓
 allowedUsers    users     joinRequests    rooms
```

---

## 🌙 다크 모드

CSS 변수 기반 테마 시스템:
- `localStorage` 저장
- 시스템 테마 자동 감지
- 헤더 토글 버튼

---

## 📦 빌드 최적화

- **Code Splitting**: 모달 컴포넌트 lazy loading
- **Chunk 분리**: firebase, vendor, index 분리
- **Sourcemap 제거**: 프로덕션 빌드 경량화

---

## 🚢 배포

### Vercel 배포

1. **Vercel 계정 연결**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **프로젝트 배포**
   ```bash
   vercel
   ```

3. **환경 변수 설정**
   - Vercel 대시보드 > 프로젝트 설정 > Environment Variables
   - `.env` 파일의 모든 환경 변수 추가
   - Production, Preview, Development 환경별로 설정 가능

4. **자동 배포 설정**
   - GitHub 저장소 연결 시 자동 배포
   - `main` 브랜치 푸시 시 Production 배포
   - PR 생성 시 Preview 배포

### 수동 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# dist/ 폴더가 생성되며, 이 폴더를 정적 호스팅 서비스에 업로드
# - Netlify, GitHub Pages, Firebase Hosting 등
```

---

## 🐛 트러블슈팅

### Firebase 연결 오류

**문제**: "Firebase configuration error: Missing environment variables"

**해결**:
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 모든 Firebase 환경 변수가 올바르게 설정되었는지 확인
3. 환경 변수 이름이 `VITE_` 접두사로 시작하는지 확인
4. 개발 서버 재시작 (`npm run dev`)

### EmailJS OTP 발송 실패

**문제**: OTP 이메일이 발송되지 않음

**해결**:
1. EmailJS 환경 변수 확인 (`VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`)
2. EmailJS 대시보드에서 서비스 상태 확인
3. 이메일 템플릿에 `{{otp_code}}` 변수가 포함되어 있는지 확인
4. 브라우저 콘솔에서 에러 메시지 확인

### TypeScript 타입 오류

**문제**: 빌드 시 타입 오류 발생

**해결**:
1. `npm install`로 의존성 재설치
2. `tsconfig.json` 설정 확인
3. 타입 정의 파일(`src/types/index.ts`) 확인
4. IDE 재시작 또는 타입 서버 재시작

### 테스트 실행 오류

**문제**: 테스트가 실행되지 않거나 실패

**해결**:
1. `node_modules` 삭제 후 `npm install` 재실행
2. `src/test/setup.js` 파일 확인
3. Vitest 버전 확인 (`npm list vitest`)
4. 테스트 파일 경로 및 확장자 확인 (`.test.js`, `.test.ts`)

### 빌드 실패

**문제**: `npm run build` 실행 시 오류

**해결**:
1. Node.js 버전 확인 (18.x 이상 권장)
2. 모든 환경 변수 설정 확인
3. `package.json`의 의존성 버전 확인
4. `vite.config.js` 설정 확인
5. 빌드 로그에서 구체적인 오류 메시지 확인

---

## 📚 추가 문서

- [아키텍처 문서](./docs/ARCHITECTURE.md) - 시스템 아키텍처 및 데이터 흐름
- [개발 가이드라인](./docs/DEVELOPMENT_GUIDE.md) - 코딩 컨벤션 및 개발 워크플로우
- [보안 규칙 마이그레이션](./docs/SECURITY_RULES_MIGRATION.md) - Firebase Security Rules 가이드
- [테스트 설정 가이드](./docs/TEST_SETUP.md) - 테스트 환경 구성 방법

---

## 📄 라이선스

Private Project - All Rights Reserved

---

<p align="center">
  <sub>Built with ❤️ for V-Up Workshops</sub>
</p>
