# 호텔 객실 배정 시스템 - V-Up 

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

### 현장등록(배정만) → 정식 등록(OTP) 전환 (2026-01-28)
- [x] 현장등록 guest 생성 시 tempGuestId 발급 및 tempGuests 레코드 생성(롤백 포함)
- [x] 관리자 전환 기능: tempGuestId 기반으로 rooms.guests 치환 + users.selectedRoom/locked 동기화 + history 기록
- [x] 관리자 UI: 객실 관리에서 현장 guest에 '전환' 버튼/모달 제공
- [x] Realtime DB rules: tempGuests 경로 추가(최소 validate)
- [x] 전환 대상 등록유저가 이미 배정/잠금 상태여도 선택 가능 + (옵션) 기존 배정 자동 이동 지원
- [x] 전환 모달 검색: 사전등록(allowedUsers)도 하단 정보 패널로 함께 표시

### 관리자 객실 등록 UX 개선 (2026-01-28)
- [x] 객실 등록 모달에 '등록유저 배정(userlist)' 탭 추가 + 검색/선택으로 즉시 배정
- [x] 이미 다른 방에 배정된 유저도 (옵션) 이동 후 배정 가능
- [x] 사전등록(allowedUsers) 검색 결과를 하단에 표시(registeredSessionId 있으면 선택 가능)

### Mobile UI/UX 개선 (2026-01-28)
- [x] 모바일 반응형 디자인: RoomCard를 모바일에서 가로형 리스트 형태로 표시
- [x] 모바일 반응형 디자인: RoomGrid를 모바일에서 리스트 레이아웃으로 변경
- [x] 모바일 반응형 디자인: App.jsx 레이아웃 간격 조정
- [x] RoomCard: 데스크톱에서도 게스트 이름을 hover 없이 항상 표시

### Bugfix (2026-01-26)
- [x] Realtime DB rules: 삭제/부분 업데이트가 `.validate`에 의해 막히지 않도록 개선
- [x] 유저 관리: 유저 삭제(permission-denied) 해결 (경로 불일치 + rooms 전체 덮어쓰기 제거)
- [x] 방 배정 취소 승인/복구: 클라이언트 상태 동기화 안정화 (Realtime 구독 stale closure 방지)
- [x] 사전등록 유저 관리: admin 편집(이름/소속, 미등록 시 이메일 변경) 기능 추가
- [x] Firebase 에러 캐치/안내 강화: errorHandler의 show-toast 이벤트를 Toast UI에 연결 + RTDB 실시간 구독(onValue) 에러 콜백 처리
- [x] OTP/인증 안정화: otp_requests 키 통일(emailToKey) + deletedAt 계정 OTP 발급/검증 차단(삭제 후에도 메일 발송되는 문제 방지)
- [x] RTDB Rules(auth != null) 준수 강화: 공통 ensureAnonymousAuth(authGuard) 도입 + 모든 read/write/subscribe 전에 auth 확보하도록 Firebase 모듈 정리(permission_denied 안정화)

### Bugfix (2026-01-27)
- [x] 특이 케이스: locked=true 이지만 selectedRoom=null 인 경우 방 선택이 막히는 문제 완화(선택 차단 조건을 selectedRoom 기준으로 정리)
- [ ] 관리자 설정: 나이 제한(ageMin/ageMax) 설정 추가 + AdditionalInfoModal에서 범위 검증 적용 (원복)

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
- [x] PHASE 3 pending(룸메이트 초대 중 잠금) 연결
- [x] PHASE 3 reserved 안내 Redirection Modal(잔여초) 적용
- [진행 중] PHASE 4 React 상태 관리 리팩토링(1차: UIContext modalData + App 모달 상태 통합)

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
