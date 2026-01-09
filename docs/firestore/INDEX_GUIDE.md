# Firestore 인덱스 배포 가이드

**작성일**: 2025-01-02  
**목적**: Firestore 인덱스 설정 및 배포 방법 상세 가이드

---

## 📚 인덱스 배포 방법

### 사전 준비: Firebase 프로젝트 연결

#### 1. Firebase 프로젝트 ID 확인
- Firebase Console > 프로젝트 설정 > 일반 탭
- "프로젝트 ID" 확인

#### 2. 프로젝트 연결
```bash
# 프로젝트 ID로 연결 (your-project-id를 실제 프로젝트 ID로 변경)
firebase use your-project-id
```

또는 `.firebaserc` 파일을 직접 수정:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### 방법 1: Firebase CLI 사용 (권장)

#### 1. Firebase CLI 설치 (아직 설치하지 않은 경우)
```bash
npm install -g firebase-tools
```

#### 2. Firebase 로그인
```bash
firebase login
```

#### 3. 프로젝트 초기화 (아직 하지 않은 경우)
```bash
firebase init firestore
```
- 프로젝트 선택
- `firestore.rules` 파일이 있으면 덮어쓰지 않음 선택
- `firestore.indexes.json` 파일이 있으면 덮어쓰지 않음 선택

#### 4. 인덱스 배포
```bash
firebase deploy --only firestore:indexes
```

배포 완료 시:
```
✔  Deployed firestore indexes successfully
```

---

### 방법 2: Firebase 콘솔 (웹 UI)

#### 1. Firebase 콘솔 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Firestore Database** 클릭
4. 상단 탭에서 **인덱스** 클릭

#### 2. 인덱스 추가

**⚠️ 참고**: 단일 필드 equality 쿼리는 자동 인덱스가 생성되므로 수동으로 추가할 필요가 없습니다.

1. "인덱스 만들기" 버튼 클릭
2. 컬렉션 ID: `userStays`
3. 인덱스 필드 추가:
   - 필드 1: `userId` (오름차순)
   - 필드 2: `status` (오름차순)
4. "만들기" 버튼 클릭

#### 3. 인덱스 생성 상태 확인
- 인덱스는 생성 즉시 사용 가능하지 않을 수 있습니다
- 상태가 "빌드 중" → "사용 가능"으로 변경될 때까지 대기
- 보통 수초~수분 소요

---

## 📊 인덱스 상세 설명

### 단일 필드 인덱스 vs 복합 인덱스

#### 단일 필드 인덱스
- **정의**: 하나의 필드에 대한 인덱스
- **용도**: 단일 필드로 검색할 때 사용
- **예시**: `where('email', '==', 'user@example.com')`

#### 복합 인덱스
- **정의**: 두 개 이상의 필드에 대한 인덱스
- **용도**: 여러 필드를 조합하여 검색할 때 사용
- **예시**: `where('userId', '==', '123').where('status', '==', 'ASSIGNED')`

---

## 📋 현재 설정된 인덱스 목록

### 1. users 컬렉션

#### 인덱스 1: email (단일 필드)
```json
{
  "collectionGroup": "users",
  "fields": [{"fieldPath": "email", "order": "ASCENDING"}]
}
```
- **타입**: 단일 필드 인덱스
- **용도**: 이메일로 사용자 검색
- **쿼리 예시**:
  ```typescript
  const q = query(collection(firestore, 'users'), 
    where('email', '==', 'user@example.com'));
  ```
- **필수 여부**: ✅ 필수

---

### 2. userStays 컬렉션

#### 인덱스 2: userId (단일 필드)
```json
{
  "collectionGroup": "userStays",
  "fields": [{"fieldPath": "userId", "order": "ASCENDING"}]
}
```
- **타입**: 단일 필드 인덱스
- **용도**: 특정 사용자의 stay 조회
- **쿼리 예시**:
  ```typescript
  const q = query(collection(firestore, 'userStays'), 
    where('userId', '==', 'user123'));
  ```
- **필수 여부**: ✅ 필수

---

#### 인덱스 3: status (단일 필드)
```json
{
  "collectionGroup": "userStays",
  "fields": [{"fieldPath": "status", "order": "ASCENDING"}]
}
```
- **타입**: 단일 필드 인덱스
- **용도**: 상태별 stay 조회 (UNASSIGNED, ASSIGNED)
- **쿼리 예시**:
  ```typescript
  const q = query(collection(firestore, 'userStays'), 
    where('status', '==', 'UNASSIGNED'));
  ```
