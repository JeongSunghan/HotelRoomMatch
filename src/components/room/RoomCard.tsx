/**
 * RoomCard 컴포넌트 - 아바타 슬롯 시스템
 * 디자인 컨셉: Digital Guest List
 * 
 * [업데이트] 2026-01-07 - 리메이크 버전으로 교체
 * 기존 버전: legacy/RoomCard.tsx
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
 * 아바타 슬롯 컴포넌트
 */
const AvatarSlot = ({ guest, gender }: { guest: Guest | null; gender: 'M' | 'F' | null }) => {
    if (!guest) {
        // 빈 슬롯 (Empty State) - 점선 원
        return (
            <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                <div className="w-full h-full rounded-full border-2 border-dashed border-gray-600/30 dark:border-gray-400/30 flex items-center justify-center">
                    <span className="text-gray-500/50 text-lg">◌</span>
                </div>
            </div>
        );
    }

    // 게스트 슬롯 (Filled State)
    const initial = guest.name.charAt(0);
    const bgColor = guest.gender === 'M' 
        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
        : 'bg-gradient-to-br from-pink-500 to-pink-600';
    
    return (
        <div className="relative group">
            {/* 아바타 원 */}
            <div className={`
                w-12 h-12 sm:w-14 sm:h-14 rounded-full ${bgColor}
                flex items-center justify-center
                shadow-lg shadow-black/20
                border-2 border-white/20
                transition-transform duration-200
                group-hover:scale-110
            `}>
                <span className="text-white font-bold text-lg sm:text-xl">
                    {initial}
                </span>
            </div>

            {/* 코골이 배지 (우상단) */}
            {guest.snoring && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <span className="text-xs">😴</span>
                </div>
            )}

            {/* 호버 시 툴팁 */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                    <div className="font-semibold">{guest.name}</div>
                    {guest.company && <div className="text-gray-300 mt-0.5">{guest.company}</div>}
                    {guest.age && <div className="text-gray-400 mt-0.5">{guest.age}세</div>}
                </div>
                {/* 화살표 */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>
        </div>
    );
};

/**
 * RoomCard - 아바타 슬롯 시스템
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

    // 상태별 스타일 결정 (다크 모드 기반)
    const getCardStyle = (): string => {
        // 내가 선택한 방 - 네온 라임 강조
        if (isMyRoom) {
            return 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-lime-400 shadow-lg shadow-lime-400/50 ring-2 ring-lime-400/30';
        }

        // 1인실 잠금
        if (isLocked) {
            return 'bg-gray-800/50 border border-gray-700 opacity-60 cursor-not-allowed';
        }

        // 상태별 스타일 (다크 모드)
        switch (status.status) {
            case 'empty':
                // 빈 방 - 네온 포인트 (성별별)
                return roomGender === 'M'
                    ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-blue-500/50 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/30'
                    : 'bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-pink-500/50 hover:border-pink-400 hover:shadow-lg hover:shadow-pink-500/30';

            case 'half':
                // 1명 입장 - 강조
                return roomGender === 'M'
                    ? 'bg-gradient-to-br from-blue-950 to-gray-900 border-2 border-blue-400/70 shadow-md shadow-blue-500/20'
                    : 'bg-gradient-to-br from-pink-950 to-gray-900 border-2 border-pink-400/70 shadow-md shadow-pink-500/20';

            case 'full':
                // 만실 - 딤드 (Sold Out 느낌)
                return roomGender === 'M'
                    ? 'bg-gradient-to-br from-blue-900/50 to-gray-900 border border-blue-600/30 opacity-70'
                    : 'bg-gradient-to-br from-pink-900/50 to-gray-900 border border-pink-600/30 opacity-70';

            case 'wrong-gender':
                // 다른 성별 - 흐림
                return 'bg-gray-900/30 border border-gray-700/50 opacity-40';

            default:
                return 'bg-gray-900 border border-gray-700';
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
                room-card-remake relative overflow-hidden
                rounded-xl p-4 sm:p-5
                transition-all duration-300
                ${getCardStyle()}
                ${isClickable ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.97]' : 'cursor-not-allowed'}
                ${isHighlighted && 'ring-4 ring-amber-400 ring-offset-2 ring-offset-gray-900 animate-pulse'}
                focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-900
            `}
        >
            {/* 배경 그라디언트 효과 (선택 가능한 경우) */}
            {canSelect && !isMyRoom && !isLocked && (
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 pointer-events-none"></div>
            )}

            {/* 상단: 방 번호 & 타입 */}
            <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {roomNumber}
                    </span>
                    {isMyRoom && (
                        <span className="text-lime-400 text-sm font-semibold animate-pulse">
                            ★ MY
                        </span>
                    )}
                </div>

                {/* 타입 배지 (네온 스타일) */}
                <div className={`
                    px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${capacity === 2 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'}
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
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg backdrop-blur-sm">
                        <span className="text-white/90 font-bold text-sm uppercase tracking-widest">
                            Sold Out
                        </span>
                    </div>
                )}

                {/* 잠금 오버레이 */}
                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg backdrop-blur-sm">
                        <span className="text-gray-300 text-2xl">🔒</span>
                    </div>
                )}
            </div>

            {/* 하단: 상태 정보 */}
            <div className="relative flex items-center justify-between text-xs">
                {/* 좌측: 객실 타입 */}
                <span className="text-gray-400 font-medium">
                    {roomType}
                </span>

                {/* 우측: 상태 인디케이터 */}
                <div className="flex items-center gap-2">
                    {/* 인원 표시 */}
                    <span className={`
                        font-bold
                        ${guestCount === 0 ? 'text-gray-500' : 
                          guestCount === capacity ? 'text-red-400' : 
                          'text-blue-400'}
                    `}>
                        {guestCount}/{capacity}
                    </span>

                    {/* 선택 가능 인디케이터 */}
                    {canSelect && !isMyRoom && !isLocked && (
                        <span className="text-lime-400 font-semibold animate-pulse">
                            ⚡
                        </span>
                    )}
                </div>
            </div>

            {/* 호버 시 Glow 효과 (선택 가능한 경우) */}
            {canSelect && !isMyRoom && !isLocked && (
                <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className={`
                        absolute inset-0 rounded-xl blur-xl
                        ${roomGender === 'M' ? 'bg-blue-500/20' : 'bg-pink-500/20'}
                    `}></div>
                </div>
            )}
        </div>
    );
});

RoomCard.displayName = 'RoomCard';

export default RoomCard;

