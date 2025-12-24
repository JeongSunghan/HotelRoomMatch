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
src/
├── components/
│   ├── admin/        # 관리자 컴포넌트 (11개)
│   ├── auth/         # 인증 모달 (3개)
│   ├── room/         # 객실 관련 (10개)
│   └── ui/           # 공통 UI (8개)
├── firebase/         # Firebase 모듈 (12개)
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
`.env.example`을 `.env`로 복사 후 Firebase 설정 입력:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
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

## 📄 라이선스

Private Project - All Rights Reserved

---

<p align="center">
  <sub>Built with ❤️ for V-Up Workshops</sub>
</p>
