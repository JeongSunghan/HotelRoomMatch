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
