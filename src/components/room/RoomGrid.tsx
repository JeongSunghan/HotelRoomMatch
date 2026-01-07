/**
 * RoomGrid 컴포넌트 - 벤토 그리드 레이아웃
 * 디자인: 밀도 높은 카드 그리드 시스템
 * 
 * [업데이트] 2026-01-07 - 리메이크 버전으로 교체
 * 기존 버전: legacy/RoomGrid.tsx
 */

import { useMemo } from 'react';
import RoomCard from './RoomCard';
import Skeleton from '../ui/Skeleton';
import { getRoomsByFloor, floorInfo } from '../../data/roomData';
import type { Gender, RoomStatus, RoomInfo } from '../../types';

interface FloorInfo {
    label: string;
    description: string;
    gender: Gender;
    floor?: number;
    name?: string;
    roomCount?: number;
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

/**
 * 벤토 그리드 기반 RoomGrid
 */
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
    // 해당 층의 객실 가져오기
    const floorRooms = useMemo(() => {
        return getRoomsByFloor(selectedFloor) as Record<string, RoomInfo>;
    }, [selectedFloor]);

    // 층 정보
    const info = floorInfo[selectedFloor as keyof typeof floorInfo] as FloorInfo | undefined;

    // 객실을 위치(row, col) 기준으로 정렬 + 필터링
    const sortedRooms = useMemo(() => {
        return Object.entries(floorRooms)
            .filter(([, roomData]) => {
                // 필터 적용
                if (roomTypeFilter === 'twin') return roomData.capacity === 2;
                if (roomTypeFilter === 'single') return roomData.capacity === 1;
                return true; // 'all'
            })
            .sort((a, b) => {
                const posA = a[1].position;
                const posB = b[1].position;
                if (posA.row !== posB.row) return posA.row - posB.row;
                return posA.col - posB.col;
            });
    }, [floorRooms, roomTypeFilter]);

    // 행별로 그룹화
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
            <div className="flex items-center justify-center p-12 text-gray-400">
                <p>층 정보를 찾을 수 없습니다.</p>
            </div>
        );
    }

    // 로딩 중 스켈레톤 UI
    if (isLoading) {
        return (
            <div className="bg-gray-900 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <div className="flex-1">
                        <Skeleton variant="text" width="200px" height={28} className="mb-2" />
                        <Skeleton variant="text" width="150px" height={16} />
                    </div>
                    <Skeleton variant="text" width="100px" height={16} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, idx) => (
                        <Skeleton key={idx} variant="card" height={180} animation="pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (sortedRooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-gray-900 rounded-xl">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <p className="text-lg font-medium">필터 조건에 맞는 객실이 없습니다</p>
                <p className="text-sm mt-1">다른 필터를 선택해보세요</p>
            </div>
        );
    }

    // 층 번호 추출
    const floorNumber = info.floor ?? (typeof selectedFloor === 'number' ? selectedFloor : parseInt(String(selectedFloor), 10));

    return (
        <div className="w-full">
            {/* 층 정보 헤더 (컴팩트, 다크 모드) */}
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-white">
                            {floorNumber}F
                        </span>
                        <div className="h-8 w-px bg-gray-600"></div>
                        <div className="text-sm">
                            <p className="text-gray-300 font-medium">{info.name || info.label}</p>
                            <p className="text-gray-500 text-xs">총 {sortedRooms.length}개 객실</p>
                        </div>
                    </div>
                    
                    {/* 성별 뱃지 */}
                    <div className="flex items-center gap-2">
                        <span className={`
                            px-3 py-1 text-xs font-semibold rounded-full border
                            ${info.gender === 'M' 
                                ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' 
                                : 'bg-pink-500/20 text-pink-300 border-pink-400/30'}
                        `}>
                            {info.gender === 'M' ? '남성' : '여성'} 전용
                        </span>
                    </div>
                </div>
            </div>

            {/* 벤토 그리드 - 밀도 높은 카드 배열 */}
            <div className="space-y-8">
                {Object.keys(roomsByRow).map((row) => {
                    const rowRooms = roomsByRow[Number(row)];
                    
                    return (
                        <div key={row} className="animate-fade-in">
                            {/* 행 구분선 (옵션) */}
                            {Number(row) > 1 && (
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-6"></div>
                            )}

                            {/* CSS Grid - 밀도 높은 배열 */}
                            <div 
                                className="grid gap-4"
                                style={{
                                    // 카드 최소 너비 140px
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'
                                }}
                            >
                                {rowRooms.map(({ roomNumber, roomData }) => {
                                    const roomStatus = getRoomStatus(roomNumber, userGender || null, isAdmin);
                                    const isMyRoomStatus = isMyRoom(roomNumber);
                                    const canSelect = canUserSelect && roomStatus.canSelect && !isMyRoomStatus;

                                    return (
                                        <RoomCard
                                            key={roomNumber}
                                            roomNumber={roomNumber}
                                            roomInfo={roomData}
                                            status={roomStatus}
                                            isMyRoom={isMyRoomStatus}
                                            canSelect={canSelect}
                                            onClick={onRoomClick}
                                            onSingleRoomClick={onSingleRoomClick}
                                            isAdmin={isAdmin}
                                            isHighlighted={highlightedRoom === roomNumber}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 다른 성별 층일 때 안내 */}
            {info.gender !== userGender && userGender && (
                <div className="mt-6 p-4 bg-amber-900/30 border border-amber-500/30 rounded-lg text-center">
                    <p className="text-amber-400 font-medium">
                        ⚠️ 이 층은 {info.gender === 'M' ? '남성' : '여성'} 전용입니다.
                    </p>
                    <p className="text-sm text-amber-500/80 mt-1">
                        본인 성별에 맞는 층을 선택해주세요.
                    </p>
                </div>
            )}

            {/* 그리드 하단 여백 */}
            <div className="h-8"></div>
        </div>
    );
}

