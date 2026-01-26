/**
 * 개별 객실 카드 컴포넌트
 */
import { memo, useMemo, useCallback } from 'react';

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
    const { guests, guestCount, capacity, roomType, roomGender, isLocked } = status;

    // 상태별 스타일 결정 - 메모이제이션
    const cardStyle = useMemo(() => {
        // 내가 선택한 방
        if (isMyRoom) {
            return 'bg-emerald-50 border-2 border-emerald-500 my-room';
        }

        // 1인실 잠금
        if (isLocked) {
            return 'bg-gray-200 border-2 border-gray-400 opacity-50 cursor-not-allowed';
        }

        // 상태별 스타일
        switch (status.status) {
            case 'empty':
                return roomGender === 'M'
                    ? 'bg-white border-2 border-blue-500 hover:border-blue-600 hover:bg-blue-50'
                    : 'bg-white border-2 border-pink-500 hover:border-pink-600 hover:bg-pink-50';

            case 'half':
                return roomGender === 'M'
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : 'bg-pink-50 border-2 border-pink-300';

            case 'full':
                return roomGender === 'M'
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-pink-100 border-2 border-pink-500';

            case 'wrong-gender':
                return 'bg-gray-100 border border-gray-300 opacity-60';

            default:
                return 'bg-white border border-gray-200';
        }
    }, [isMyRoom, isLocked, status.status, roomGender]);

    // 클릭 가능 여부
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
        return parts.join(', ');
    }, [roomNumber, capacity, guestCount, isMyRoom, isLocked]);

    return (
        <div
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={isClickable ? 0 : -1}
            aria-label={ariaLabel}
            aria-disabled={!isClickable}
            className={`
                room-card p-4 rounded-lg cursor-pointer
                ${cardStyle}
                ${!isClickable && 'cursor-not-allowed'}
                ${isHighlighted && 'ring-4 ring-yellow-400 ring-offset-2 animate-pulse shadow-lg shadow-yellow-200'}
            `}
        >
            {/* 방 번호 */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-800">{roomNumber}</span>
                {/* 타입 배지 */}
                <span className={`
                    text-xs px-2 py-0.5 rounded-full font-medium
                    ${capacity === 2 ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}
                `}>
                    {capacity === 2 ? '2인실' : '1인실'}
                </span>
            </div>

            {/* 객실 타입 */}
            <p className="text-xs text-gray-500 mb-2">{roomType}</p>

            {/* 투숙객 목록 */}
            <div className="min-h-[2.5rem]">
                {guests.length > 0 ? (
                    <div className="space-y-1">
                        {guests.map((guest, idx) => (
                            <div
                                key={idx}
                                className={`
                                    text-sm px-2 py-1 rounded font-medium flex items-center justify-between
                                    ${guest.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                                `}
                            >
                                <span>
                                    {guest.name}
                                    {guest.company && <span className="text-xs ml-1 opacity-70">({guest.company})</span>}
                                </span>
                                <div className="flex items-center gap-1">
                                    {/* 코골이 상태 표시 */}
                                    {guest.snoring === 'yes' && <span title="코골이 심함">😫</span>}
                                    {guest.snoring === 'no' && <span title="코골이 없음">😴</span>}

                                    {guest.age && (
                                        <span className="text-xs bg-white/50 px-1.5 py-0.5 rounded">{guest.age}세</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 italic">
                        {isLocked ? '1인실 (잠금)' : '빈 방'}
                    </p>
                )}
            </div>

            {/* 상태 인디케이터 */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                    {guestCount}/{capacity}
                </span>

                {/* 1인실 잠금 표시 */}
                {isLocked && (
                    <span className="text-xs text-gray-500 font-medium">🔒 잠금</span>
                )}

                {/* 선택 불가 표시 */}
                {status.status === 'wrong-gender' && (
                    <span className="text-sm text-gray-500">🔒</span>
                )}

                {/* 내 방 표시 */}
                {isMyRoom && (
                    <span className="text-xs text-emerald-600 font-medium">✓ 내 방</span>
                )}

                {/* 선택 가능 표시 */}
                {canSelect && !isMyRoom && !isLocked && (
                    <span className="text-xs text-blue-600 font-medium">선택 가능</span>
                )}
            </div>
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
        prevProps.status.isLocked === nextProps.status.isLocked
    );
});

export default RoomCard;

