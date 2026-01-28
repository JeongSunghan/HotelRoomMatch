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
- **객실 선택** - 성별에 맞는 층/객실 선택 (1인실/2인실 지원)
- **룸메이트 매칭** - 2인실 입실 요청 및 룸메이트 초대
- **매칭 경고** - 코골이/나이 호환성 체크
- **실시간 동기화** - Firebase Realtime Database로 즉시 반영
- **모바일 최적화** - 반응형 디자인으로 모바일/태블릿 지원

### 🔧 관리자 기능
- **객실 관리**
  - 실시간 배정 현황 조회 및 관리
  - 현장등록(배정만): 이메일 미제공 인원 즉시 배정
  - 등록유저 배정: userlist에서 검색/선택하여 즉시 배정
  - 기존 배정 이동: 이미 배정된 유저도 다른 방으로 이동 가능
  - 현장등록 → 정식등록 전환: OTP 등록 완료 후 안전하게 치환
- **유저 관리**
  - 사전등록 유저 관리: CSV 일괄 업로드, 편집, 삭제
  - 등록 유저 관리: 정보 수정, 배정 현황 조회
  - 체크박스 다중 선택 및 일괄 삭제
- **운영 관리**
  - 마감일 설정: 등록 마감 시간 관리
  - 이력 조회: 모든 변경 사항 추적
  - 방 변경 요청 처리: 사용자 요청 승인/거부
  - 1:1 문의 관리: 사용자 문의 답변

---

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── admin/        # 관리자 컴포넌트 (12개)
│   │   ├── AdminDashboard.jsx
│   │   ├── RoomManagementTab.jsx      # 객실 관리 (현장등록/등록유저 배정)
│   │   ├── OnsiteMigrationModal.jsx    # 현장등록 → 정식등록 전환
│   │   ├── UserManagementTab.jsx       # 등록 유저 관리
│   │   ├── AllowedUsersTab.jsx         # 사전등록 유저 관리
│   │   └── ...
│   ├── auth/         # 인증 모달 (3개)
│   ├── room/         # 객실 관련 (11개)
│   │   ├── RoomCard.jsx                # 객실 카드 (모바일/데스크톱 반응형)
│   │   ├── RoomGrid.jsx                # 객실 그리드
│   │   └── ...
│   └── ui/           # 공통 UI (8개)
├── firebase/         # Firebase 모듈 (13개)
│   ├── tempGuests.js                  # 현장등록 추적 및 전환
│   ├── rooms.js                       # 객실 관리
│   ├── users.js                       # 유저 관리
│   └── ...
├── hooks/            # 커스텀 훅 (8개)
├── utils/            # 유틸리티 (9개)
├── contexts/         # React Context
└── data/             # 정적 데이터
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

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

### 환경 변수 설정
`.env.example`을 `.env`로 복사 후 Firebase 및 EmailJS 설정 입력:

```env
# Firebase 설정
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# EmailJS 설정 (OTP 이메일 발송용)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### Firebase Realtime Database Rules 배포
`database.rules.json` 파일을 Firebase 콘솔에서 배포하거나, Firebase CLI를 사용하여 배포:

```bash
firebase deploy --only database
```

> ⚠️ **중요**: `tempGuests` 경로가 rules에 포함되어 있어야 현장등록 기능이 정상 작동합니다.

---

## 📊 데이터 흐름

### 일반 사용자 플로우
```
사전등록(allowedUsers) → OTP 인증 → 사용자 등록(users) → 객실 선택 → 룸메이트 매칭 → 배정 완료(rooms)
```

### 관리자 플로우
```
1. 현장등록: 객실 관리 → 현장등록(배정만) → tempGuests 생성 → rooms.guests 추가
2. 등록유저 배정: 객실 관리 → 등록유저 배정 → users 선택 → rooms.guests + users.selectedRoom 동기화
3. 전환: 현장등록 게스트 → 정식등록 전환 → tempGuests 기반 치환 → users.selectedRoom 동기화
```

### 주요 데이터 구조
- **allowedUsers**: 사전등록 유저 목록 (이메일 기반)
- **users**: 등록 완료된 활성 유저 (sessionId 기반)
- **rooms**: 객실별 게스트 배정 현황
- **tempGuests**: 현장등록 게스트 추적 (전환용)
- **history**: 모든 변경 이력 기록

---

## 🎨 주요 기능 상세

### 현장등록 → 정식등록 전환
- **목적**: 이메일 미제공/접근 불가 인원을 현장에서 배정만 하고, 추후 OTP 등록 완료 시 정식 배정으로 전환
- **방식**: `tempGuestId` 기반 안전한 매칭 (동명이인 방지)
- **사용**: 객실 관리에서 현장등록 게스트의 "전환" 버튼 클릭

### 모바일 반응형 디자인
- **객실 카드**: 모바일에서는 가로형 리스트 형태로 표시
- **객실 그리드**: 모바일에서는 세로 리스트, 데스크톱에서는 5열 그리드
- **레이아웃**: 모바일에서 간격 최적화

### 보안 강화
- **입력값 검증**: 모든 사용자 입력 sanitize (XSS 방지)
- **서버 측 검증**: 성별/정원/1인실 권한 등 Firebase Rules로 강제
- **인증 필수**: 모든 DB 접근은 `auth != null` 확인
- **히스토리 로깅**: 모든 관리자 작업 추적

---

## 📦 빌드 최적화

- **Code Splitting**: 모달 컴포넌트 lazy loading
- **Chunk 분리**: firebase, vendor, index 분리
- **Sourcemap 제거**: 프로덕션 빌드 경량화
- **Tree Shaking**: 사용하지 않는 코드 자동 제거

---

## 🧪 테스트

```bash
# 단위 테스트 실행
npm test

# 테스트 UI 모드
npm run test:ui

# 커버리지 리포트 생성
npm run test:coverage
```

---

## 📝 주요 업데이트 내역

### 2026-01-28
- ✅ 현장등록(배정만) → 정식등록(OTP) 전환 기능 추가
- ✅ 관리자 객실 등록 UX 개선 (등록유저 배정 탭 추가)
- ✅ 모바일 반응형 디자인 완성
- ✅ RoomCard UI 개선 (hover 없이 이름 항상 표시)

### 2026-01-27
- ✅ 특이 케이스 버그 수정 (locked=true, selectedRoom=null)

### 2026-01-26
- ✅ 사전등록 유저 관리 기능 강화
- ✅ Firebase 에러 처리 및 안정화
- ✅ OTP/인증 시스템 안정화

---

## 📄 라이선스

Private Project - All Rights Reserved

---

<p align="center">
  <sub>Built with ❤️ for V-Up 58기 Workshops</sub>
</p>
