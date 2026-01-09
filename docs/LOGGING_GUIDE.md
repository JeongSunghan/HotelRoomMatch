# 로깅 가이드라인

**작성일**: 2025-01-02  
**프로젝트**: V-Up Hotel Room Match  
**목적**: 로깅 시스템 사용 방법, 모범 사례, 민감정보 처리 규칙을 정의

---

## 📋 목차

1. [로깅 시스템 개요](#로깅-시스템-개요)
2. [로그 레벨](#로그-레벨)
3. [로깅 함수 사용법](#로깅-함수-사용법)
4. [민감정보 처리](#민감정보-처리)
5. [환경별 로깅 전략](#환경별-로깅-전략)
6. [모범 사례](#모범-사례)

---

## 로깅 시스템 개요

V-Up Hotel Room Match는 구조화된 로깅 시스템을 제공합니다. 개발 환경과 프로덕션 환경에서 다른 로깅 전략을 사용하며, 민감정보를 자동으로 마스킹합니다.

### 주요 기능

- **로그 레벨 체계화**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **민감정보 자동 마스킹**: 이메일, 세션ID, PassKey 등
- **환경별 로깅 전략**: 개발/프로덕션 분리
- **구조화된 로그 포맷**: JSON 형식의 구조화된 로그
- **성능 측정**: 로그 그룹핑 및 성능 로깅 지원

---

## 로그 레벨

### DEBUG
- **용도**: 개발 중 디버깅 정보
- **출력 환경**: 개발 환경에서만
- **예시**: 변수 값, 함수 호출 추적

```typescript
debug.log('User data loaded', { userId: 'session_123' });
```

### INFO
- **용도**: 일반 정보성 로그
- **출력 환경**: 개발 환경에서만
- **예시**: 사용자 액션, 상태 변경

```typescript
debug.info('Room selected', { roomNumber: '1207' });
logAction('ROOM_SELECTED', 'RoomCard', { roomNumber: '1207' });
```

### WARN
- **용도**: 경고 메시지
- **출력 환경**: 개발 환경에서만
- **예시**: 예상치 못한 상황, 권장 사항

```typescript
debug.warn('Room capacity warning', { roomNumber: '1207', capacity: 2, guests: 1 });
```

### ERROR
- **용도**: 에러 발생
- **출력 환경**: 개발 및 프로덕션 모두
- **예시**: 예외 처리, API 오류

```typescript
debug.error('Failed to save user', { error: errorObj });
logError(error, { action: 'SAVE_USER', component: 'UserForm' });
```

### CRITICAL
- **용도**: 심각한 에러
- **출력 환경**: 개발 및 프로덕션 모두
- **예시**: 보안 이슈, 데이터 손실 위험

```typescript
debug.critical('Security violation detected', { userId: 'session_123' });
```

---

## 로깅 함수 사용법

### 기본 로거 (debug)

```typescript
import debug from '../utils/debug';

// DEBUG 레벨
debug.log('Debug message', { data: 'value' });

// INFO 레벨
debug.info('Info message', { data: 'value' });

// WARN 레벨
debug.warn('Warning message', { data: 'value' });

// ERROR 레벨
debug.error('Error message', { error: errorObj });

// CRITICAL 레벨
debug.critical('Critical error', { error: errorObj });
```

### 사용자 액션 로깅 (logAction)

```typescript
import { logAction } from '../utils/debug';

// 사용자 액션 로깅
logAction('ROOM_SELECTED', 'RoomCard', {
    roomNumber: '1207',
    userId: 'session_123'
});
```

### 에러 로깅 (logError)

```typescript
import { logError, LOG_LEVEL } from '../utils/debug';

try {
    // 작업 수행
} catch (error) {
    logError(error, {
        action: 'SAVE_USER',
        component: 'UserForm',
        data: { userId: 'session_123' },
        level: LOG_LEVEL.ERROR
    });
}
```

### 성능 측정 로깅 (logPerformance)

```typescript
import { logPerformance } from '../utils/debug';

const startTime = performance.now();

// 작업 수행
await someAsyncOperation();

logPerformance('Async operation', startTime, 'MyComponent');
```

### 로그 그룹핑

```typescript
import { logGroupStart, logGroupEnd } from '../utils/debug';

logGroupStart('User Registration Flow');
debug.info('Step 1: Email verification');
debug.info('Step 2: User data collection');
debug.info('Step 3: Room selection');
logGroupEnd();
```

---

## 민감정보 처리

### 자동 마스킹

로깅 시스템은 다음 민감정보를 자동으로 마스킹합니다:

#### 이메일
```
원본: user@example.com
마스킹: u***@e***.com
```

#### 세션 ID
```
원본: session_abc123xyz
마스킹: session_***
```

#### PassKey/Password
```
원본: password=secret123
마스킹: password=***
```

### 수동 마스킹

객체의 특정 필드를 마스킹하려면:

```typescript
import { maskSensitiveData } from '../utils/debug';

const userData = {
    email: 'user@example.com',
    sessionId: 'session_123',
    password: 'secret'
};

const masked = maskSensitiveData(userData);
// { email: 'u***@e***.com', sessionId: 'session_***', password: '***' }
```

### 민감정보 키 필터링

다음 키는 자동으로 마스킹됩니다:
- `password`, `pwd`, `pass`
- `secret`, `token`, `key`
- `email` (이메일 형식으로 마스킹)
- `sessionId` (세션 ID 형식으로 마스킹)

---

## 환경별 로깅 전략

### 개발 환경

- **모든 로그 레벨 출력**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **상세한 디버깅 정보**: 스택 트레이스, 변수 값
- **로그 그룹핑**: 관련 로그를 그룹으로 묶어 가독성 향상

### 프로덕션 환경

- **최소 로그 레벨**: ERROR, CRITICAL만 출력
- **민감정보 마스킹**: 모든 민감정보 자동 마스킹
- **성능 최적화**: 불필요한 로그 제거

### 환경 변수 설정

```env
# 개발 환경 (기본값)
VITE_LOG_LEVEL=DEBUG

# 프로덕션 환경
VITE_LOG_LEVEL=ERROR
```

---

## 모범 사례

### ✅ 좋은 예

#### 1. 구조화된 로그 사용
```typescript
logAction('ROOM_SELECTED', 'RoomCard', {
    roomNumber: '1207',
    userId: 'session_123',
    timestamp: Date.now()
});
```

#### 2. 적절한 로그 레벨 사용
```typescript
// 일반 정보
debug.info('User logged in', { userId: 'session_123' });

// 경고
debug.warn('Room capacity warning', { roomNumber: '1207' });

// 에러
logError(error, { action: 'SAVE_USER', component: 'UserForm' });
```

#### 3. 에러 컨텍스트 제공
```typescript
try {
    await saveUser(userData);
} catch (error) {
    logError(error, {
        action: 'SAVE_USER',
        component: 'UserForm',
        data: { userId: userData.id }
    });
}
```

### ❌ 나쁜 예

#### 1. 민감정보 직접 로깅
```typescript
// ❌ 나쁜 예
debug.log('User data', { email: 'user@example.com', password: 'secret123' });

// ✅ 좋은 예
debug.log('User data', { email: 'u***@e***.com', password: '***' });
```

#### 2. 과도한 로깅
```typescript
// ❌ 나쁜 예
debug.log('Rendering component');
debug.log('Component rendered');
debug.log('State updated');

// ✅ 좋은 예
logGroupStart('Component Render');
debug.info('Component rendered', { component: 'RoomCard' });
logGroupEnd();
```

#### 3. 에러 정보 부족
```typescript
// ❌ 나쁜 예
debug.error('Error occurred');

// ✅ 좋은 예
logError(error, {
    action: 'SAVE_USER',
    component: 'UserForm',
    data: { userId: 'session_123' }
});
```

---

## 로그 필터링

### 컴포넌트별 필터링

```typescript
import { setLogFilter } from '../utils/debug';

// 특정 컴포넌트만 로깅
setLogFilter({
    components: ['RoomCard', 'UserForm']
});

// 필터 초기화
import { resetLogFilter } from '../utils/debug';
resetLogFilter();
```

### 로깅 비활성화

```typescript
import { setLogFilter } from '../utils/debug';

// 모든 로깅 비활성화
setLogFilter({ enabled: false });
```

---

## 에러 핸들러와의 통합

로깅 시스템은 `errorHandler`와 통합되어 있습니다:

```typescript
import { handleError, ERROR_LEVEL } from '../utils/errorHandler';

try {
    await someOperation();
} catch (error) {
    const message = handleError(error, {
        action: 'OPERATION',
        component: 'MyComponent',
        level: ERROR_LEVEL.ERROR
    });
    // 자동으로 logError 호출됨
}
```

---

## 성능 고려사항

### 프로덕션 빌드 최적화

- 개발 환경에서만 DEBUG, INFO, WARN 로그 출력
- 프로덕션에서는 ERROR, CRITICAL만 출력
- Tree shaking으로 사용하지 않는 로그 코드 제거

### 로그 버퍼링 (향후 개선)

```typescript
// 향후 구현 예정
import { logBuffer } from '../utils/debug';

// 로그를 버퍼에 저장
logBuffer.add('INFO', { message: 'User action' });

// 일괄 출력
logBuffer.flush();
```

---

## 외부 로깅 서비스 연동 (향후 개선)

### 예시: Sentry 연동

```typescript
// 향후 구현 예정
import { initExternalLogger } from '../utils/debug';

initExternalLogger({
    service: 'sentry',
    dsn: process.env.VITE_SENTRY_DSN
});

// CRITICAL 에러는 자동으로 Sentry에 전송
debug.critical('Critical error', { error: errorObj });
```

---

## 문제 해결

### 로그가 출력되지 않을 때

1. **환경 확인**
   ```typescript
   console.log('Is Dev:', import.meta.env.DEV);
   console.log('Is Prod:', import.meta.env.PROD);
   ```

2. **필터 확인**
   ```typescript
   import { setLogFilter, resetLogFilter } from '../utils/debug';
   resetLogFilter(); // 필터 초기화
   ```

3. **로그 레벨 확인**
   - 개발 환경: 모든 레벨 출력
   - 프로덕션: ERROR, CRITICAL만 출력

### 민감정보가 마스킹되지 않을 때

1. **패턴 확인**: 이메일, 세션ID 형식 확인
2. **수동 마스킹**: `maskSensitiveData` 함수 사용
3. **키 이름 확인**: 민감정보 키 이름이 표준 패턴과 일치하는지 확인

---

**참고**: 이 가이드라인은 로깅 시스템의 현재 상태를 반영하며, 변경 사항이 있을 때마다 업데이트됩니다.

