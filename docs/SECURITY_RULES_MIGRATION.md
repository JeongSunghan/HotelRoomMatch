# Firebase Security Rules 마이그레이션 가이드

## 변경 사항 요약

### 주요 개선 사항
1. **Admin 권한 노드 추가**: `admins/{auth.uid}` 노드를 통한 Admin 권한 확인
2. **Admin 전용 쓰기 권한**: `allowedUsers`, `history`, `settings`는 Admin만 쓰기 가능
3. **기본 접근 제어**: 모든 데이터는 인증된 사용자(`auth != null`)만 접근 가능

## Admin 권한 설정

### Admin 사용자 추가 방법

Firebase Console 또는 Admin SDK를 통해 `admins` 노드에 Admin 사용자의 `auth.uid`를 추가해야 합니다.

**Firebase Console에서:**
1. Firebase Console → Realtime Database → Data 탭
2. `admins` 노드 생성
3. Admin 사용자의 `auth.uid`를 키로 하여 `true` 값 추가

예시:
```json
{
  "admins": {
    "admin_uid_12345": true,
    "admin_uid_67890": true
  }
}
```

**Admin 사용자의 auth.uid 확인 방법:**
- Firebase Console → Authentication → Users 탭에서 확인
- 또는 애플리케이션에서 Admin 로그인 후 콘솔에서 `auth.currentUser.uid` 확인

## 변경된 권한 규칙

### 1. allowedUsers
- **읽기**: 인증된 사용자 모두
- **쓰기**: Admin만 (새로운 규칙)
- **의미**: 사전등록 사용자 관리는 Admin만 가능

### 2. history
- **읽기**: Admin만 (새로운 규칙)
- **쓰기**: Admin만 (새로운 규칙)
- **의미**: 변경 이력은 Admin만 조회/작성 가능

### 3. settings
- **읽기**: 모든 사용자 (공개)
- **쓰기**: Admin만 (기존과 동일)
- **의미**: 설정 변경은 Admin만 가능

### 4. inquiries
- **읽기**: Admin만 (새로운 규칙)
- **쓰기**: 인증된 사용자 모두 (일반 사용자도 문의 작성 가능)
- **의미**: 문의 조회는 Admin만, 작성은 모든 사용자 가능

## 주의사항

### 기존 동작과의 차이점

1. **history 읽기 권한 제한**
   - 이전: 모든 인증된 사용자가 읽기 가능
   - 현재: Admin만 읽기 가능
   - 영향: 일반 사용자는 변경 이력을 조회할 수 없음 (의도된 동작)

2. **inquiries 읽기 권한 제한**
   - 이전: 모든 인증된 사용자가 읽기 가능
   - 현재: Admin만 읽기 가능
   - 영향: 일반 사용자는 다른 사용자의 문의를 조회할 수 없음 (의도된 동작)

### 마이그레이션 체크리스트

- [ ] Firebase Console에서 Admin 사용자의 `auth.uid` 확인
- [ ] `admins` 노드에 Admin 사용자 추가
- [ ] Rules 배포 전 테스트 환경에서 검증
- [ ] Rules 배포
- [ ] 프로덕션 환경에서 기능 테스트

## 롤백 계획

문제 발생 시 이전 Rules로 롤백:

```json
{
    "rules": {
        "rooms": {
            ".read": true,
            ".write": "auth != null"
        },
        "users": {
            ".read": "auth != null",
            ".write": "auth != null",
            "$sessionId": {
                ".indexOn": ["email"]
            }
        },
        "allowedUsers": {
            ".read": "auth != null",
            ".write": "auth != null"
        },
        // ... 나머지 규칙들
    }
}
```

## 향후 개선 방향

현재 Rules는 기본적인 접근 제어만 제공합니다. 복잡한 비즈니스 로직 검증(예: 자신의 데이터만 수정)은 코드 레벨에서 처리하고 있습니다.

향후 개선 가능한 사항:
- 사용자별 세부 권한 제어 (sessionId 기반)
- Rooms의 guests 배열에 대한 더 세밀한 제어
- Cloud Functions를 통한 서버 사이드 검증 강화

