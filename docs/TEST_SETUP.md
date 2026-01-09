# 테스트 환경 설정 가이드

## 개요

이 프로젝트는 **Vitest**를 테스트 러너로 사용합니다. Vitest는 Vite와 완벽하게 통합되어 있으며, Jest와 유사한 API를 제공합니다.

## 설치된 패키지

- `vitest`: 테스트 러너
- `@testing-library/react`: React 컴포넌트 테스트
- `@testing-library/jest-dom`: DOM 관련 매처
- `@testing-library/user-event`: 사용자 이벤트 시뮬레이션
- `jsdom`: 브라우저 환경 시뮬레이션

## 테스트 실행

### 기본 실행 (Watch 모드)
```bash
npm test
```

### 한 번만 실행
```bash
npm test -- --run
```

### UI 모드로 실행
```bash
npm test:ui
```

### 커버리지 리포트 생성
```bash
npm test:coverage
```

## 테스트 파일 위치

테스트 파일은 소스 파일과 같은 디렉토리에 `__tests__` 폴더를 만들어 작성합니다:

```
src/
  utils/
    __tests__/
      matchingUtils.test.js
      genderUtils.test.js
      sanitize.test.js
    matchingUtils.js
    genderUtils.js
    sanitize.js
```

## 테스트 설정

### 설정 파일
- `vite.config.js`: Vitest 설정 포함
- `src/test/setup.js`: 테스트 환경 설정 (Firebase 모킹, localStorage 모킹 등)

### 주요 설정 내용

1. **환경**: `jsdom` (브라우저 환경 시뮬레이션)
2. **Firebase 모킹**: `src/firebase/config` 모듈 모킹
3. **localStorage 모킹**: 테스트 환경에서 사용 가능

## 현재 테스트 커버리지

### 완료된 테스트 (64개 테스트 통과)

#### matchingUtils.js (10개 테스트)
- ✅ 나이 차이 검증
- ✅ 코골이 호환성 검증
- ✅ 복합 조건 테스트

#### genderUtils.js (25개 테스트)
- ✅ 주민번호 성별 판별
- ✅ 주민번호 유효성 검사
- ✅ 출생연도 계산
- ✅ 나이 계산

#### sanitize.js (29개 테스트)
- ✅ HTML 이스케이프
- ✅ 문자열 정리
- ✅ 이름/회사명 정리
- ✅ 이메일 검증
- ✅ 보안 검증 (방번호, 세션 ID 등)

## 향후 작업 (Phase 2.4)

- 커스텀 훅 테스트 (`useRooms`, `useUser`, `useRoomSelection`)
- 컴포넌트 테스트
- 통합 테스트
- E2E 테스트 검토

## 참고 자료

- [Vitest 문서](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

