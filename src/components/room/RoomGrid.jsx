import { useMemo } from 'react';
import RoomCard from './RoomCard';
import { getRoomsByFloor, floorInfo } from '../../data/roomData';

/**
 * 객실 그리드 컴포넌트 - 네이비 스타일
 */
export default function RoomGrid({
    selectedFloor,
    userGender,
    getRoomStatus,
    isMyRoom,
    onRoomClick,
    canUserSelect,
    isAdmin
}) {
    // 해당 층의 객실 가져오기
    const floorRooms = useMemo(() => {
        return getRoomsByFloor(selectedFloor);
    }, [selectedFloor]);

    // 층 정보
    const info = floorInfo[selectedFloor];

    // 객실을 위치(row, col) 기준으로 정렬
    const sortedRooms = useMemo(() => {
        return Object.entries(floorRooms).sort((a, b) => {
            const posA = a[1].position;
            const posB = b[1].position;
            if (posA.row !== posB.row) return posA.row - posB.row;
            return posA.col - posB.col;
        });
    }, [floorRooms]);

    // 행별로 그룹화
    const roomsByRow = useMemo(() => {
        const rows = {};
        for (const [roomNumber, roomData] of sortedRooms) {
            const row = roomData.position.row;
            if (!rows[row]) rows[row] = [];
            rows[row].push({ roomNumber, roomData });
        }
        return rows;
    }, [sortedRooms]);

    return (
        <div className="card-white rounded-xl p-6">
            {/* 층 헤더 */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className={`
              w-3 h-3 rounded-full
              ${info.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}
            `} />
                        {info.label}
                    </h2>
                    <p className="text-sm text-gray-500">{info.description}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">총 {Object.keys(floorRooms).length}개 객실</p>
                </div>
            </div>

            {/* 객실 그리드 */}
            <div className="space-y-4">
                {Object.entries(roomsByRow).map(([rowIndex, rooms]) => (
                    <div
                        key={rowIndex}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
                    >
                        {rooms.map(({ roomNumber, roomData }) => {
                            const status = getRoomStatus(roomNumber, userGender, isAdmin);
                            const isThisMyRoom = isMyRoom(roomNumber);
                            const canSelect = canUserSelect && status.canSelect && !isThisMyRoom;

                            return (
                                <RoomCard
                                    key={roomNumber}
                                    roomNumber={roomNumber}
                                    roomInfo={roomData}
                                    status={status}
                                    isMyRoom={isThisMyRoom}
                                    canSelect={canSelect}
                                    onClick={onRoomClick}
                                    isAdmin={isAdmin}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* 다른 성별 층일 때 안내 */}
            {info.gender !== userGender && userGender && (
                <div className="warning-box mt-6 text-center">
                    <p className="text-amber-700 font-medium">
                        ⚠️ 이 층은 {info.gender === 'M' ? '남성' : '여성'} 전용입니다.
                    </p>
                    <p className="text-sm text-amber-600 mt-1">
                        본인 성별에 맞는 층을 선택해주세요.
                    </p>
                </div>
            )}
        </div>
    );
}
