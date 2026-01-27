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

    const uiStatus = useMemo(() => {
        // update.md(PHASE 1 / STEP 1-1) 기준 "표준 상태"를 UI 레벨에서만 우선 적용
        // - available : 선택 가능
        // - occupied  : 배정 완료
        // - reserved  : 잠금/접근 불가(권한/성별 포함)
        // - pending   : 룸메이트 수락 대기(타인 접근 차단)
        if (status.status === 'pending') {
            return { key: 'pending', label: '수락대기', icon: '⌛', tone: 'purple' };
        }
        if (status.status === 'reserved') {
            return { key: 'reserved', label: '예약중', icon: '⏳', tone: 'amber' };
        }
        if (isMyRoom) {
            return { key: 'occupied', label: '내 방', icon: '✓', tone: 'emerald' };
        }
        if (status.status === 'full' || guestCount >= capacity) {
            return { key: 'occupied', label: '배정 완료', icon: '■', tone: roomGender === 'M' ? 'blue' : 'pink' };
        }
        if (isLocked || status.status === 'wrong-gender') {
            return { key: 'reserved', label: '선택 불가', icon: '🔒', tone: 'slate' };
        }
        if (canSelect || isAdmin) {
            return { key: 'available', label: '선택 가능', icon: '○', tone: roomGender === 'M' ? 'blue' : 'pink' };
        }
        return { key: 'reserved', label: '대기', icon: '…', tone: 'slate' };
    }, [isMyRoom, status.status, guestCount, capacity, isLocked, canSelect, isAdmin, roomGender]);

    const statusChipClass = useMemo(() => {
        switch (uiStatus.tone) {
            case 'emerald':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'blue':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'pink':
                return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'amber':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'purple':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    }, [uiStatus.tone]);

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

            case 'reserved':
                return 'bg-amber-50 border-2 border-amber-400 hover:border-amber-500';

            case 'pending':
                return 'bg-purple-50 border-2 border-purple-400 hover:border-purple-500';

            case 'wrong-gender':
                return 'bg-gray-100 border border-gray-300 opacity-60';

            default:
                return 'bg-white border border-gray-200';
        }
    }, [isMyRoom, isLocked, status.status, roomGender]);

    // 클릭 가능 여부
    const isClickable = canSelect || isAdmin || isLocked || status.status === 'reserved' || status.status === 'pending';

    // 클릭 핸들러 - 메모이제이션
    const handleClick = useCallback(() => {
        if (isLocked) {
            onSingleRoomClick?.(roomNumber);
        } else if (canSelect || isAdmin || status.status === 'reserved' || status.status === 'pending') {
            onClick(roomNumber);
        }
    }, [isLocked, canSelect, isAdmin, onClick, onSingleRoomClick, roomNumber, status.status]);

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
                room-card h-[148px] p-3 rounded-lg cursor-pointer flex flex-col
                ${cardStyle}
                ${!isClickable && 'cursor-not-allowed disabled'}
                ${isHighlighted && 'ring-4 ring-yellow-400 ring-offset-2 animate-pulse shadow-lg shadow-yellow-200'}
            `}
        >
            {/* 헤더: 방번호 + 타입 (고정 높이) */}
            <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-800 leading-none">{roomNumber}</span>
                {/* 타입 배지 */}
                <span className={`
                    text-xs px-2 py-0.5 rounded-full font-medium
                    ${capacity === 2 ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}
                `}>
                    {capacity === 2 ? '2인실' : '1인실'}
                </span>
            </div>

            {/* 객실 타입 */}
            <p className="text-[11px] text-gray-500 mt-1 truncate">{roomType}</p>

            {/* 투숙객 목록 (고정 영역) */}
            <div className="mt-2 flex-1 overflow-hidden">
                {guests.length > 0 ? (
                    <div className="space-y-1">
                        {guests.map((guest, idx) => (
                            <div
                                key={idx}
                                className={`
                                    text-[12px] px-2 py-1 rounded font-medium flex items-center justify-between gap-2
                                    ${guest.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                                `}
                            >
                                <span className="truncate">
                                    {guest.name}
                                    {guest.company && <span className="text-[11px] ml-1 opacity-70">({guest.company})</span>}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
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
                    <div className="h-full flex items-center">
                        <p className="text-[12px] text-gray-500 italic">
                            {isLocked ? '잠금' : '빈 방'}
                        </p>
                    </div>
                )}
            </div>

            {/* 상태 인디케이터 */}
            <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[11px] text-gray-600">
                    {guestCount}/{capacity}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${statusChipClass}`}>
                    <span className="mr-1">{uiStatus.icon}</span>
                    {uiStatus.label}
                </span>
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

