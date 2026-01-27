import { useMemo, useCallback } from 'react';
import RoomCard from './RoomCard';
import { getRoomsByFloor, floorInfo } from '../../data/roomData';

export default function RoomGrid({
    selectedFloor,
    userGender,
    canSelectSingleRoom = false,
    mySessionId = null,
    getRoomStatus,
    isMyRoom,
    onRoomClick,
    onSingleRoomClick,
    canUserSelect,
    isAdmin,
    roomTypeFilter = 'all',
    highlightedRoom = null
}) {
    const floorRooms = useMemo(() => getRoomsByFloor(selectedFloor), [selectedFloor]);
    const info = floorInfo[selectedFloor];

    const sortedRooms = useMemo(() => {
        return Object.entries(floorRooms)
            .filter(([, roomData]) => {
                if (roomTypeFilter === 'twin') return roomData.capacity === 2;
                if (roomTypeFilter === 'single') return roomData.capacity === 1;
                return true;
            })
            .sort((a, b) => {
                const A = a[1].position;
                const B = b[1].position;
                return A.row !== B.row ? A.row - B.row : A.col - B.col;
            });
    }, [floorRooms, roomTypeFilter]);

    const handleRoomClick = useCallback((roomNumber) => {
        onRoomClick(roomNumber);
    }, [onRoomClick]);

    return (
        <div className="bg-white rounded-xl p-10 border border-gray-100">
            {/* Header */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-800">
                    {info.label}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {info.description}
                </p>
            </div>

            {/* Grid - 5열 고정 레이아웃 */}
            <div className="grid grid-cols-5 gap-6">
                {sortedRooms.map(([roomNumber]) => {
                    const status = getRoomStatus(
                        roomNumber,
                        userGender,
                        isAdmin,
                        canSelectSingleRoom,
                        mySessionId
                    );

                    const canSelect =
                        canUserSelect && status.canSelect && !isMyRoom(roomNumber);

                    return (
                        <RoomCard
                            key={roomNumber}
                            roomNumber={roomNumber}
                            status={status}
                            isMyRoom={isMyRoom(roomNumber)}
                            canSelect={canSelect}
                            onClick={handleRoomClick}
                            onSingleRoomClick={onSingleRoomClick}
                            isAdmin={isAdmin}
                            isHighlighted={highlightedRoom === roomNumber}
                        />
                    );
                })}
            </div>
        </div>
    );
}
