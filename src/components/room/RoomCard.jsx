import { memo, useMemo, useCallback } from 'react';

const RoomCard = memo(function RoomCard({
    roomNumber,
    status,
    isMyRoom,
    canSelect,
    onClick,
    onSingleRoomClick,
    isAdmin,
    isHighlighted = false
}) {
    const { guests, guestCount, capacity, roomGender, isLocked } = status;

    const uiStatus = useMemo(() => {
        if (status.status === 'pending') {
            return { label: '수락대기', text: 'text-purple-600' };
        }
        if (status.status === 'reserved') {
            return { label: '예약중', text: 'text-amber-600' };
        }
        if (isMyRoom) {
            return { label: '나의 방', text: 'text-emerald-600' };
        }
        if (status.status === 'full' || guestCount >= capacity) {
            return { label: '배정 완료', text: 'text-slate-400' };
        }
        if (isLocked || status.status === 'wrong-gender') {
            return { label: '선택 불가', text: 'text-gray-400' };
        }
        if (canSelect || isAdmin) {
            return { label: '선택 가능', text: roomGender === 'M' ? 'text-blue-600' : 'text-pink-600' };
        }
        return { label: '대기', text: 'text-slate-400' };
    }, [status.status, guestCount, capacity, isLocked, canSelect, isAdmin, roomGender, isMyRoom]);

    const isClickable = canSelect || isAdmin || isLocked || status.status === 'reserved' || status.status === 'pending';

    const handleClick = useCallback(() => {
        if (isLocked) onSingleRoomClick?.(roomNumber);
        else if (isClickable) onClick(roomNumber);
    }, [isLocked, isClickable, onClick, onSingleRoomClick, roomNumber]);

    return (
        <div
            onClick={handleClick}
            role="button"
            tabIndex={isClickable ? 0 : -1}
            className={`
                group relative
                rounded-2xl border border-gray-100 bg-white
                transition-all duration-200
                ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : 'opacity-60 cursor-not-allowed'}
                ${isMyRoom ? 'ring-2 ring-emerald-300' : ''}
                ${isHighlighted ? 'ring-4 ring-yellow-300' : ''}
                /* 모바일: 가로형 리스트 */
                flex flex-row items-center gap-3 px-4 py-3
                /* 데스크톱: 세로형 카드 */
                md:flex-col md:h-[220px] md:p-6
            `}
        >
            {/* 모바일: 가로형 레이아웃 */}
            <div className="flex flex-row items-center gap-3 flex-1 md:hidden">
                {/* 객실 번호 */}
                <div className="flex-shrink-0 w-16">
                    <h3 className="text-lg font-bold text-gray-800">
                        {roomNumber}
                    </h3>
                </div>

                {/* 타입 */}
                <div className="flex-shrink-0 w-16">
                    <span
                        className={`text-xs font-semibold ${capacity === 1 ? 'text-yellow-400' : 'text-purple-400'}`}
                    >
                        {capacity === 1 ? 'SINGLE' : 'DOUBLE'}
                    </span>
                </div>

                {/* 게스트 정보 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {Array.from({ length: capacity }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full ${idx < guestCount
                                        ? roomGender === 'M'
                                            ? 'bg-blue-500'
                                            : 'bg-pink-500'
                                        : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                        {guests.length > 0 
                            ? guests.map(g => g.name || '입실자').join(', ')
                            : '빈 객실'
                        }
                    </div>
                </div>

                {/* 상태 */}
                <div className="flex-shrink-0 w-20 text-right">
                    <span className={`text-xs font-semibold ${uiStatus.text}`}>
                        {uiStatus.label}
                    </span>
                </div>
            </div>

            {/* 데스크톱: 세로형 레이아웃 */}
            <div className="hidden md:flex md:flex-col md:w-full md:h-full">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800">
                        {roomNumber}
                    </h3>
                    <span
                        className={`text-sm font-semibold pl-1 ${capacity === 1 ? 'text-yellow-400' : 'text-purple-400'
                            }`}
                    >
                        {capacity === 1 ? 'SINGLE' : 'DOUBLE'}
                    </span>
                </div>

                {/* Body (요약 → hover 시 상세) */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex gap-2 justify-center">
                        {Array.from({ length: capacity }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2.5 h-2.5 rounded-full ${idx < guestCount
                                        ? roomGender === 'M'
                                            ? 'bg-blue-500'
                                            : 'bg-pink-500'
                                        : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* 게스트 상세 (hover 시 노출) */}
                    <div className="mt-4 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {guests.map((guest, idx) => (
                            <div key={idx} className="text-sm text-gray-600 truncate text-center">
                                {guest.name || '입실자'}
                            </div>
                        ))}
                        {guests.length === 0 && (
                            <div className="text-sm text-gray-300 text-center">빈 객실</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-center">
                    <span className={`text-xs font-semibold ${uiStatus.text}`}>
                        {uiStatus.label}
                    </span>
                </div>
            </div>
        </div>
    );
});

export default RoomCard;
