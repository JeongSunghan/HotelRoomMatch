# UI/UX 리메이크 통합 가이드

**디자인 컨셉**: Digital Guest List (디지털 게스트 리스트)  
**완료일**: 2026-01-07  
**기반 문서**: `docs/UIUX_DESIGN.md`

---

## 📋 목차

1. [개요](#개요)
2. [생성된 컴포넌트](#생성된-컴포넌트)
3. [통합 방법](#통합-방법)
4. [스타일 적용](#스타일-적용)
5. [주요 기능](#주요-기능)
6. [비교표](#비교표)

---

## 개요

### 디자인 철학

**"Digital Guest List"** - 호텔 방 배정을 단순 행정 절차가 아닌 **네트워킹의 시작점**으로 재해석합니다.

- **영화관 좌석 예매**의 설렘
- **게임 파티 매칭**의 직관성
- **라운지 바**의 고급스러움

### 핵심 변경사항

1. **아바타 슬롯 시스템**: 텍스트 → 시각적 동그라미
2. **벤토 그리드**: 밀도 높은 카드 배열
3. **다크 모드**: 네이비/차콜 + 네온 포인트
4. **마이크로 인터랙션**: 호버, 글로우, 티켓 효과

---

## 생성된 컴포넌트

### 1. RoomCardRemake.tsx

**위치**: `src/components/room/RoomCardRemake.tsx`

**주요 특징**:
- ✅ 아바타 슬롯 (동그라미 2개)
- ✅ 빈 슬롯 (점선 원)
- ✅ 호버 시 툴팁 (게스트 정보)
- ✅ 네온 글로우 효과
- ✅ 만실 오버레이 ("Sold Out")

**Props**:
```typescript
interface RoomCardRemakeProps {
    roomNumber: string;
    roomInfo: RoomInfo;
    status: RoomStatus;
    isMyRoom: boolean;
    canSelect: boolean;
    onClick: (roomNumber: string) => void;
    onSingleRoomClick?: (roomNumber: string) => void;
    isAdmin: boolean;
    isHighlighted?: boolean;
}
```

### 2. RoomGridRemake.tsx

**위치**: `src/components/room/RoomGridRemake.tsx`

**주요 특징**:
- ✅ CSS Grid 기반 벤토 그리드
- ✅ 카드 최소 너비 140px
- ✅ 반응형 (2~7열)
- ✅ 행별 그룹화
- ✅ 층 정보 헤더 (컴팩트)

**Props**:
```typescript
interface RoomGridRemakeProps {
    selectedFloor: string;
    userGender: Gender | null;
    getRoomStatus: (roomNumber: string) => RoomStatus;
    isMyRoom: (roomNumber: string) => boolean;
    onRoomClick: (roomNumber: string) => void;
    onSingleRoomClick?: (roomNumber: string) => void;
    canUserSelect: (roomNumber: string, roomStatus: RoomStatus) => boolean;
    isAdmin: boolean;
    roomTypeFilter?: 'all' | 'single' | 'twin';
    highlightedRoom?: string | null;
    isLoading?: boolean;
}
```

### 3. HeaderRemake.tsx

**위치**: `src/components/ui/HeaderRemake.tsx`

**주요 특징**:
- ✅ 벤토 그리드 레이아웃 (3단 구성)
- ✅ 내 방 티켓 모듈 (좌측)
- ✅ 잔여 현황 모듈 (중앙, 프로그레스 바)
- ✅ 액션 버튼 (우측)
- ✅ 네온 라임 강조

**Props**:
```typescript
interface HeaderRemakeProps {
    user: User | null;
    onMyRoomClick?: () => void;
    onSearchClick?: () => void;
    onLogout?: () => void;
    stats?: {
        male: { totalCapacity, occupiedSlots, availableSlots, occupancyRate };
        female: { totalCapacity, occupiedSlots, availableSlots, occupancyRate };
        total: { totalCapacity, occupiedSlots, availableSlots, occupancyRate };
    };
}
```

### 4. uiux-remake.css

**위치**: `src/styles/uiux-remake.css`

**주요 특징**:
- ✅ 다크 모드 CSS 변수
- ✅ 애니메이션 (fade-in, pulse-glow, slide-up)
- ✅ 네온 글로우 효과
- ✅ 티켓 스타일
- ✅ 필터 탭 스타일
- ✅ 도넛 차트
- ✅ 스티키 액션 바

---

## 통합 방법

### Step 1: CSS 임포트

`src/main.tsx` 또는 `src/App.tsx`에 추가:

```typescript
import './styles/uiux-remake.css';
```

### Step 2: 컴포넌트 교체

#### 기존 코드 (AS-IS):
```tsx
import RoomCard from './components/room/RoomCard';
import RoomGrid from './components/room/RoomGrid';
import Header from './components/ui/Header';
```

#### 리메이크 코드 (TO-BE):
```tsx
import RoomCardRemake from './components/room/RoomCardRemake';
import RoomGridRemake from './components/room/RoomGridRemake';
import HeaderRemake from './components/ui/HeaderRemake';
```

### Step 3: 다크 모드 클래스 추가

`App.tsx` 또는 루트 컴포넌트:

```tsx
<div className="dark-mode-remake min-h-screen">
  <HeaderRemake {...headerProps} />
  <RoomGridRemake {...gridProps} />
</div>
```

### Step 4: Props 매핑

기존 컴포넌트와 Props가 거의 동일하므로, 그대로 전달 가능:

```tsx
<RoomGridRemake
    selectedFloor={selectedFloor}
    userGender={user?.gender || null}
    getRoomStatus={getRoomStatus}
    isMyRoom={isMyRoom}
    onRoomClick={handleRoomClick}
    onSingleRoomClick={handleSingleRoomClick}
    canUserSelect={canUserSelect}
    isAdmin={isAdmin}
    roomTypeFilter={roomTypeFilter}
    highlightedRoom={highlightedRoom}
    isLoading={isLoading}
/>
```

---

## 스타일 적용

### 다크 모드 배경

`body` 태그에 클래스 추가:

```tsx
useEffect(() => {
  document.body.classList.add('dark-mode-remake');
  return () => {
    document.body.classList.remove('dark-mode-remake');
  };
}, []);
```

### 네온 포인트 컬러

CSS 변수 사용:

```css
:root {
  --neon-lime: #84cc16;
  --neon-amber: #fbbf24;
  --neon-blue: #3b82f6;
  --neon-pink: #ec4899;
}
```

### 커스텀 애니메이션

```tsx
<div className="animate-fade-in">
  {/* 컨텐츠 */}
</div>

<div className="animate-pulse-glow">
  {/* 선택된 카드 */}
</div>

<div className="animate-slide-up">
  {/* 티켓 확인 모달 */}
</div>
```

---

## 주요 기능

### 1. 아바타 슬롯 시스템

**빈 슬롯**:
- 점선 원 (`border-dashed`)
- 회색 반투명 (`border-gray-600/30`)

**게스트 슬롯**:
- 그라디언트 배경 (`bg-gradient-to-br`)
- 이니셜 표시 (흰색 굵은 글씨)
- 코골이 배지 (우상단)
- 호버 시 툴팁 (이름, 회사, 나이)

**만실 오버레이**:
- 블랙 반투명 배경 (`bg-black/40`)
- "Sold Out" 텍스트

### 2. 벤토 그리드 레이아웃

**CSS Grid 설정**:
```css
.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
```

**반응형 브레이크포인트**:
- 모바일: 2열
- 태블릿: 3~4열
- 데스크탑: 5~7열

### 3. 마이크로 인터랙션

**호버 효과**:
- `transform: translateY(-4px) scale(1.02)`
- 네온 글로우 (`box-shadow`)

**액티브 효과**:
- `transform: scale(0.98)`

**선택 효과**:
- 네온 라임 테두리
- 펄스 글로우 애니메이션

### 4. 티켓 확인 모달

**스타일**:
- 그라디언트 배경
- 네온 라임 테두리
- 상단 쉬머 애니메이션
- 슬라이드 업 진입

---

## 비교표

| 항목 | AS-IS (기존) | TO-BE (리메이크) |
|------|-------------|-----------------|
| **레이아웃** | 단순 나열 리스트 | 벤토 그리드 (밀도 높음) |
| **방 카드** | 텍스트 중심 (`0/2`) | 아바타 슬롯 (동그라미) |
| **배경** | 화이트/라이트 그레이 | 다크 네이비/차콜 |
| **포인트 컬러** | 파스텔 블루/핑크 | 네온 라임/앰버 |
| **인터랙션** | 정적 (라디오 버튼) | 호버 글로우, 티켓 효과 |
| **헤더** | 긴 통계 바 | 컴팩트 벤토 그리드 |
| **게스트 정보** | 텍스트 리스트 | 호버 툴팁 |
| **만실 표시** | 텍스트 (`만원`) | "Sold Out" 오버레이 |

---

## 사용 예시

### 전체 통합 예시

```tsx
import { useEffect } from 'react';
import HeaderRemake from './components/ui/HeaderRemake';
import RoomGridRemake from './components/room/RoomGridRemake';
import './styles/uiux-remake.css';

function App() {
  // 다크 모드 클래스 추가
  useEffect(() => {
    document.body.classList.add('dark-mode-remake');
    return () => {
      document.body.classList.remove('dark-mode-remake');
    };
  }, []);

  return (
    <div className="min-h-screen">
      <HeaderRemake
        user={user}
        onMyRoomClick={handleMyRoomClick}
        onSearchClick={handleSearchClick}
        onLogout={handleLogout}
        stats={stats}
      />

      <main className="container mx-auto px-4 py-8">
        <RoomGridRemake
          selectedFloor={selectedFloor}
          userGender={user?.gender || null}
          getRoomStatus={getRoomStatus}
          isMyRoom={isMyRoom}
          onRoomClick={handleRoomClick}
          onSingleRoomClick={handleSingleRoomClick}
          canUserSelect={canUserSelect}
          isAdmin={isAdmin}
          roomTypeFilter={roomTypeFilter}
          highlightedRoom={highlightedRoom}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
```

---

## 추가 커스터마이징

### 네온 컬러 변경

`uiux-remake.css`에서:

```css
:root {
  --neon-lime: #your-color;
  --neon-amber: #your-color;
}
```

### 카드 크기 조정

`RoomGridRemake.tsx`에서:

```tsx
style={{
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' // 140px → 160px
}}
```

### 애니메이션 속도 조정

`uiux-remake.css`에서:

```css
.room-card-remake {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); /* 0.3s → 0.5s */
}
```

---

## 문제 해결

### Q1: 다크 모드가 적용되지 않아요
**A**: `document.body.classList.add('dark-mode-remake')`가 실행되었는지 확인하세요.

### Q2: 아바타 슬롯이 보이지 않아요
**A**: `RoomCardRemake`를 사용하고 있는지, `guests` 데이터가 올바른지 확인하세요.

### Q3: 그리드가 너무 좁아요
**A**: `minmax(140px, 1fr)`의 `140px`를 더 큰 값으로 조정하세요.

### Q4: 네온 효과가 너무 강해요
**A**: `box-shadow`의 `rgba` 알파값을 낮추세요 (예: `0.5` → `0.3`).

---

## 참고 자료

- [원본 디자인 문서](./UIUX_DESIGN.md)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [CSS Grid 가이드](https://css-tricks.com/snippets/css/complete-guide-grid/)

---

**🎉 UI/UX 리메이크 완료!**

궁금한 점이 있으시면 문의해주세요.

