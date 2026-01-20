/**
 * 플로어 미니맵 컴포넌트
 * 선택된 층의 객실 배치를 시각화
 */
import { useMemo } from 'react';
import { roomData } from '../../data/roomData';

export default function FloorMinimap({
    selectedFloor,
    roomGuests,
    userRoom,
    onRoomClick
}) {
    // 현재 층의 방 목록
    const currentFloorRooms = useMemo(() => {
        return Object.entries(roomData)
            .filter(([_, room]) => room.floor === selectedFloor)
            .map(([number, room]) => ({ number: parseInt(number), ...room }))
            .sort((a, b) => a.number - b.number);
    }, [selectedFloor]);

    // 방 상태 결정
    const getRoomStatus = (room) => {
        const guests = roomGuests[room.number] || [];
        const guestCount = guests.length;
        const capacity = room.capacity;

        // 내 방인지 확인
        const isMyRoom = userRoom === room.number;

        // 성별 확인 (첫 번째 게스트 기준)
        const gender = guests[0]?.gender || room.gender;

        // 상태 결정
        if (isMyRoom) {
            return { status: 'my-room', gender };
        } else if (guestCount === 0) {
            return { status: 'empty', gender };
        } else if (guestCount < capacity) {
            return { status: 'partial', gender };
        } else {
            return { status: 'full', gender };
        }
    };

    // 방 색상 결정
    const getRoomColor = (status, gender) => {
        if (status === 'my-room') {
            return 'bg-emerald-500 ring-2 ring-emerald-300';
        }

        const isMale = gender === 'M';

        switch (status) {
            case 'empty':
                return isMale
                    ? 'border-2 border-blue-500 bg-white'
                    : 'border-2 border-pink-500 bg-white';
            case 'partial':
                return isMale
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-pink-100 border border-pink-300';
            case 'full':
                return isMale
                    ? 'bg-blue-500'
                    : 'bg-pink-500';
            default:
                return 'bg-gray-300';
        }
    };

    // 방을 2줄로 나누기 (6개씩)
    const topRow = currentFloorRooms.slice(0, 6);
    const bottomRow = currentFloorRooms.slice(6, 12);

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-sm">
                    {selectedFloor}층 미니맵
                </h3>
                <span className="text-xs text-gray-500">
                    {selectedFloor % 2 === 0 ? '👨 남성 전용' : '👩 여성 전용'}
                </span>
            </div>

            {/* 미니맵 그리드 */}
            <div className="space-y-2">
                {/* 상단 줄 (601-606 또는 701-706) */}
                <div className="flex gap-2">
                    {topRow.map(room => {
                        const { status, gender } = getRoomStatus(room);
                        const colorClass = getRoomColor(status, gender);
                        const guests = roomGuests[room.number] || [];

                        return (
                            <button
                                key={room.number}
                                onClick={() => onRoomClick && onRoomClick(room.number)}
                                className={`
                                    flex-1 aspect-square rounded-lg relative
                                    transition-all duration-200
                                    hover:scale-110 hover:z-10
                                    ${colorClass}
                                    ${status === 'my-room' ? 'animate-pulse' : ''}
                                    group
                                `}
                                title={`${room.number}호 - ${guests.length}/${room.capacity}명`}
                            >
                                {/* 방 번호 */}
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                                    {status === 'my-room' ? '★' : room.number % 100}
                                </span>

                                {/* 호버 시 상세 정보 */}
                                <div className="
                                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                    hidden group-hover:block
                                    bg-gray-900 text-white text-xs rounded px-2 py-1
                                    whitespace-nowrap z-20
                                ">
                                    {room.number}호 ({guests.length}/{room.capacity})
                                    {guests.length > 0 && (
                                        <div className="text-[10px] mt-1">
                                            {guests.map(g => g.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* 하단 줄 (607-612 또는 707-712) */}
                <div className="flex gap-2">
                    {bottomRow.map(room => {
                        const { status, gender } = getRoomStatus(room);
                        const colorClass = getRoomColor(status, gender);
                        const guests = roomGuests[room.number] || [];

                        return (
                            <button
                                key={room.number}
                                onClick={() => onRoomClick && onRoomClick(room.number)}
                                className={`
                                    flex-1 aspect-square rounded-lg relative
                                    transition-all duration-200
                                    hover:scale-110 hover:z-10
                                    ${colorClass}
                                    ${status === 'my-room' ? 'animate-pulse' : ''}
                                    group
                                `}
                                title={`${room.number}호 - ${guests.length}/${room.capacity}명`}
                            >
                                {/* 방 번호 */}
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                                    {status === 'my-room' ? '★' : room.number % 100}
                                </span>

                                {/* 호버 시 상세 정보 */}
                                <div className="
                                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                    hidden group-hover:block
                                    bg-gray-900 text-white text-xs rounded px-2 py-1
                                    whitespace-nowrap z-20
                                ">
                                    {room.number}호 ({guests.length}/{room.capacity})
                                    {guests.length > 0 && (
                                        <div className="text-[10px] mt-1">
                                            {guests.map(g => g.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 간단한 범례 */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-500"></div>
                    <span className="text-[10px] text-gray-500">내 방</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded border-2 border-gray-400 bg-white"></div>
                    <span className="text-[10px] text-gray-500">빈 방</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-100"></div>
                    <span className="text-[10px] text-gray-500">1명</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-[10px] text-gray-500">만실</span>
                </div>
            </div>
        </div>
    );
}
