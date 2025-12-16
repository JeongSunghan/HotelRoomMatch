import { floors, floorInfo } from '../../data/roomData';

/**
 * 층 선택 탭 컴포넌트 - 간소화
 */
export default function FloorSelector({ selectedFloor, onSelectFloor, userGender }) {
    return (
        <div className="flex flex-wrap gap-2 mb-6">
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
    );
}
