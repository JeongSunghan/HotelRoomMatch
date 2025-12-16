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
    isAdmin
}) {
    const { guests, guestCount, capacity, roomType, roomGender, adminOnly } = status;

    // 상태별 스타일 결정
    const getCardStyle = () => {
        // 내가 선택한 방
        if (isMyRoom) {
            return 'bg-emerald-50 border-2 border-emerald-500 my-room';
        }

        // 1인실 관리자 전용 (빈 방)
        if (adminOnly && !isAdmin && guestCount === 0) {
            return 'bg-amber-50 border-2 border-amber-400 opacity-80';
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

    // 클릭 가능 여부 (adminOnly도 클릭 허용 - 문의 모달 표시용)
    const isClickable = canSelect || adminOnly || isAdmin;

    return (
        <div
            onClick={() => isClickable && onClick(roomNumber)}
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
                                    text-sm px-2 py-1 rounded font-medium
                                    ${guest.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                                `}
                            >
                                {guest.name}
                                {guest.company && <span className="text-xs ml-1 opacity-70">({guest.company})</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 italic">
                        {adminOnly && !isAdmin ? '관리자 배정' : '빈 방'}
                    </p>
                )}
            </div>

            {/* 상태 인디케이터 */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                    {guestCount}/{capacity}
                </span>

                {/* 1인실 관리자 전용 표시 */}
                {adminOnly && !isAdmin && guestCount === 0 && (
                    <span className="text-xs text-amber-600 font-medium">💰 결제 필요</span>
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
                {canSelect && !isMyRoom && !adminOnly && (
                    <span className="text-xs text-blue-600 font-medium">선택 가능</span>
                )}

                {/* 관리자 배정 가능 */}
                {isAdmin && adminOnly && guestCount === 0 && (
                    <span className="text-xs text-amber-600 font-medium">배정 가능</span>
                )}
            </div>
        </div>
    );
}
