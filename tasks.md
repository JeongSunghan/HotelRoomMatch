# 호텔 객실 배정 시스템 - V-Up 58기

## 프로젝트 개요
- 참가자들이 링크 접속하여 직접 원하는 객실 선택
- 영화 좌석 예매 방식의 UI
- Firebase Realtime Database로 실시간 동기화

## 핵심 요구사항
1. **성별 제한**: 절대 혼성 불가
2. **2인실 처리**: 
   - 각자 따로 선택
   - 남성이 선택 시 → 연한 파랑
   - 여성이 선택 시 → 연한 분홍
3. **수정 권한**: admin만 변경 가능, 일반 사용자는 선택 후 관리자에게 변경 요청 가능 
4. **DB**: Firebase Realtime Database

## 작업 목록

### Phase 1: 기본 구조 설정
- [x] 프로젝트 구조 생성
- [x] CSV 데이터 파싱 및 정리
- [x] Firebase 설정 파일 준비

### Phase 2: UI 구현
- [x] 메인 레이아웃 (층별 객실 배치도)
- [x] 객실 컴포넌트 (상태별 색상)
- [x] 본인 선택 모달/플로우
- [x] Admin 패널

### Phase 3: 로직 구현
- [x] 성별 기반 객실 필터링
- [x] 2인실 매칭 로직
- [x] 선택 잠금 로직
- [x] Firebase 연동

### Phase 4: 마무리
- [x] 반응형 디자인
- [x] 에러 처리
- [진행 중] 테스트

### Bugfix (2026-01-26)
- [x] Realtime DB rules: 삭제/부분 업데이트가 `.validate`에 의해 막히지 않도록 개선
- [x] 유저 관리: 유저 삭제(permission-denied) 해결 (경로 불일치 + rooms 전체 덮어쓰기 제거)
- [x] 방 배정 취소 승인/복구: 클라이언트 상태 동기화 안정화 (Realtime 구독 stale closure 방지)
- [x] 사전등록 유저 관리: admin 편집(이름/소속, 미등록 시 이메일 변경) 기능 추가

### User logic / Admin page (2026-01-26)
- [x] allowedUsers.singleRoom === 'Y' 인 유저는 1인실 선택 가능 (비신청자는 기존 안내 모달 유지)
- [x] 1인실 선택/배정 UI에서 룸메이트 관련 옵션/초대 로직 비활성화(숨김/가드)
- [x] output.json 스키마(소속명|성명|직위|이메일|1인실 여부|성별)에 맞춰 allowedUsers/활성유저(관리자 리스트) 컬럼 및 편집 폼 정렬
- [x] 사전등록 CSV 업로드도 output.json 스키마 기준(6컬럼)으로 안내/파싱/유효성검증(이메일·성명·성별) 반영
- [x] 사전등록 관리: 체크박스 다중 선택 후 선택 삭제(일괄 삭제) 기능 추가

### RoomData / DB Update (2026-01-26)
- [x] roomData를 single/double + 성별 객실 리스트 기준으로 재생성(9/10/11층)
- [x] 9xx 객실번호 허용을 위해 isValidRoomNumber 검증 업데이트
- [x] DB rooms 동기화: 관리자가 roomData 기준으로 누락 방 생성/빈방 삭제할 수 있도록 동기화 버튼/함수 추가

### Refactor Plan Progress (update.md) (2026-01-26)
- [x] PHASE 1 / STEP 1-1 룸 상태 UI 표준화(룸 카드 고정 크기/섹션 분리/상태 칩)
- [x] PHASE 1 / STEP 1-2 User Profile 영역 분리 + Room Assignment 영역 2열 레이아웃
- [x] PHASE 2 / STEP 2-1 1인실 선택 권한 적용 + 1인실 모달에서 룸메이트 UI 숨김/가드
- [x] PHASE 3 reserved(60초 임시 예약) 선점/해제 + UI 표시
- [ ] PHASE 3 pending(룸메이트 초대 중 잠금) 연결
- [ ] PHASE 3 reserved 안내 Redirection Modal(잔여초) 적용

## 기술 스택
- React (Vite)
- Firebase Realtime Database
- Tailwind CSS

## 색상 규칙
| 상태 | 색상 |
|------|------|
| 빈 방 (남성 구역) | 파란 테두리 |
| 빈 방 (여성 구역) | 분홍 테두리 |
| 남성 1명 선택 (2인실) | 연한 파랑 (#BFDBFE) |
| 여성 1명 선택 (2인실) | 연한 분홍 (#FBCFE8) |
| 배정 완료 (남성) | 진한 파랑 (#3B82F6) |
| 배정 완료 (여성) | 진한 분홍 (#EC4899) |
| 내가 선택한 방 | 별도 표시 (테두리/아이콘) |

## 데이터 구조 (Firebase)
```json
{
  "rooms": {
    "1207": {
      "floor": 12,
      "type": "single",
      "gender": "F",
      "capacity": 1,
      "guests": ["강**"]
    },
    "618": {
      "floor": 6,
      "type": "twin",
      "gender": "M", 
      "capacity": 2,
      "guests": ["신**", "안**"]
    }
  },
  "users": {
    "uid123": {
      "name": "홍길동",
      "gender": "M",
      "selectedRoom": "1101",
      "selectedAt": timestamp
    }
  }
}
```
