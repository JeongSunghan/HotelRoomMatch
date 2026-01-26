/**
 * 개별 객실 카드 컴포넌트 (영화관 좌석 스타일)
 */
import { memo, useMemo, useCallback, useState } from 'react';

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
}) {
    const { guests, guestCount, capacity, roomType, roomGender, isLocked, isReserved } = status;
    const [showTooltip, setShowTooltip] = useState(false);

    // 상태별 스타일 결정 - 메모이제이션
    const cardStyle = useMemo(() => {
        // 예약 중인 방 (오버레이 스타일은 별도 처리하지만 기본 배경은 유지)
        if (isReserved) {
            return 'bg-gray-100 border-2 border-orange-300 opacity-90';
        }

        // 내가 선택한 방
        if (isMyRoom) {
            return 'bg-emerald-100 border-4 border-emerald-600 shadow-lg shadow-emerald-200';
        }

        // 1인실 잠금
        if (isLocked) {
            return 'bg-gray-200 border-2 border-gray-400 opacity-60 cursor-not-allowed';
        }

        // 상태별 스타일
        switch (status.status) {
            case 'empty':
                return roomGender === 'M'
                    ? 'bg-white border-2 border-blue-400 hover:border-blue-600 hover:shadow-md hover:scale-105'
                    : 'bg-white border-2 border-pink-400 hover:border-pink-600 hover:shadow-md hover:scale-105';

            case 'half':
                return roomGender === 'M'
                    ? 'bg-blue-100 border-2 border-blue-400'
                    : 'bg-pink-100 border-2 border-pink-400';

            case 'full':
                return roomGender === 'M'
                    ? 'bg-blue-200 border-2 border-blue-600'
                    : 'bg-pink-200 border-2 border-pink-600';

            case 'wrong-gender':
                return 'bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';

            default:
                return 'bg-white border-2 border-gray-300';
        }
    }, [isMyRoom, isLocked, status.status, roomGender, isReserved]);

    // 클릭 가능 여부 (예약 중이어도 클릭은 가능해야 모달이 뜸)
    const isClickable = canSelect || isAdmin || isLocked;

    // 클릭 핸들러 - 메모이제이션
    const handleClick = useCallback(() => {
        if (isLocked) {
            onSingleRoomClick?.(roomNumber);
        } else if (canSelect || isAdmin) {
            onClick(roomNumber);
        }
    }, [isLocked, canSelect, isAdmin, onClick, onSingleRoomClick, roomNumber]);

    // 키보드 핸들러 - 접근성 개선
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    }, [handleClick]);

    // aria-label 생성 - 접근성 개선
    const ariaLabel = useMemo(() => {
        const parts = [
            `${roomNumber}호실`,
            `${capacity}인실`,
            guestCount > 0 ? `${guestCount}명 입실` : '빈 방'
        ];
        if (isMyRoom) parts.push('내가 선택한 방');
        if (isLocked) parts.push('잠금');
        if (isReserved) parts.push('예약 중');
        return parts.join(', ');
    }, [roomNumber, capacity, guestCount, isMyRoom, isLocked, isReserved]);

    // 툴팁 내용 생성
    const tooltipContent = useMemo(() => {
        if (isReserved) return '다른 사용자가 선택 중...';
        if (guests.length === 0) {
            return isLocked ? '1인실 (잠금)' : '빈 방';
        }
        return guests.map(g => g.name).join(', ');
    }, [guests, isLocked, isReserved]);

    return (
        <div className="relative">
            <div
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                role="button"
                tabIndex={isClickable ? 0 : -1}
                aria-label={ariaLabel}
                aria-disabled={!isClickable}
                className={`
                    room-card w-24 h-24 rounded-lg cursor-pointer
                    flex flex-col items-center justify-center
                    transition-all duration-200
                    ${cardStyle}
                    ${!isClickable && 'cursor-not-allowed'}
                    ${isHighlighted && 'ring-4 ring-yellow-400 animate-pulse'}
                `}
            >
                {/* 예약 중 오버레이 */}
                {isReserved && (
                    <div className="absolute inset-0 bg-orange-100/50 flex flex-col items-center justify-center rounded-lg z-10 backdrop-blur-[1px]">
                        <span className="text-xs font-bold text-orange-700 bg-white/80 px-1.5 py-0.5 rounded shadow-sm">예약중</span>
                    </div>
                )}

                {/* 방 번호 */}
                <div className="text-2xl font-bold text-gray-800 mb-1 z-0">
                    {roomNumber}
                </div>

                {/* 상태 표시 */}
                <div className="flex items-center gap-1.5 text-xs z-0">
                    {/* 인원 표시 */}
                    <span className={`
                        px-2 py-0.5 rounded-full font-semibold
                        ${guestCount === capacity
                            ? 'bg-gray-800 text-white'
                            : guestCount > 0
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-gray-100 text-gray-500'
                        }
                    `}>
                        {guestCount}/{capacity}
                    </span>

                    {/* 내 방 표시 */}
                    {isMyRoom && (
                        <span className="text-emerald-600 font-bold">✓</span>
                    )}

                    {/* 잠금 표시 */}
                    {isLocked && (
                        <span className="text-gray-500">🔒</span>
                    )}
                </div>
            </div>

            {/* 호버 툴팁 */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                        <div className="font-medium mb-0.5">{roomNumber}호 ({roomType})</div>
                        <div className="text-gray-300">{tooltipContent}</div>
                        {/* 화살표 */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // 커스텀 비교 함수 - 실제 변경된 경우에만 리렌더
    return (
        prevProps.roomNumber === nextProps.roomNumber &&
        prevProps.status.status === nextProps.status.status &&
        prevProps.isMyRoom === nextProps.isMyRoom &&
        prevProps.canSelect === nextProps.canSelect &&
        prevProps.isHighlighted === nextProps.isHighlighted &&
        prevProps.status.guestCount === nextProps.status.guestCount &&
        prevProps.status.isLocked === nextProps.status.isLocked &&
        prevProps.status.isReserved === nextProps.status.isReserved // 예약 상태 비교 추가
    );
});

export default RoomCard;

