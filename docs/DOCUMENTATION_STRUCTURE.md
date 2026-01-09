# 문서 구조 가이드

**최종 업데이트**: 2025-01-02  
**목적**: 프로젝트 문서 구조 및 정리 상태

---

## 📁 문서 디렉토리 구조

```
V_Up_HotelRoomMatch/
├── README.md                           # 프로젝트 개요, 설치/실행 방법
├── docs/                               # 📚 모든 문서 디렉토리
│   ├── README.md                       # 문서 디렉토리 가이드 (이 파일 대체)
│   ├── ARCHITECTURE.md                 # 시스템 아키텍처
│   ├── DEVELOPMENT_GUIDE.md            # 개발 가이드라인
│   ├── LOGGING_GUIDE.md                # 로깅 시스템 가이드
│   ├── TEST_SETUP.md                   # 테스트 환경 설정
│   ├── UIUX_DESIGN.md                  # UI/UX 디자인 가이드
│   ├── firestore/                      # 🔥 Firestore 마이그레이션 관련
│   │   ├── MIGRATION_PLAN.md           # Firestore 마이그레이션 계획
│   │   └── INDEX_GUIDE.md              # Firestore 인덱스 배포 가이드
│   └── progress/                       # 📊 진행 상황 추적
│       ├── PHASE_STATUS.md             # Phase별 진행 상태 (최신)
│       ├── PHASE_PLAN.md               # Phase별 개선 계획
│       └── TASKS.md                    # 작업 목록
├── firebase.json                       # Firebase 설정 파일
├── firestore.rules                     # Firestore Security Rules
├── firestore.indexes.json              # Firestore 인덱스 설정
└── .firebaserc                         # Firebase 프로젝트 연결 설정
```

---

## 📚 문서 분류

### 🏗️ 아키텍처 및 설계 (docs/)
- **ARCHITECTURE.md**: 시스템 아키텍처, 데이터 구조, 컴포넌트 계층
- **DEVELOPMENT_GUIDE.md**: 코딩 컨벤션, Git 워크플로우, PR 가이드라인
- **UIUX_DESIGN.md**: UI/UX 디자인 가이드 및 개선 계획

### 🔥 Firestore 마이그레이션 (docs/firestore/)
- **MIGRATION_PLAN.md**: Firebase Realtime Database → Firestore 마이그레이션 계획 (8단계)
- **INDEX_GUIDE.md**: Firestore 인덱스 배포 가이드 (단일/복합 인덱스 구분)

### 📊 진행 상황 (docs/progress/)
- **PHASE_STATUS.md**: ✅ **최신 진행 상태** (Phase별 완료 내역, 현재 상태)
- **PHASE_PLAN.md**: Phase별 개선 계획 및 로드맵
- **TASKS.md**: 상세 작업 목록

### 🛠️ 개발 가이드 (docs/)
- **LOGGING_GUIDE.md**: 로깅 시스템 사용 가이드
- **TEST_SETUP.md**: 테스트 환경 설정 및 실행 방법

### 📝 프로젝트 루트
- **README.md**: 프로젝트 개요, 설치 및 실행 방법, 환경 변수 설정
- **firebase.json**: Firebase 프로젝트 설정
- **firestore.rules**: Firestore Security Rules
- **firestore.indexes.json**: Firestore 인덱스 설정

---

## 🎯 주요 문서 빠른 링크

### 현재 작업 중
- 🔥 **Firestore 마이그레이션**: [docs/firestore/MIGRATION_PLAN.md](./firestore/MIGRATION_PLAN.md)
- 📊 **진행 상태**: [docs/progress/PHASE_STATUS.md](./progress/PHASE_STATUS.md)

### 개발 참고
- 🏗️ **아키텍처**: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- 📖 **개발 가이드**: [docs/DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- 🔍 **로깅 가이드**: [docs/LOGGING_GUIDE.md](./LOGGING_GUIDE.md)

### 배포 및 설정
- 🔥 **Firestore 인덱스**: [docs/firestore/INDEX_GUIDE.md](./firestore/INDEX_GUIDE.md)
- ⚙️ **Firestore Rules**: `firestore.rules` (루트)

---

## 📋 문서 정리 상태

### ✅ 정리 완료
- Firestore 관련 문서 → `docs/firestore/`로 이동
- 진행 상황 문서 → `docs/progress/`로 이동
- md/ 디렉토리 파일들 → `docs/` 또는 `docs/progress/`로 이동
- 문서 디렉토리 README 작성

### 🟡 정리 필요 (참고용으로 유지)
- `docs/REMAINING_TASKS.md`: 구버전, PHASE_STATUS.md 참고하도록 업데이트
- `docs/PHASE2_PLAN.md`: 구버전, PHASE_STATUS.md 참고하도록 업데이트
- `docs/SECURITY_RULES_MIGRATION.md`: Firestore 마이그레이션 시 통합 검토

---

## 🔍 문서 찾기 가이드

### "Firestore 인덱스 설정 방법이 궁금해요"
→ [docs/firestore/INDEX_GUIDE.md](./firestore/INDEX_GUIDE.md)

### "현재 프로젝트 진행 상황이 궁금해요"
→ [docs/progress/PHASE_STATUS.md](./progress/PHASE_STATUS.md)

### "Firestore 마이그레이션 계획을 보고 싶어요"
→ [docs/firestore/MIGRATION_PLAN.md](./firestore/MIGRATION_PLAN.md)

### "코딩 컨벤션이나 개발 가이드라인이 궁금해요"
→ [docs/DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

### "시스템 아키텍처를 이해하고 싶어요"
→ [docs/ARCHITECTURE.md](./ARCHITECTURE.md)

---

**마지막 업데이트**: 2025-01-02

