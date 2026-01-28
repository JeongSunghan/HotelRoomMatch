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
        <div className="bg-white rounded-xl p-4 md:p-10 border border-gray-100">
            {/* Header */}
            <div className="mb-4 md:mb-10">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                    {info.label}
                </h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                    {info.description}
                </p>
            </div>

            {/* 모바일: 리스트 형태 (가로형) */}
            <div className="flex flex-col gap-2 md:hidden">
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

            {/* 데스크톱: Grid - 5열 고정 레이아웃 */}
            <div className="hidden md:grid md:grid-cols-5 md:gap-6">
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