- **필수 여부**: ✅ 필수

---

```json
{
  "collectionGroup": "userStays",
  "fields": [
    {"fieldPath": "userId", "order": "ASCENDING"},
    {"fieldPath": "status", "order": "ASCENDING"}
  ]
}
```
- **타입**: 복합 인덱스 (2개 필드) ✅ **수동 생성 필요**
- **용도**: 특정 사용자의 특정 상태 stay 조회
- **쿼리 예시**:
  ```typescript
  const q = query(collection(firestore, 'userStays'), 
    where('userId', '==', 'user123'),
    where('status', '==', 'ASSIGNED'));
  ```
- **필수 여부**: ✅ 필수
- **참고**: 복합 쿼리는 수동 인덱스 생성 필요 (단일 필드 인덱스 2개만으로는 불가능)

---

## 📌 인덱스 생성 규칙 요약

| 쿼리 유형 | 인덱스 필요 여부 | 예시 |
|----------|----------------|------|
| 단일 필드 equality (`==`) | ❌ 자동 생성 | `where('email', '==', 'user@example.com')` |
| 단일 필드 range (`<`, `>`, `<=`, `>=`) | ✅ 수동 생성 필요 | `where('age', '>', 20)` |
| 복합 쿼리 (2개 이상 필드) | ✅ 수동 생성 필요 | `where('userId', '==', '123').where('status', '==', 'ASSIGNED')` |
| 정렬 (`orderBy`) | ✅ 수동 생성 필요 | `orderBy('createdAt')` |

---

## ⚠️ 주의사항

### 1. 인덱스가 없으면?
- 쿼리 실행 시 에러 발생: `The query requires an index`
- Firebase 콘솔에서 인덱스 생성 링크가 자동으로 제공됨
- 하지만 미리 인덱스를 생성해두는 것이 좋음

### 2. 인덱스 생성 시간
- 단일 필드 인덱스: 보통 수초
- 복합 인덱스: 보통 수십 초~수분
- 데이터가 많을수록 생성 시간 증가

### 3. 인덱스 비용
- 인덱스 생성 자체는 무료
- 하지만 인덱스는 저장 공간을 사용 (미세한 수준)
- 쿼리 성능 향상으로 읽기 비용 절감

### 4. 인덱스 순서
- 복합 인덱스에서 필드 순서가 중요함
- `userId + status` 인덱스는 `where('userId', '==', x).where('status', '==', y)` 쿼리에 사용 가능
- 하지만 `where('status', '==', y).where('userId', '==', x)` 순서로는 사용 불가 (순서 불일치)
- **권장**: 가장 자주 사용하는 필드를 먼저 배치

---

## 🔍 인덱스 확인 방법

### Firebase 콘솔에서 확인
1. Firebase Console > Firestore Database > 인덱스 탭
2. 모든 인덱스 목록 확인
3. 상태 확인: "사용 가능" / "빌드 중" / "오류"

### 코드에서 확인
```typescript
import { getDocs, collection, query, where } from 'firebase/firestore';

// 쿼리 실행 시 인덱스가 없으면 자동으로 에러와 함께 인덱스 생성 링크 제공
try {
  const q = query(collection(firestore, 'userStays'), 
    where('userId', '==', 'user123'),
    where('status', '==', 'ASSIGNED'));
  const snapshot = await getDocs(q);
} catch (error) {
  // 인덱스가 없으면 여기서 에러 발생
  // 에러 메시지에 인덱스 생성 링크 포함
}
```

---

## ✅ 체크리스트

인덱스 배포 후 확인:

- [ ] Firebase CLI 또는 콘솔에서 인덱스 배포 완료
- [ ] 모든 인덱스 상태가 "사용 가능"으로 표시됨
- [ ] 테스트 쿼리 실행하여 에러 없이 동작 확인
- [ ] 복합 인덱스 (userId + status) 생성 확인

---

## 📝 참고 자료

- [Firestore 인덱스 문서](https://firebase.google.com/docs/firestore/query-data/indexing)
- [복합 인덱스 가이드](https://firebase.google.com/docs/firestore/query-data/index-overview#composite_indexes)
- [Firebase CLI 문서](https://firebase.google.com/docs/cli)

