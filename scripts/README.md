# Firestore 마이그레이션 스크립트

Firebase Realtime Database에서 Cloud Firestore로 데이터를 마이그레이션하는 스크립트입니다.

## 사전 준비

### 1. Firebase Admin SDK 설정

Firebase 콘솔에서 서비스 계정 키를 다운로드합니다:

1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. `serviceAccount.json` 파일을 `scripts/` 디렉토리에 저장

⚠️ **보안 주의**: `serviceAccount.json`은 `.gitignore`에 추가되어 있어야 합니다!

### 2. 의존성 설치

```bash
npm install firebase-admin
npm install -D @types/node ts-node
```

### 3. 백업 생성

마이그레이션 전 반드시 백업을 생성하세요:

```bash
# Realtime Database 백업
firebase database:get / --output backup-rtdb-$(date +%Y%m%d).json

# Firestore 백업 (선택사항)
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)
```

## 사용법

### Dry Run (테스트 실행)

실제 데이터를 변경하지 않고 마이그레이션을 시뮬레이션합니다:

```bash
ts-node scripts/migrateToFirestore.ts
```

### 실제 마이그레이션 실행

```bash
ts-node scripts/migrateToFirestore.ts --execute
```

### 검증만 수행

```bash
ts-node scripts/migrateToFirestore.ts --validate-only
```

### 특정 Phase 스킵

```bash
# Phase 1 스킵 (users 마이그레이션 완료된 경우)
ts-node scripts/migrateToFirestore.ts --execute --skip-phase1

# Phase 2 스킵 (userStays 생성 완료된 경우)
ts-node scripts/migrateToFirestore.ts --execute --skip-phase2
```

## 마이그레이션 프로세스

### Phase 1: allowedUsers → users

Realtime Database의 `allowedUsers`를 Firestore `users` 컬렉션으로 마이그레이션합니다.

**주의사항**:
- `allowedUsers`는 단순 화이트리스트이므로, Firestore users에 필요한 추가 정보(org, position, phone, gender, singleAllowed)는 CSV/JSON 파일에서 가져와야 합니다.
- 스크립트는 기본값을 사용하므로, **마이그레이션 전에 CSV 데이터로 사용자를 등록**하는 것을 권장합니다.

### Phase 2: userStays 생성

모든 사용자에 대해 초기 `userStays` 문서를 생성합니다:
- `status`: UNASSIGNED
- `birthDate`: '' (로그인 시 입력)
- `roomId`: null
- `roomType`: null

### Phase 3: 검증

- users와 userStays 수 일치 확인
- Orphaned userStays 확인 (userId가 users에 없는 경우)
- 데이터 무결성 검증

## 재시작 가능성

마이그레이션 중 중단된 경우, 진행 상황이 Firestore `_migration/progress`에 저장되므로 재시작 시 이어서 진행할 수 있습니다.

## 권장 순서

1. **백업 생성**
2. **테스트 환경에서 Dry Run 실행**
3. **테스트 환경에서 실제 마이그레이션 실행**
4. **검증 수행**
5. **운영 환경에 적용**

## 문제 해결

### "allowedUsers 데이터가 없습니다"

Realtime Database에 `allowedUsers` 노드가 없는 경우입니다. CSV/JSON 파일을 사용하여 직접 Firestore에 사용자를 등록하세요.

### "Orphaned userStays 발견"

userId가 users 컬렉션에 없는 userStay가 있습니다. 수동으로 확인하고 삭제하세요:

```typescript
await firestore.collection('userStays').doc(orphanedStayId).delete();
```

### 마이그레이션 중 오류 발생

진행 상황이 저장되므로, 오류를 수정한 후 다시 실행하면 이어서 진행됩니다.

## 마이그레이션 후 작업

1. Firestore Security Rules 배포 확인
2. Firestore Indexes 배포 확인
3. 애플리케이션 코드를 Firestore 모드로 전환
4. 기존 Realtime Database 데이터 백업 후 삭제 (선택사항)

## 주의사항

⚠️ **마이그레이션은 되돌릴 수 없으므로, 반드시 백업을 생성하고 테스트 환경에서 먼저 실행하세요!**

