# V_Up_HotelRoomMatch 코드 개선 계획

> 📅 작성일: 2026-01-15  
> 📌 버전: 1.0

---

## 📊 개요

본 문서는 V_Up_HotelRoomMatch 프로젝트의 코드 품질 향상을 위한 단계별 개선 계획입니다.  
패키지 버전 업데이트는 별도로 수동 진행 예정이며, 본 계획은 **코드 레벨 개선**에 집중합니다.

---

## 🔴 Phase 1: 보안 강화 (Security Hardening)

### 1.1 Firebase Security Rules 개선

**현재 문제점:**
- `rooms` 노드가 인증 없이 읽기 가능 (`.read: true`)
- 데이터 검증 규칙(`.validate`)이 부족

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `database.rules.json` | 모든 노드에 인증 필수 적용 |
| `database.rules.json` | 사용자별 데이터 접근 제한 추가 |
| `database.rules.json` | 필수 필드 검증 규칙 추가 |

**예시 코드:**
```json
{
  "rooms": {
    ".read": "auth != null",
    ".write": "auth != null",
    "$roomId": {
      ".validate": "newData.hasChildren(['capacity', 'floor'])"
    }
  }
}
```

---

### 1.2 에러 처리 표준화

**현재 문제점:**
- `console.error`만 사용하는 곳이 다수
- 사용자에게 에러 상황이 제대로 전달되지 않음

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `src/utils/errorHandler.js` | [NEW] 글로벌 에러 핸들러 유틸 생성 |
| `src/firebase/*.js` | try-catch 블록에 표준 에러 처리 적용 |
| `src/components/ui/ErrorBoundary.jsx` | 에러 로깅 서비스 연동 준비 |

---

## 🟠 Phase 2: 코드 구조 개선 (Refactoring)

### 2.1 App.jsx 분리 (653줄 → 모듈화)

**현재 문제점:**
- 상태 관리, 이벤트 핸들러, 렌더링 로직이 한 파일에 집중
- 유지보수 및 테스트 어려움

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `src/hooks/useInvitationHandlers.js` | [NEW] 초대 관련 로직 분리 |
| `src/hooks/useRequestHandlers.js` | [NEW] 요청 처리 로직 분리 |
| `src/hooks/useFloorNavigation.js` | [NEW] 층 선택/네비게이션 로직 분리 |
| `src/App.jsx` | 분리된 훅 사용으로 간소화 |

**목표 구조:**
```
App.jsx (200줄 이하)
├── useUser()           # 기존 유지
├── useRooms()          # 기존 유지
├── useInvitationHandlers()  # NEW
├── useRequestHandlers()     # NEW
└── useFloorNavigation()     # NEW
```

---

### 2.2 상수 및 타입 정리

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `src/utils/constants.js` | 모달 타입, 상태값 등 중앙 집중화 |
| `src/types/index.d.ts` | [NEW] JSDoc 타입 정의 (TypeScript 도입 전 단계) |

---

## 🟡 Phase 3: 테스트 코드 추가 (Testing)

### 3.1 단위 테스트 작성

**현재 상태:**
- `src/firebase/__tests__` 폴더 존재하나 비어있음
- 테스트 프레임워크 미설정

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `vitest.config.js` | [NEW] Vitest 테스트 설정 |
| `package.json` | 테스트 스크립트 추가 |
| `src/hooks/__tests__/useUser.test.js` | [NEW] useUser 훅 테스트 |
| `src/hooks/__tests__/useRooms.test.js` | [NEW] useRooms 훅 테스트 |
| `src/utils/__tests__/sanitize.test.js` | [NEW] 보안 유틸 테스트 |

**테스트 커버리지 목표:**
- 핵심 훅: 80% 이상
- 유틸 함수: 90% 이상

---

### 3.2 E2E 테스트 추가

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `playwright.config.js` | [NEW] Playwright 설정 |
| `e2e/registration.spec.js` | [NEW] 사용자 등록 플로우 테스트 |
| `e2e/room-selection.spec.js` | [NEW] 객실 선택 플로우 테스트 |

---

## 🟢 Phase 4: 성능 및 UX 개선 (Optimization)

### 4.1 렌더링 최적화

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `src/components/room/RoomCard.jsx` | `React.memo` 적용 |
| `src/components/room/RoomGrid.jsx` | 가상화(virtualization) 검토 |
| `src/App.jsx` | 불필요한 리렌더링 방지 |

---

### 4.2 접근성(A11y) 강화

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `src/components/ui/*.jsx` | `aria-label`, `role` 속성 추가 |
| `src/components/room/*.jsx` | 키보드 네비게이션 지원 |
| 전체 모달 컴포넌트 | 포커스 트래핑 구현 |

---

### 4.3 번들 최적화

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `vite.config.js` | `firebase/auth` 별도 청크 분리 |
| `src/App.jsx` | 동적 import 추가 적용 |

---

## 🔵 Phase 5: PWA 및 오프라인 지원 (Progressive Enhancement)

### 5.1 Service Worker 구현

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `public/sw.js` | [NEW] Service Worker 생성 |
| `src/main.jsx` | SW 등록 로직 추가 |
| `public/manifest.json` | [NEW] PWA 매니페스트 |

---

### 5.2 오프라인 캐싱

**개선 작업:**

| 파일 | 작업 내용 |
|-----|----------|
| `src/hooks/useOnlineStatus.js` | 오프라인 데이터 큐잉 기능 추가 |
| `src/firebase/config.js` | Firebase 오프라인 지속성 활성화 |

---

## 📋 Phase별 우선순위 요약

| Phase | 영역 | 우선순위 | 예상 소요 |
|-------|------|---------|----------|
| **Phase 1** | 보안 강화 | 🔴 높음 | 1일 |
| **Phase 2** | 코드 구조 개선 | 🟠 중상 | 2-3일 |
| **Phase 3** | 테스트 추가 | 🟡 중간 | 3-4일 |
| **Phase 4** | 성능/UX 개선 | 🟢 중하 | 2일 |
| **Phase 5** | PWA 지원 | 🔵 낮음 | 2일 |

---

## ✅ 체크리스트

- [ ] Phase 1 완료
- [ ] Phase 2 완료
- [ ] Phase 3 완료
- [ ] Phase 4 완료
- [ ] Phase 5 완료

---

## 📝 참고사항

- 각 Phase는 독립적으로 진행 가능하나, Phase 1(보안)은 **반드시 우선 진행** 권장
- TypeScript 전환은 Phase 2 이후 별도 계획으로 진행
- 패키지 버전 업데이트는 수동으로 별도 진행 예정
