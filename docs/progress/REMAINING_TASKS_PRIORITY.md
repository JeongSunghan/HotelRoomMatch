# 남은 작업 우선순위 (2026-01-09)

## 📊 현재 상태
- ✅ 테스트 통과: 200개 (97.1%)
- ⚠️ 테스트 실패: 6개
- 📈 커버리지: ~45% (목표 60%)

---

## 🔴 High Priority - 즉시 처리

### 1. 남은 실패 테스트 수정 (6개)

#### 1.1 Vitest 4 문법 업데이트 ⚡
**파일**: `src/__tests__/integration/firestore-flow.test.ts`
**문제**: Vitest 3 → 4 업그레이드 시 문법 변경
**작업 시간**: 5분
**우선순위**: 🔴 긴급

#### 1.2 sanitize.test.js 수정 ⚡
**파일**: `src/utils/__tests__/sanitize.test.js`
**문제**: 전화번호 정리 로직 테스트 실패
**작업 시간**: 10분
**우선순위**: 🔴 긴급 (보안 관련)

#### 1.3 userStays Mock 데이터 개선 ⚡
**파일**: `src/firebase/firestore/__tests__/userStays.test.ts`
**문제**: getDocs mock이 항상 empty=true 반환
**작업 시간**: 15분
**우선순위**: 🔴 긴급 (핵심 로그인 플로우)

#### 1.4 roomAssignment 에러 메시지 통일
**파일**: `src/firebase/firestore/__tests__/roomAssignment.test.ts`
**문제**: 에러 메시지 불일치
**작업 시간**: 5분
**우선순위**: 🟡 중간

#### 1.5 Legacy users.test.ts
**파일**: `src/firebase/__tests__/users.test.ts`
**문제**: Legacy 코드, Firestore 완전 마이그레이션 후 삭제 예정
**작업 시간**: 5분 (스킵 처리) 또는 삭제
**우선순위**: 🟢 낮음

---

## 🟡 Medium Priority - 주요 기능 테스트 추가

### 2. Admin 컴포넌트 테스트 작성 (커버리지 향상)

#### 2.1 UserBulkUploadModal 테스트
**파일**: `src/components/admin/__tests__/UserBulkUploadModal.test.tsx` (신규)
**이유**: Phase 4 핵심 기능 (대량 사용자 등록)
**테스트 항목**:
- [ ] 파일 업로드 (CSV/JSON)
- [ ] 드래그앤드롭
- [ ] 데이터 미리보기
- [ ] 에러 하이라이팅
- [ ] 진행률 표시
- [ ] 결과 요약
**작업 시간**: 30분
**우선순위**: 🟡 중간

#### 2.2 BirthDateModal 테스트
**파일**: `src/components/auth/__tests__/BirthDateModal.test.tsx` (신규)
**이유**: Phase 5 핵심 기능 (로그인 플로우)
**테스트 항목**:
- [ ] 날짜 선택 UI
- [ ] 나이 계산
- [ ] 18세 미만 검증
- [ ] 제출 기능
**작업 시간**: 20분
**우선순위**: 🟡 중간

#### 2.3 RoomGrid 테스트
**파일**: `src/components/room/__tests__/RoomGrid.test.tsx` (신규)
**이유**: UI 리메이크 핵심 컴포넌트
**테스트 항목**:
- [ ] Bento Grid 레이아웃
- [ ] 층별 그룹화
- [ ] 반응형 (2-7 컬럼)
- [ ] 필터링 (roomTypeFilter)
**작업 시간**: 25분
**우선순위**: 🟡 중간

---

## 🟢 Low Priority - 정리 및 최적화

### 3. Utils 함수 테스트 추가

#### 3.1 errorHandler.test.ts
**파일**: `src/utils/__tests__/errorHandler.test.ts` (신규)
**작업 시간**: 15분

#### 3.2 notifications.test.ts
**파일**: `src/utils/__tests__/notifications.test.ts` (신규)
**작업 시간**: 15분

### 4. 커버리지 60% 달성 확인
**작업**: 
- [ ] 커버리지 리포트 생성
- [ ] 미달 파일 파악
- [ ] 추가 테스트 작성 계획

**작업 시간**: 20분

---

## ⏸️ 보류 (Phase 후반)

### 5. UIUX 스타일 분류
**파일**: `src/styles/uiux-remake.css` → 7개 파일 분리
**이유**: 기능에 영향 없음, 리팩토링 작업
**작업 시간**: 15-60분
**우선순위**: ⏸️ 보류

### 6. Firebase Emulator 연동
**이유**: 로컬 테스트 환경 구축
**작업 시간**: 1시간+
**우선순위**: ⏸️ 보류

### 7. E2E 테스트 도입
**이유**: 실제 사용자 시나리오 검증
**작업 시간**: 2시간+
**우선순위**: ⏸️ 보류

---

## 📅 작업 순서 (추천)

### Step 1: 실패 테스트 수정 (35분)
```
1. Vitest 4 문법 업데이트 (5분)
2. sanitize.test.js 수정 (10분)
3. userStays Mock 개선 (15분)
4. roomAssignment 에러 메시지 (5분)
```
**목표**: 실패 0개, 성공률 100%

### Step 2: 핵심 컴포넌트 테스트 (50분)
```
1. BirthDateModal 테스트 (20분)
2. UserBulkUploadModal 테스트 (30분)
```
**목표**: Phase 4-5 핵심 기능 테스트 커버리지 확보

### Step 3: 커버리지 확인 및 조정 (20분)
```
1. 커버리지 리포트 생성
2. 60% 미달 시 추가 테스트 계획
```
**목표**: 커버리지 60% 달성

### Step 4: 정리 (나중에)
```
1. Legacy 테스트 삭제
2. UIUX 스타일 분류
3. 문서 정리
```

---

## 🎯 오늘의 목표

### Minimum (최소)
- ✅ 실패 테스트 6개 → 0개
- ✅ 성공률 97.1% → 100%

### Target (목표)
- ✅ 실패 테스트 0개
- ✅ BirthDateModal 테스트 작성
- ✅ UserBulkUploadModal 테스트 작성
- ✅ 커버리지 55%+

### Stretch (도전)
- ✅ 커버리지 60%
- ✅ RoomGrid 테스트 작성
- ✅ Utils 테스트 2개 추가

---

**작성일**: 2026-01-09
**상태**: 진행 중
**다음 액션**: Step 1 - Vitest 4 문법 업데이트
