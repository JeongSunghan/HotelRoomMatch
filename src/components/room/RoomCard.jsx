/**
 * 개별 객실 카드 컴포넌트
 */
export default function RoomCard({
    roomNumber,
    roomInfo,
    status,
    isMyRoom,
    canSelect,
    onClick,
    onSingleRoomClick,  // 1인실 클릭 시 안내 모달 표시
    isAdmin
}) {
    const { guests, guestCount, capacity, roomType, roomGender, isLocked } = status;

    // 상태별 스타일 결정
    const getCardStyle = () => {
        // 내가 선택한 방
        if (isMyRoom) {
            return 'bg-emerald-50 border-2 border-emerald-500 my-room';
        }

        // 1인실 잠금 (관리자 직접 데이터 입력)
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
    };

    // 클릭 가능 여부
    const isClickable = canSelect || isAdmin || isLocked;  // 1인실도 클릭 가능 (안내 모달용)

    // 클릭 핸들러
    const handleClick = () => {
        if (isLocked) {
            // 1인실 클릭 → 안내 모달 표시
            onSingleRoomClick && onSingleRoomClick(roomNumber);
        } else if (canSelect || isAdmin) {
            // 일반 방 클릭 → 선택 모달
            onClick(roomNumber);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`
                room-card p-4 rounded-lg cursor-pointer
                ${getCardStyle()}
                ${!isClickable && 'cursor-not-allowed'}
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
                                    {guest.snoring === 'sometimes' && <span title="코골이 가끔">😪</span>}
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
                    <span className="text-xs text-gray-500 font-medium">� 잠금</span>
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
}
