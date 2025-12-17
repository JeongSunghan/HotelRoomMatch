import { getGenderLabel } from '../../utils/genderUtils';

/**
 * 객실 관리 탭 컴포넌트
 */
export default function RoomManagementTab({
    assignedRooms,
    onRemoveGuest
}) {
    if (assignedRooms.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>검색 결과가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {assignedRooms.map(room => (
                <div
                    key={room.roomNumber}
                    className={`
                        p-4 rounded-lg border bg-white transition-colors
                        ${room.isFull
                            ? room.gender === 'M'
                                ? 'border-blue-300'
                                : 'border-pink-300'
                            : room.guests.length > 0
                                ? 'border-gray-300'
                                : 'border-gray-200'
                        }
                    `}
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`
                                w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white
                                ${room.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}
                            `}>
                                {room.roomNumber}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-800">{room.floor}층</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500 text-sm">{room.roomType}</span>
                                    <span className={`
                                        text-xs px-2 py-0.5 rounded-full font-medium
                                        ${room.capacity === 2 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}
                                    `}>
                                        {room.capacity === 2 ? '2인실' : '1인실'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {getGenderLabel(room.gender)} 전용 • {room.guests.length}/{room.capacity} 배정
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {room.guests.length === 0 ? (
                                <span className="text-gray-400 text-sm italic">빈 방</span>
                            ) : (
                                room.guests.map((guest, idx) => (
                                    <div
                                        key={idx}
                                        className={`
                                            flex items-center gap-2 px-3 py-1.5 rounded-lg
                                            ${guest.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                                        `}
                                    >
                                        <div>
                                            <span className="font-medium">{guest.name}</span>
                                            {guest.company && (
                                                <span className="text-xs ml-1 opacity-70">({guest.company})</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onRemoveGuest(room.roomNumber, guest.sessionId, guest.name)}
                                            className="p-1 hover:bg-red-100 rounded transition-colors"
                                            title="삭제"
                                        >
                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
