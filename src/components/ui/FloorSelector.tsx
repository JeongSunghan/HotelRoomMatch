import { memo, useCallback } from 'react';
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
 * React.memo로 최적화: props가 변경되지 않으면 리렌더링 방지
 */
const FloorSelector = memo(function FloorSelector({
    selectedFloor,
    onSelectFloor,
    userGender,
    roomTypeFilter,
    onRoomTypeFilterChange
}: FloorSelectorProps) {
    // 핸들러 메모이제이션
    const handleAllFilter = useCallback(() => onRoomTypeFilterChange('all'), [onRoomTypeFilterChange]);
    const handleTwinFilter = useCallback(() => onRoomTypeFilterChange('twin'), [onRoomTypeFilterChange]);
    const handleSingleFilter = useCallback(() => onRoomTypeFilterChange('single'), [onRoomTypeFilterChange]);
    
    return (
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {/* 객실 타입 필터 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">객실 타입:</span>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg" role="group" aria-label="객실 타입 필터">
                    <button
                        onClick={handleAllFilter}
                        aria-pressed={roomTypeFilter === 'all'}
                        aria-label="전체 객실 보기"
                        className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[36px] ${roomTypeFilter === 'all'
                            ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        전체
                    </button>
                    <button
                        onClick={handleTwinFilter}
                        aria-pressed={roomTypeFilter === 'twin'}
                        aria-label="2인실만 보기"
                        className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[36px] ${roomTypeFilter === 'twin'
                            ? 'bg-purple-500 text-white shadow'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        2인실
                    </button>
                    <button
                        onClick={handleSingleFilter}
                        aria-pressed={roomTypeFilter === 'single'}
                        aria-label="1인실만 보기"
                        className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[36px] ${roomTypeFilter === 'single'
                            ? 'bg-amber-500 text-white shadow'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        1인실
                    </button>
                </div>
            </div>

            {/* 층 선택 탭 */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="층 선택">
                {floors.map(floor => {
                    const info = floorInfo[floor];
                    const isSelected = selectedFloor === floor;
                    const isUserGender = info.gender === userGender;

                    return (
                        <button
                            key={floor}
                            role="tab"
                            aria-selected={isSelected}
                            aria-controls={`floor-${floor}-panel`}
                            onClick={() => onSelectFloor(floor)}
                            aria-label={`${info.label} 선택`}
                            className={`
                                floor-tab px-3 sm:px-4 md:px-5 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                                ${isSelected ? 'active' : ''}
                                ${!isUserGender && !isSelected ? 'opacity-70' : ''}
                                min-h-[40px] touch-manipulation
                            `}
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {/* 성별 인디케이터 */}
                                <div className={`
                                    w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full
                                    ${info.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}
                                    ${!isUserGender && !isSelected ? 'opacity-60' : ''}
                                `} aria-hidden="true" />
                                <span className="font-semibold whitespace-nowrap">{info.label}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

FloorSelector.displayName = 'FloorSelector';

export default FloorSelector;
