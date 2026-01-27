# Room Assignment System – UI/UX & Logic Refactor Plan

본 문서는 객실 배정 시스템의 UI/UX 개선, 사용자 권한 로직, 동시 클릭 위험 대응,
그리고 React 상태 관리(useState) 리팩토링을 단계적으로 수행하기 위한 기술 설계 문서이다.

---

## Current Status Snapshot (2026-01-26)

### Done (Committed)
- **PHASE 1 / STEP 1-1**: 룸 카드 UI 표준화(고정 크기/섹션 분리/상태 칩)
- **PHASE 1 / STEP 1-2**: User Profile 영역 분리 + Room Assignment 영역 2열 레이아웃
- **PHASE 3 (reserved)**: 60초 임시 예약 선점/해제 + UI “예약중” 표시
- **PHASE 3 / Case 1 (pending)**: 룸메이트 초대 진행 중 방을 `pending`으로 잠그고(타인 접근 차단) 수락/거절/만료 시 해제
- **PHASE 3 / Case 2 (reserved 안내)**: reserved 클릭 시 Redirection Modal(잔여초 표시)로 안내(기존 toast 대체)

### In Progress / Next
- (대기) 다음 Phase 선택 요청

### Notes
- `reserved`는 `expiresAt` 기반으로 **만료 시 자동으로 비활성 처리**되며, 현재는 “데이터 삭제”까지 강제하지는 않습니다(재예약 시 덮어쓰기).

## PHASE 1. UI / UX 구조 개선

### STEP 1-1. 룸 상태 UI 표준화

#### Goal
- 객실 상태 표시의 글자 크기, 박스 크기, 정렬을 통일
- 가독성과 클릭 안정성 향상

#### Direction
- 영화 예매 좌석 UI 패턴 참고
- 모든 룸 박스 동일 사이즈 유지
- 색상 + 아이콘 기반 상태 표현
- 클릭 영역과 상태 표시 영역 분리

#### Room Status
- `available` : 선택 가능
- `reserved` : 임시 예약 중 (타이머 작동)
- `pending` : 룸메이트 수락 대기
- `occupied` : 배정 완료

#### Progress
- [x] STEP 1-1 구현(룸 카드 고정 크기/섹션 분리/상태 칩 표준화)

---

### STEP 1-2. User 정보 영역 분리

#### Goal
- User가 자신의 정보와 객실 정보를 혼동하지 않도록 구조 분리

#### Direction
- User Profile 영역
- Room Assignment 영역 분리
- 모바일 기준 세로 플로우 우선 설계

#### Progress
- [x] STEP 1-2 구현(User Profile 패널 분리 + 2열 레이아웃 적용)

---

## PHASE 2. User Logic Update (권한 기반)

### STEP 2-1. 1인실 선택 권한

#### Rule
- `allowedUsers.singleRoom === "Y"` 인 경우에만 1인실 선택 가능

#### UI Rule
- 1인실 선택 Modal에서는:
  - 룸메이트 초대 버튼 hidden
  - 룸메이트 옵션 UI 제거
  - 단일 사용자 확정 플로우만 노출

#### Progress
- [x] `allowedUsers.singleRoom === "Y"`인 경우 1인실 선택 가능 + 1인실 모달에서 룸메이트 UI 숨김/가드 처리

---

## PHASE 3. 동시 클릭 / 충돌 위험 대응

### 공통 개념: 60초 임시 예약 타이머

#### Core Rule
- 사용자가 객실을 클릭하는 순간:
  - 객실 상태를 `reserved`로 변경
  - `reservedAt` 타임스탬프 기록
  - **60초 타이머 시작**

#### 실시간 처리
- 서버 기준 시간으로 잔여 시간 계산
- 모든 유저에게 실시간 상태 동기화
- 타이머 종료 시 자동 해제

#### Progress
- [x] reserved(60초 임시 예약) 필드 추가 + 트랜잭션 기반 선점/해제 + UI reserved 표시(예약중)

---

### STEP 3-1. Case 정의

#### Case 1. 룸메이트 초대 중 충돌

**Situation**
- 유저가 룸메이트 초대를 진행했으나 아직 수락되지 않음

**Handling**
- 객실 상태: `pending`
- 실제 사용자 배정 데이터 미확정
- 다른 유저 접근 불가
- 수락/거절 결과에 따라:
  - 수락 → `occupied`
  - 거절/타임아웃 → `available`

---

#### Case 2. 동시 클릭 발생

**Situation**
- 다른 유저가 이미 해당 객실을 클릭하여 `reserved` 상태

**Handling**
- 클릭 시 즉시 차단
- Redirection Modal 노출:


- 타이머 종료 후 자동 재시도 가능

---

#### Case 3. 추가 대응 방안 (확장)

**Suggested Options**
- 서버 단 optimistic lock + 상태 검증
- 최종 확정 시점에만 hard lock
- 예약 유지 중 페이지 이탈 시 즉시 해제
- 동일 유저의 중복 클릭 방지 (client-side throttle)

---

### STEP 3-2. 추가 위험 시나리오 탐색

#### Risk Candidates
- 브라우저 종료 / 네트워크 단절
- 모바일 백그라운드 전환
- 다중 탭 동시 조작
- 서버-클라이언트 시간 불일치

#### Test Direction
- 타이머 강제 만료 테스트
- 새로고침 복구 시나리오
- 동시 3명 이상 클릭 부하 테스트
- 권한 변경 중 예약 상태 유지 테스트

---

## PHASE 4. React 상태 관리 리팩토링

### Persona
React 상태 관리 최적화 전문가

---

### STEP 4-1. 분석 대상
- `*.jsx`
- useState 다량 사용 컴포넌트

---

### STEP 4-2. 분석 요청

#### 1. useState 진단
- useState 남발 여부
- 불필요한 리렌더링 유발 지점
- 동기화가 필요한 연관 상태
- 파생 데이터로 대체 가능한 상태

---

#### 2. 개선 방안 (우선순위 필수)
- useReducer 통합 대상
- useMemo로 대체 가능한 파생 상태
- React Query로 전환 가능한 서버 상태
- Context로 승격할 전역 상태

---

#### 3. 리팩토링 코드 제공
- Before / After 비교
- 변경 이유 주석 필수

---

## AI 작업 요청 가이드

- Phase 단위로 분리 요청
- UI / Logic / State 분석 혼합 요청 금지
- 코드 포함 요청은 단독 Phase로 진행
- 동시 처리 요청 최소화 (토큰 과부하 방지)

---

