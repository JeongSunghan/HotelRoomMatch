/**
 * RoomCard 컴포넌트 - 아바타 슬롯 시스템 (라이트 모드)
 * 디자인 컨셉: Digital Guest List
 * 
 * [업데이트] 2026-01-07 - 라이트 모드 스타일
 */

import { memo } from 'react';
import type { RoomInfo, RoomStatus, Guest } from '../../types';

interface RoomCardProps {
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

/**
 * 아바타 슬롯 컴포넌트 - 라이트 모드
 */
const AvatarSlot = ({ guest, gender }: { guest: Guest | null; gender: 'M' | 'F' | null }) => {
    if (!guest) {
        // 빈 슬롯 (Empty State) - 점선 원
        return (
            <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-lg">◌</span>
                </div>
            </div>
        );
    }

    // 게스트 슬롯 (Filled State)
    const initial = guest.name.charAt(0);
    const bgColor = guest.gender === 'M' 
        ? 'bg-blue-500' 
        : 'bg-pink-500';
    
    return (
        <div className="relative group">
            {/* 아바타 원 */}
            <div className={`
                w-12 h-12 sm:w-14 sm:h-14 rounded-full ${bgColor}
                flex items-center justify-center
                shadow-md
                border-2 border-white
                transition-transform duration-200
                group-hover:scale-110
            `}>
                <span className="text-white font-bold text-lg sm:text-xl">
                    {initial}
                </span>
            </div>

            {/* 코골이 배지 (우상단) */}
            {guest.snoring && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <span className="text-xs">😴</span>
                </div>
            )}

            {/* 호버 시 툴팁 */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                    <div className="font-semibold">{guest.name}</div>
                    {guest.company && <div className="text-gray-300 mt-0.5">{guest.company}</div>}
                    {guest.age && <div className="text-gray-400 mt-0.5">{guest.age}세</div>}
                </div>
                {/* 화살표 */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
            </div>
        </div>
    );
};

/**
 * RoomCard - 아바타 슬롯 시스템 (라이트 모드)
 */
const RoomCard = memo(function RoomCard({
    roomNumber,
    roomInfo,
    status,
    isMyRoom,
    canSelect,
    onClick,
    onSingleRoomClick,
    isAdmin,
    isHighlighted = false
}: RoomCardProps) {
    const { guests, guestCount, capacity, roomType, roomGender, isLocked } = status;

    // 상태별 스타일 결정 (라이트 모드)
    const getCardStyle = (): string => {
        // 내가 선택한 방 - 에메랄드 강조
        if (isMyRoom) {
            return 'bg-emerald-50 border-2 border-emerald-500 shadow-lg ring-2 ring-emerald-200';
        }

        // 1인실 잠금
        if (isLocked) {
            return 'bg-gray-100 border border-gray-300 opacity-60 cursor-not-allowed';
        }

        // 상태별 스타일 (라이트 모드)
        switch (status.status) {
            case 'empty':
                // 빈 방 - 성별별 밝은 색상
                return roomGender === 'M'
                    ? 'bg-white border-2 border-blue-300 hover:border-blue-500 hover:shadow-lg'
                    : 'bg-white border-2 border-pink-300 hover:border-pink-500 hover:shadow-lg';

            case 'half':
                // 1명 입장 - 강조
                return roomGender === 'M'
                    ? 'bg-blue-50 border-2 border-blue-400 shadow-md'
                    : 'bg-pink-50 border-2 border-pink-400 shadow-md';

            case 'full':
                // 만실 - 회색화
                return roomGender === 'M'
                    ? 'bg-blue-50/50 border border-blue-200 opacity-70'
                    : 'bg-pink-50/50 border border-pink-200 opacity-70';

            case 'wrong-gender':
                // 다른 성별 - 흐림
                return 'bg-gray-100 border border-gray-200 opacity-40';

            default:
                return 'bg-white border border-gray-200';
        }
    };

    // 클릭 가능 여부
    const isClickable = canSelect || isAdmin || isLocked;

    // 클릭 핸들러
    const handleClick = (): void => {
        if (isLocked) {
            onSingleRoomClick && onSingleRoomClick(roomNumber);
        } else if (canSelect || isAdmin) {
            onClick(roomNumber);
        }
    };

    // 키보드 네비게이션
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
        }
    };

    // 빈 슬롯 배열 생성 (capacity - guests.length)
    const emptySlots = Array.from({ length: capacity - guests.length });

    return (
        <div
            role="button"
            tabIndex={isClickable ? 0 : -1}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-label={`${roomNumber}호 ${roomType}`}
            aria-pressed={isMyRoom}
            className={`
                room-card relative overflow-hidden
                rounded-xl p-4 sm:p-5
                transition-all duration-300
                ${getCardStyle()}
                ${isClickable ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.97]' : 'cursor-not-allowed'}
                ${isHighlighted && 'ring-4 ring-amber-400 ring-offset-2 animate-pulse'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
        >
            {/* 상단: 방 번호 & 타입 */}
            <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-baseline gap-2">
                    <span className={`
                        text-2xl sm:text-3xl font-bold tracking-tight
                        ${roomGender === 'M' ? 'text-blue-700' : 'text-pink-700'}
                    `}>
                        {roomNumber}
                    </span>
                    {isMyRoom && (
                        <span className="text-emerald-600 text-sm font-semibold animate-pulse">
                            ★ MY
                        </span>
                    )}
                </div>

                {/* 타입 배지 */}
                <div className={`
                    px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${capacity === 2 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-amber-100 text-amber-700'}
                `}>
                    {capacity === 2 ? 'Twin' : 'Single'}
                </div>
            </div>

            {/* 중앙: 아바타 슬롯 */}
            <div className="relative mb-4">
                <div className="flex items-center justify-center gap-3 sm:gap-4 py-4">
                    {/* 게스트 슬롯 */}
                    {guests.map((guest: Guest, idx: number) => (
                        <AvatarSlot key={idx} guest={guest} gender={guest.gender} />
                    ))}
                    
                    {/* 빈 슬롯 */}
                    {emptySlots.map((_, idx) => (
                        <AvatarSlot key={`empty-${idx}`} guest={null} gender={roomGender} />
                    ))}
                </div>

                {/* 만실 오버레이 */}
                {status.status === 'full' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-500/30 rounded-lg backdrop-blur-sm">
                        <span className="text-gray-700 font-bold text-sm uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full">
                            Sold Out
                        </span>
                    </div>
                )}

                {/* 잠금 오버레이 */}
                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-500/30 rounded-lg backdrop-blur-sm">
                        <span className="text-gray-600 text-2xl">🔒</span>
                    </div>
                )}
            </div>

            {/* 하단: 상태 정보 */}
            <div className="relative flex items-center justify-between text-xs">
                {/* 좌측: 객실 타입 */}
                <span className="text-gray-500 font-medium">
                    {roomType}
                </span>

                {/* 우측: 상태 인디케이터 */}
                <div className="flex items-center gap-2">
                    {/* 인원 표시 */}
                    <span className={`
                        font-bold
                        ${guestCount === 0 ? 'text-gray-400' : 
                          guestCount === capacity ? 'text-red-500' : 
                          'text-blue-600'}
                    `}>
                        {guestCount}/{capacity}
                    </span>

                    {/* 선택 가능 인디케이터 */}
                    {canSelect && !isMyRoom && !isLocked && (
                        <span className="text-emerald-500 font-semibold animate-pulse">
                            ⚡
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});

RoomCard.displayName = 'RoomCard';

export default RoomCard;
