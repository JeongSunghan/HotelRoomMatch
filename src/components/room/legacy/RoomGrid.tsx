/**
 * [LEGACY] 기존 RoomGrid 컴포넌트
 * 백업일: 2026-01-07
 * 사유: 리메이크 버전으로 교체
 */

import { useMemo } from 'react';
import RoomCard from './RoomCard';
import Skeleton from '../../ui/Skeleton';
import { getRoomsByFloor, floorInfo } from '../../../data/roomData';
import type { Gender, RoomStatus, RoomInfo } from '../../../types';

interface FloorInfo {
    label: string;
    description: string;
    gender: Gender;
}

interface RoomGridProps {
    selectedFloor: string | number;
    userGender: Gender | null | undefined;
    getRoomStatus: (roomNumber: string, userGender: Gender | null, isAdmin: boolean) => RoomStatus;
    isMyRoom: (roomNumber: string) => boolean;
    onRoomClick: (roomNumber: string) => void;
    onSingleRoomClick?: (roomNumber: string) => void;
    canUserSelect: boolean;
    isAdmin: boolean;
    roomTypeFilter?: 'all' | 'twin' | 'single';
    highlightedRoom?: string | null;
    isLoading?: boolean;
}

export default function RoomGrid({
    selectedFloor,
    userGender,
    getRoomStatus,
    isMyRoom,
    onRoomClick,
    onSingleRoomClick,
    canUserSelect,
    isAdmin,
    roomTypeFilter = 'all',
    highlightedRoom = null,
    isLoading = false
}: RoomGridProps) {
    const floorRooms = useMemo(() => {
        return getRoomsByFloor(selectedFloor) as Record<string, RoomInfo>;
    }, [selectedFloor]);

    const info = floorInfo[selectedFloor as keyof typeof floorInfo] as FloorInfo | undefined;

    const sortedRooms = useMemo(() => {
        return Object.entries(floorRooms)
            .filter(([, roomData]) => {
                if (roomTypeFilter === 'twin') return roomData.capacity === 2;
                if (roomTypeFilter === 'single') return roomData.capacity === 1;
                return true;
            })
            .sort((a, b) => {
                const posA = a[1].position;
                const posB = b[1].position;
                if (posA.row !== posB.row) return posA.row - posB.row;
                return posA.col - posB.col;
            });
    }, [floorRooms, roomTypeFilter]);

    const roomsByRow = useMemo(() => {
        const rows: Record<number, Array<{ roomNumber: string; roomData: RoomInfo }>> = {};
        for (const [roomNumber, roomData] of sortedRooms) {
            const row = roomData.position.row;
            if (!rows[row]) rows[row] = [];
            rows[row].push({ roomNumber, roomData });
        }
        return rows;
    }, [sortedRooms]);

    if (!info) {
        return (
            <div className="card-white rounded-xl p-6">
                <p className="text-gray-500 dark:text-gray-400">층 정보를 찾을 수 없습니다.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="card-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                        <Skeleton variant="text" width="200px" height={28} className="mb-2" />
                        <Skeleton variant="text" width="150px" height={16} />
                    </div>
                    <Skeleton variant="text" width="100px" height={16} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Array.from({ length: 12 }).map((_, idx) => (
                        <Skeleton key={idx} variant="card" height={180} animation="pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="card-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${info.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}`} aria-hidden="true" />
                        {info.label}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{info.description}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">총 {Object.keys(floorRooms).length}개 객실</p>
                </div>
            </div>

            {sortedRooms.length > 0 ? (
                <div className="space-y-4">
                    {Object.entries(roomsByRow).map(([rowIndex, rooms]) => (
                        <div key={rowIndex} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {rooms.map(({ roomNumber, roomData }) => {
                                const status = getRoomStatus(roomNumber, userGender || null, isAdmin);
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
                                        onSingleRoomClick={onSingleRoomClick}
                                        isAdmin={isAdmin}
                                        isHighlighted={highlightedRoom === roomNumber}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {roomTypeFilter === 'twin' && '해당 층에는 2인실이 존재하지 않습니다.'}
                        {roomTypeFilter === 'single' && '해당 층에는 1인실이 존재하지 않습니다.'}
                        {roomTypeFilter === 'all' && '표시할 객실이 없습니다.'}
                    </p>
                </div>
            )}

            {info.gender !== userGender && userGender && (
                <div className="warning-box mt-6 text-center">
                    <p className="text-amber-700 dark:text-amber-400 font-medium">
                        ⚠️ 이 층은 {info.gender === 'M' ? '남성' : '여성'} 전용입니다.
                    </p>
                </div>
            )}
        </div>
    );
}

