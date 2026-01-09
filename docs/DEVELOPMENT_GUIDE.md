# 개발 가이드라인

**작성일**: 2025-01-02  
**프로젝트**: V-Up Hotel Room Match  
**목적**: 개발자들이 프로젝트에 기여할 때 따라야 할 코딩 컨벤션, 워크플로우, 모범 사례를 정의

---

## 📋 목차

1. [코딩 컨벤션](#코딩-컨벤션)
2. [Git 워크플로우](#git-워크플로우)
3. [브랜치 전략](#브랜치-전략)
4. [PR 가이드라인](#pr-가이드라인)
5. [코드 리뷰 가이드](#코드-리뷰-가이드)
6. [테스트 가이드](#테스트-가이드)

---

## 코딩 컨벤션

### TypeScript

#### 타입 정의
- 모든 함수는 타입 정의 필수
- `any` 타입 사용 금지
- 인터페이스는 `PascalCase`로 명명
- 타입은 `src/types/index.ts`에 중앙 집중

```typescript
// ✅ 좋은 예
interface UserData {
    name: string;
    age: number;
}

function getUser(id: string): Promise<UserData | null> {
    // ...
}

// ❌ 나쁜 예
function getUser(id: any): any {
    // ...
}
```

#### 함수 작성
- 화살표 함수 또는 함수 선언 사용
- 매개변수와 반환 타입 명시
- JSDoc 주석 추가 (복잡한 함수)

```typescript
/**
 * 사용자 정보를 조회합니다.
 * @param sessionId - 사용자 세션 ID
 * @returns 사용자 정보 또는 null
 */
export async function getUser(sessionId: string): Promise<User | null> {
    // ...
}
```

### React 컴포넌트

#### 컴포넌트 구조
- 함수형 컴포넌트 사용
- Props 인터페이스 정의
- 파일명은 `PascalCase.tsx`

```typescript
interface RoomCardProps {
    roomNumber: string;
    onSelect: (roomNumber: string) => void;
}

export default function RoomCard({ roomNumber, onSelect }: RoomCardProps) {
    // ...
}
```

#### Hooks 사용
- 커스텀 훅은 `use` 접두사 사용
- 훅은 파일 상단에 배치
- 의존성 배열 정확히 명시

```typescript
export function useRooms() {
    const [rooms, setRooms] = useState<RoomGuestsMap>({});
    
    useEffect(() => {
        // ...
    }, []); // 의존성 배열 명시
    
    return { rooms };
}
```

### 파일 구조

#### 디렉토리 구조
```
src/
├── components/     # React 컴포넌트
├── firebase/       # Firebase 모듈
├── hooks/          # 커스텀 훅
├── utils/          # 유틸리티 함수
├── types/          # TypeScript 타입 정의
├── contexts/       # React Context
└── pages/          # 페이지 컴포넌트
```

#### 파일 명명
- 컴포넌트: `PascalCase.tsx` (예: `RoomCard.tsx`)
- 유틸리티: `camelCase.ts` (예: `errorHandler.ts`)
- 타입: `index.ts` (중앙 집중)

### 스타일링

#### Tailwind CSS
- 인라인 클래스 사용
- 반복되는 스타일은 컴포넌트로 추출
- 다크 모드: `dark:` 접두사 사용

```tsx
<div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
    {/* ... */}
</div>
```

### 에러 처리

#### 에러 핸들러 사용
- `handleError` 함수 사용
- 에러 컨텍스트 제공
- 사용자 친화적 메시지 반환

```typescript
try {
    await someAsyncOperation();
} catch (error) {
    const message = handleError(error, {
        action: '객실 선택',
        component: 'RoomCard',
        level: ERROR_LEVEL.ERROR
    });
    // 사용자에게 메시지 표시
}
```

### 보안

#### 입력값 검증
- 모든 사용자 입력은 `sanitize` 함수로 검증
- Firebase 경로는 `isSafeFirebasePath`로 검증
- XSS 방지를 위한 HTML 이스케이프

```typescript
const sanitized = sanitizeUserData(userInput);
const safePath = isSafeFirebasePath(path);
```

---

## Git 워크플로우

### 커밋 메시지 규칙

#### 형식
```
<type>: <subject>

<body>

<footer>
```

#### Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 설정, 의존성 업데이트

#### 예시
```
feat: 객실 선택 시 매칭 경고 모달 추가

- 나이 차이 경고 추가
- 코골이 호환성 경고 추가
- MatchingWarningModal 컴포넌트 생성

Closes #123
```

### 커밋 규칙
- 작은 단위로 자주 커밋
- 하나의 커밋은 하나의 변경사항만
- 테스트 통과 후 커밋
- 의미 있는 커밋 메시지 작성

---

## 브랜치 전략

### 브랜치 구조
```
main (production)
  └── develop (development)
      ├── feature/phase2-2-documentation
      ├── feature/room-selection-improvement
      ├── bugfix/firebase-connection-error
      └── hotfix/critical-security-fix
```

### 브랜치 명명 규칙

#### Feature 브랜치
```
feature/<phase>-<description>
예: feature/phase2-2-documentation
```

#### Bugfix 브랜치
```
bugfix/<issue-description>
예: bugfix/firebase-connection-error
```

#### Hotfix 브랜치
```
hotfix/<critical-issue>
예: hotfix/critical-security-fix
```

### 브랜치 워크플로우

1. **Feature 개발**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/phase2-2-documentation
   # 개발 작업
   git push origin feature/phase2-2-documentation
   # PR 생성
   ```

2. **Bugfix**
   ```bash
   git checkout develop
   git checkout -b bugfix/firebase-connection-error
   # 수정 작업
   git push origin bugfix/firebase-connection-error
   # PR 생성
   ```

3. **Hotfix**
   ```bash
   git checkout main
   git checkout -b hotfix/critical-security-fix
   # 수정 작업
   git push origin hotfix/critical-security-fix
   # PR 생성 (main으로 직접)
   ```

---

## PR 가이드라인

### PR 작성 체크리스트

- [ ] 브랜치가 최신 `develop`과 동기화됨
- [ ] 모든 테스트 통과
- [ ] 빌드 성공
- [ ] 타입 오류 없음
- [ ] ESLint 오류 없음
- [ ] 문서 업데이트 (필요한 경우)
- [ ] 커밋 메시지 규칙 준수

### PR 템플릿

```markdown
## 변경 사항
- [ ] 기능 추가
- [ ] 버그 수정
- [ ] 문서 수정
- [ ] 리팩토링
- [ ] 테스트 추가

## 설명
변경 사항에 대한 자세한 설명을 작성해주세요.

## 테스트
- [ ] 로컬 테스트 완료
- [ ] 테스트 케이스 추가/수정

## 체크리스트
- [ ] 코드 리뷰 요청
- [ ] 문서 업데이트
- [ ] Breaking Changes 문서화
```

### PR 리뷰 프로세스

1. **자동 검사**
   - CI/CD 파이프라인 실행
   - 테스트 자동 실행
   - 빌드 확인

2. **코드 리뷰**
   - 최소 1명의 승인 필요
   - 리뷰어 피드백 반영
   - 승인 후 머지

3. **머지 전략**
   - `develop` 브랜치: Squash and Merge
   - `main` 브랜치: Merge Commit

---

## 코드 리뷰 가이드

### 리뷰 포인트

#### 기능성
- 요구사항 충족 여부
- 엣지 케이스 처리
- 에러 처리

#### 코드 품질
- 가독성
- 재사용성
- 성능

#### 보안
- 입력값 검증
- XSS 방지
- 권한 확인

#### 테스트
- 테스트 커버리지
- 테스트 케이스 적절성

### 리뷰 코멘트 작성

#### 긍정적 피드백
```markdown
✅ 좋은 접근 방식입니다!
```

#### 개선 제안
```markdown
💡 이 부분은 `sanitizeUserData` 함수를 사용하는 것이 더 안전할 것 같습니다.
```

#### 질문
```markdown
❓ 이 에러 케이스는 어떻게 처리되나요?
```

#### 필수 수정
```markdown
⚠️ 보안 이슈: 입력값 검증이 필요합니다.
```

---

## 테스트 가이드

### 테스트 작성 규칙

#### 파일 위치
- 테스트 파일은 `__tests__` 디렉토리 또는 `.test.ts` 확장자
- 예: `src/utils/__tests__/errorHandler.test.ts`

#### 테스트 구조
```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from '../functionToTest';

describe('functionToTest', () => {
    it('should handle normal case', () => {
        const result = functionToTest(input);
        expect(result).toBe(expected);
    });
    
    it('should handle edge case', () => {
        // ...
    });
});
```

#### 테스트 커버리지
- 최소 60% 커버리지 목표
- 핵심 비즈니스 로직은 80% 이상
- 유틸리티 함수는 90% 이상

### 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 특정 파일만 테스트
npm test errorHandler

# 커버리지 확인
npm run test:coverage

# UI 모드
npm run test:ui
```

---

## 디버깅 가이드

### 로깅

#### debug 유틸리티 사용
```typescript
import debug from '../utils/debug';

debug.log('일반 로그');
debug.info('정보 로그');
debug.warn('경고 로그');
debug.error('에러 로그');
```

#### 에러 핸들링
```typescript
import { handleError, ERROR_LEVEL } from '../utils/errorHandler';

try {
    // ...
} catch (error) {
    const message = handleError(error, {
        action: '작업 설명',
        component: '컴포넌트명',
        level: ERROR_LEVEL.ERROR
    });
}
```

### 브라우저 개발자 도구

- React DevTools 사용
- Network 탭에서 Firebase 요청 확인
- Console 탭에서 로그 확인
- Application 탭에서 localStorage 확인

---

## 환경 변수 관리

### 로컬 개발
- `.env` 파일 사용 (gitignore에 포함)
- `.env.example` 파일에 템플릿 제공

### 배포 환경
- Vercel 환경 변수 설정
- Production, Preview, Development 환경별 설정

---

## 의존성 관리

### 패키지 추가
- 새로운 패키지 추가 전 팀 논의
- `package.json` 업데이트
- `package-lock.json` 커밋

### 업데이트
- 보안 패치 우선 적용
- Major 버전 업데이트는 신중하게
- 업데이트 후 테스트 필수

---

## 문서화

### 코드 문서화
- 복잡한 함수는 JSDoc 주석 추가
- 컴포넌트 Props 인터페이스 문서화
- 타입 정의 주석 추가

### 프로젝트 문서화
- README.md 최신 상태 유지
- 아키텍처 문서 업데이트
- 변경 사항은 CHANGELOG에 기록

---

**참고**: 이 가이드라인은 프로젝트 진행에 따라 업데이트됩니다. 제안사항이 있으면 팀에 공유해주세요.

