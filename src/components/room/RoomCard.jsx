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

    // Single/Double 색상 구분
    const roomTypeColor = useMemo(() => {
        if (capacity === 1) {
            // Single: 보라색 계열
            return {
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                text: 'text-purple-700',
                badge: 'bg-purple-100 text-purple-700'
            };
        } else {
            // Double: 초록색 계열
            return {
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                text: 'text-emerald-700',
                badge: 'bg-emerald-100 text-emerald-700'
            };
        }
    }, [capacity]);

    // 남성/여성 방 테두리 색상
    const genderBorderColor = useMemo(() => {
        if (roomGender === 'M') {
            return 'border-blue-400 border-2'; // 남성: 파란색 두꺼운 테두리
        } else if (roomGender === 'F') {
            return 'border-pink-400 border-2'; // 여성: 핑크색 두꺼운 테두리
        }
        return 'border-gray-200 border'; // 기본
    }, [roomGender]);

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
                group relative flex flex-col
                h-[220px] rounded-2xl
                p-6 transition-all duration-200
                ${roomTypeColor.bg} ${genderBorderColor}
                ${isClickable ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'}
                ${isMyRoom ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}
                ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}
            `}
        >
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className={`text-2xl font-bold ${roomTypeColor.text}`}>
                    {roomNumber}
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${roomTypeColor.badge}`}>
                    {capacity === 1 ? '1인실' : '2인실'}
                </span>
            </div>

            {/* Body (요약 → hover 시 상세) */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="flex gap-2 justify-center">
                    {Array.from({ length: capacity }).map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2.5 h-2.5 rounded-full ${
                                idx < guestCount
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
    );
});

export default RoomCard;
