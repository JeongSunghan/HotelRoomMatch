# Firestore API 가이드

Cloud Firestore 기반 방 배정 시스템의 API 사용 가이드입니다.

## 목차

1. [사용자 관리 (Users)](#사용자-관리)
2. [숙박 정보 (UserStays)](#숙박-정보)
3. [방 배정 (Room Assignment)](#방-배정)
4. [CSV/JSON 업로드](#csvjson-업로드)

---

## 사용자 관리

### `createFirestoreUser`

사용자를 생성합니다 (관리자 전용).

```typescript
import { createFirestoreUser } from '@/firebase';

const userId = await createFirestoreUser({
    org: 'KVCA',
    name: '홍길동',
    position: '대표',
    email: 'hong@example.com',
    phone: '010-1234-5678',
    gender: 'M',
    singleAllowed: true
});
```

### `getFirestoreUserByEmail`

이메일로 사용자를 조회합니다.

```typescript
const user = await getFirestoreUserByEmail('hong@example.com');
if (user) {
    console.log(user.name); // '홍길동'
}
```

### `verifyFirestoreUserByEmail`

로그인 시 이메일을 검증합니다.

```typescript
const result = await verifyFirestoreUserByEmail('hong@example.com');
if (result.valid) {
    console.log('로그인 가능:', result.user);
} else {
    console.error(result.message);
}
```

### `bulkCreateFirestoreUsers`

여러 사용자를 일괄 등록합니다 (최대 500개/배치).

```typescript
const users = [
    { org: 'KVCA', name: '홍길동', ... },
    { org: 'KVCA', name: '김철수', ... },
];

const result = await bulkCreateFirestoreUsers(users, {
    skipDuplicates: true,
    onProgress: (current, total) => {
        console.log(`진행: ${current}/${total}`);
    }
});

console.log(`성공: ${result.success}, 실패: ${result.failed}`);
```

---

## 숙박 정보

### `getOrCreateFirestoreUserStay`

로그인 시 userStay를 조회하거나 생성합니다.

```typescript
const { stay, isNew, stayId } = await getOrCreateFirestoreUserStay(
    'hong@example.com'
);

if (isNew) {
    console.log('새로운 userStay 생성됨');
} else {
    console.log('기존 userStay:', stay);
}
```

### `updateFirestoreUserStayBirthDate`

생년월일을 업데이트합니다.

```typescript
await updateFirestoreUserStayBirthDate(
    'hong@example.com',
    '1990-01-01',
    34 // 나이
);
```

### `getFirestoreUserStayByUserId`

userId로 userStay를 조회합니다.

```typescript
const stay = await getFirestoreUserStayByUserId('hong@example.com');
if (stay) {
    console.log(`배정 상태: ${stay.status}`);
    console.log(`방 번호: ${stay.roomId || '미배정'}`);
}
```

---

## 방 배정

### `canAssignFirestoreRoom`

방 배정 가능 여부를 확인합니다.

```typescript
const result = await canAssignFirestoreRoom(
    'hong@example.com',
    '201',
    'SHARED',
    2 // 방 정원
);

if (result.canAssign) {
    console.log('배정 가능');
} else {
    console.error(result.message);
}
```

### `assignFirestoreRoom`

방을 배정합니다.

```typescript
const result = await assignFirestoreRoom(
    'hong@example.com',
    '201',
    'SHARED',
    false // snoring
);

if (result.success) {
    console.log('배정 완료:', result.stay);
} else {
    console.error(result.message);
}
```

### `unassignFirestoreRoom`

방 배정을 취소합니다.

```typescript
const result = await unassignFirestoreRoom('hong@example.com');
if (result.success) {
    console.log('배정 취소 완료');
}
```

### `changeFirestoreRoom`

방을 변경합니다.

```typescript
const result = await changeFirestoreRoom(
    'hong@example.com',
    '202',
    'SHARED',
    true // snoring
);

if (result.success) {
    console.log('방 변경 완료');
}
```

### `getFirestoreRoomAssignmentStats`

방 배정 통계를 조회합니다.

```typescript
const stats = await getFirestoreRoomAssignmentStats('201');
console.log(`배정 인원: ${stats.total}`);
console.log('사용자:', stats.users);
```

---

## CSV/JSON 업로드

### CSV 파싱

```typescript
import { parseCSVForFirestore } from '@/utils/csvParser';

const csvText = `소속\t이름\t직위\t이메일\t연락처\t1인실여부\t성별
KVCA\t홍길동\t대표\thong@example.com\t010-1234-5678\tY\tM`;

const result = parseCSVForFirestore(csvText);
console.log(`유효: ${result.valid.length}, 에러: ${result.errors.length}`);
```

### JSON 파싱

```typescript
import { parseJSONForFirestore } from '@/utils/csvParser';

const jsonText = JSON.stringify([
    {
        org: 'KVCA',
        name: '홍길동',
        position: '대표',
        email: 'hong@example.com',
        phone: '010-1234-5678',
        singleAllowed: true,
        gender: 'M'
    }
]);

const result = parseJSONForFirestore(jsonText);
```

### CSV 템플릿 생성

```typescript
import { generateCSVTemplateForFirestore } from '@/utils/csvParser';

const template = generateCSVTemplateForFirestore();
// 다운로드 또는 표시
```

---

## 에러 처리

모든 함수는 try-catch로 에러를 처리합니다:

```typescript
try {
    await assignFirestoreRoom(...);
} catch (error) {
    console.error('방 배정 실패:', error);
    // 사용자에게 에러 메시지 표시
}
```

---

## 타입 정의

모든 타입은 `src/types/firestore.ts`에 정의되어 있습니다:

- `FirestoreUser`: 사용자 정보
- `FirestoreUserStay`: 숙박 정보
- `FirestoreUserCreateData`: 사용자 생성 데이터
- `FirestoreUserStayCreateData`: 숙박 정보 생성 데이터

---

## 실시간 구독

### 사용자 구독

```typescript
import { subscribeToFirestoreUser } from '@/firebase';

const unsubscribe = subscribeToFirestoreUser(
    'hong@example.com',
    (user) => {
        if (user) {
            console.log('사용자 업데이트:', user);
        }
    }
);

// 구독 해제
unsubscribe();
```

### userStay 구독

```typescript
import { subscribeToFirestoreUserStay } from '@/firebase';

const unsubscribe = subscribeToFirestoreUserStay(
    'hong@example.com',
    (stay) => {
        if (stay) {
            console.log('배정 상태:', stay.status);
        }
    }
);
```

---

## 보안 규칙

Firestore Security Rules는 `firestore.rules`에 정의되어 있습니다:

- **users**: 관리자만 생성/수정/삭제, 인증된 사용자는 읽기
- **userStays**: 소유자 또는 관리자만 읽기/수정, 관리자만 삭제

---

## 인덱스

Firestore Indexes는 `firestore.indexes.json`에 정의되어 있습니다:

- `users.email` (단일 필드)
- `userStays.userId` (단일 필드)
- `userStays.status` (단일 필드)
- `userStays.userId + status` (복합 인덱스)

배포: `firebase deploy --only firestore:indexes`

---

## 참고

- [Firestore 마이그레이션 계획](./MIGRATION_PLAN.md)
- [인덱스 가이드](./INDEX_GUIDE.md)
- [Security Rules](../../firestore.rules)

