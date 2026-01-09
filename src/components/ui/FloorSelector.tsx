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
 * 층 선택 탭 컴포넌트 - 라이트 모드 스타일
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
        <div className="space-y-4 mb-6">
            {/* 객실 타입 필터 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">객실 타입:</span>
                <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl" role="group" aria-label="객실 타입 필터">
                    <button
                        onClick={handleAllFilter}
                        aria-pressed={roomTypeFilter === 'all'}
                        aria-label="전체 객실 보기"
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            min-h-[40px]
                            ${roomTypeFilter === 'all'
                                ? 'bg-white text-gray-800 shadow-md'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}
                        `}
                    >
                        전체
                    </button>
                    <button
                        onClick={handleTwinFilter}
                        aria-pressed={roomTypeFilter === 'twin'}
                        aria-label="2인실만 보기"
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                            min-h-[40px]
                            ${roomTypeFilter === 'twin'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}
                        `}
                    >
                        2인실
                    </button>
                    <button
                        onClick={handleSingleFilter}
                        aria-pressed={roomTypeFilter === 'single'}
                        aria-label="1인실만 보기"
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                            min-h-[40px]
                            ${roomTypeFilter === 'single'
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}
                        `}
                    >
                        1인실
                    </button>
                </div>
            </div>

            {/* 층 선택 탭 */}
            <div className="flex flex-wrap gap-3" role="tablist" aria-label="층 선택">
                {floors.map(floor => {
                    const info = floorInfo[floor];
                    const isSelected = selectedFloor === floor;
                    const isUserGender = info.gender === userGender;
                    const genderColor = info.gender === 'M' ? 'blue' : 'pink';

                    return (
                        <button
                            key={floor}
                            role="tab"
                            aria-selected={isSelected}
                            aria-controls={`floor-${floor}-panel`}
                            onClick={() => onSelectFloor(floor)}
                            aria-label={`${info.label} 선택`}
                            className={`
                                px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                                focus:outline-none focus:ring-2 focus:ring-offset-2
                                min-h-[48px] touch-manipulation shadow-sm
                                ${isSelected 
                                    ? genderColor === 'blue'
                                        ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                                        : 'bg-pink-600 text-white shadow-lg ring-2 ring-pink-300'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                }
                                ${!isUserGender && !isSelected ? 'opacity-60' : ''}
                            `}
                        >
                            <div className="flex items-center gap-2">
                                {/* 성별 인디케이터 */}
                                <div className={`
                                    w-2.5 h-2.5 rounded-full
                                    ${isSelected 
                                        ? 'bg-white' 
                                        : genderColor === 'blue' ? 'bg-blue-500' : 'bg-pink-500'}
                                `} aria-hidden="true" />
                                <span className="whitespace-nowrap">{info.label}</span>
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
