import { floors, floorInfo } from '../../data/roomData';
import type { Gender } from '../../types';

type RoomTypeFilter = 'all' | 'twin' | 'single';

interface FloorSelectorProps {
    selectedFloor: number;
    onSelectFloor: (floor: number) => void;
    userGender: Gender | null;
    roomTypeFilter: RoomTypeFilter;
    onRoomTypeFilterChange: (filter: RoomTypeFilter) => void;
}

/**
 * 층 선택 탭 컴포넌트 - 1인실/2인실 필터 포함
 */
export default function FloorSelector({
    selectedFloor,
    onSelectFloor,
    userGender,
    roomTypeFilter,
    onRoomTypeFilterChange
}: FloorSelectorProps) {
    return (
        <div className="space-y-4 mb-6">
            {/* 객실 타입 필터 */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">객실 타입:</span>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => onRoomTypeFilterChange('all')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${roomTypeFilter === 'all'
                            ? 'bg-white text-gray-800 shadow'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        전체
                    </button>
                    <button
                        onClick={() => onRoomTypeFilterChange('twin')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${roomTypeFilter === 'twin'
                            ? 'bg-purple-500 text-white shadow'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        2인실
                    </button>
                    <button
                        onClick={() => onRoomTypeFilterChange('single')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${roomTypeFilter === 'single'
                            ? 'bg-amber-500 text-white shadow'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        1인실
                    </button>
                </div>
            </div>

            {/* 층 선택 탭 */}
            <div className="flex flex-wrap gap-2">
                {floors.map(floor => {
                    const info = floorInfo[floor];
                    const isSelected = selectedFloor === floor;
                    const isUserGender = info.gender === userGender;

                    return (
                        <button
                            key={floor}
                            onClick={() => onSelectFloor(floor)}
                            className={`
                                floor-tab px-5 py-3 rounded-lg font-medium transition-all
                                ${isSelected ? 'active' : ''}
                                ${!isUserGender && !isSelected ? 'opacity-70' : ''}
                            `}
                        >
                            <div className="flex items-center gap-2">
                                {/* 성별 인디케이터 */}
                                <div className={`
                                    w-2.5 h-2.5 rounded-full
                                    ${info.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}
                                    ${!isUserGender && !isSelected ? 'opacity-60' : ''}
                                `} />
                                <span className="text-base font-semibold">{info.label}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}


