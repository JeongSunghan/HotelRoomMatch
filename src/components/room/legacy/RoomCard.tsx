/**
 * [LEGACY] 기존 RoomCard 컴포넌트
 * 백업일: 2026-01-07
 * 사유: 리메이크 버전으로 교체
 */

import { memo } from 'react';
import type { RoomInfo, RoomStatus, Guest } from '../../../types';

interface RoomCardProps {
    roomNumber: string;
    roomInfo: RoomInfo;
    status: RoomStatus;
    isMyRoom: boolean;
    canSelect: boolean;
    onClick: (roomNumber: string) => void;
    onSingleRoomClick?: (roomNumber: string) => void;  // 1인실 클릭 시 안내 모달 표시
    isAdmin: boolean;
    isHighlighted?: boolean;  // 검색 결과 하이라이트
}

/**
 * 개별 객실 카드 컴포넌트
 * React.memo로 최적화: props가 변경되지 않으면 리렌더링 방지
 */
const RoomCard = memo(function RoomCard({
    roomNumber,
    roomInfo,
    status,
    isMyRoom,
    canSelect,
    onClick,
    onSingleRoomClick,
    isAdmin,
    isHighlighted = false
}: RoomCardProps) {
    const { guests, guestCount, capacity, roomType, roomGender, isLocked } = status;

    // 상태별 스타일 결정
    const getCardStyle = (): string => {
        // 내가 선택한 방
        if (isMyRoom) {
            return 'bg-emerald-50 border-2 border-emerald-500 my-room';
        }

        // 1인실 잠금 (관리자 직접 데이터 입력)
        if (isLocked) {
            return 'bg-gray-200 border-2 border-gray-400 opacity-50 cursor-not-allowed';
        }

        // 상태별 스타일
        switch (status.status) {
            case 'empty':
                return roomGender === 'M'
                    ? 'bg-white border-2 border-blue-500 hover:border-blue-600 hover:bg-blue-50'
                    : 'bg-white border-2 border-pink-500 hover:border-pink-600 hover:bg-pink-50';

            case 'half':
                return roomGender === 'M'
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : 'bg-pink-50 border-2 border-pink-300';

            case 'full':
                return roomGender === 'M'
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-pink-100 border-2 border-pink-500';

            case 'wrong-gender':
                return 'bg-gray-100 border border-gray-300 opacity-60';

            default:
                return 'bg-white border border-gray-200';
        }
    };

    // 클릭 가능 여부
    const isClickable = canSelect || isAdmin || isLocked;  // 1인실도 클릭 가능 (안내 모달용)

    // 클릭 핸들러
    const handleClick = (): void => {
        if (isLocked) {
            // 1인실 클릭 → 안내 모달 표시
            onSingleRoomClick && onSingleRoomClick(roomNumber);
        } else if (canSelect || isAdmin) {
            // 일반 방 클릭 → 선택 모달
            onClick(roomNumber);
        }
    };

    // 키보드 네비게이션 지원
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
        }
    };

    // 접근성을 위한 ARIA 라벨 생성
    const getAriaLabel = (): string => {
        let label = `${roomNumber}호, ${roomType}, `;
        if (isLocked) {
            label += '1인실 잠금';
        } else if (isMyRoom) {
            label += '내가 배정된 방';
        } else if (status.status === 'empty') {
            label += '빈 방, 선택 가능';
        } else if (status.status === 'half') {
            label += `${guestCount}/${capacity}명, 선택 가능`;
        } else if (status.status === 'full') {
            label += '만원, 선택 불가';
        } else {
            label += '선택 불가';
        }
        return label;
    };

    return (
        <div
            role="button"
            tabIndex={isClickable ? 0 : -1}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-label={getAriaLabel()}
            aria-pressed={isMyRoom}
            className={`
                room-card p-3 sm:p-4 rounded-lg transition-all
                ${getCardStyle()}
                ${isClickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800' : 'cursor-not-allowed'}
                ${isHighlighted && 'ring-4 ring-yellow-400 ring-offset-2 animate-pulse shadow-lg shadow-yellow-200'}
                hover:scale-[1.02] active:scale-[0.98]
            `}
        >
            {/* 방 번호 */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-800">{roomNumber}</span>
                {/* 타입 배지 */}
                <span className={`
                    text-xs px-2 py-0.5 rounded-full font-medium
                    ${capacity === 2 ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}
                `}>
                    {capacity === 2 ? '2인실' : '1인실'}
                </span>
            </div>

            {/* 객실 타입 */}
            <p className="text-xs text-gray-500 mb-2">{roomType}</p>

            {/* 투숙객 목록 */}
            <div className="min-h-[2.5rem]">
                {guests.length > 0 ? (
                    <div className="space-y-1">
                        {guests.map((guest: Guest, idx: number) => (
                            <div
                                key={idx}
                                className={`
                                    text-sm px-2 py-1 rounded font-medium flex items-center justify-between
                                    ${guest.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                                `}
                            >
                                <span>
                                    {guest.name}
                                    {guest.company && <span className="text-xs ml-1 opacity-70">({guest.company})</span>}
                                </span>
                                <div className="flex items-center gap-1">
                                    {/* 코골이 상태 표시 */}
                                    {guest.snoring === 'yes' && <span title="코골이 심함">😫</span>}
                                    {guest.snoring === 'sometimes' && <span title="코골이 가끔">😪</span>}
                                    {guest.snoring === 'no' && <span title="코골이 없음">😴</span>}

                                    {guest.age && (
                                        <span className="text-xs bg-white/50 px-1.5 py-0.5 rounded">{guest.age}세</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 italic">
                        {isLocked ? '1인실 (잠금)' : '빈 방'}
                    </p>
                )}
            </div>

            {/* 상태 인디케이터 */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                    {guestCount}/{capacity}
                </span>

                {/* 1인실 잠금 표시 */}
                {isLocked && (
                    <span className="text-xs text-gray-500 font-medium">🔒 잠금</span>
                )}

                {/* 선택 불가 표시 */}
                {status.status === 'wrong-gender' && (
                    <span className="text-sm text-gray-500">🔒</span>
                )}

                {/* 내 방 표시 */}
                {isMyRoom && (
                    <span className="text-xs text-emerald-600 font-medium">✓ 내 방</span>
                )}

                {/* 선택 가능 표시 */}
                {canSelect && !isMyRoom && !isLocked && (
                    <span className="text-xs text-blue-600 font-medium">선택 가능</span>
                )}
            </div>
        </div>
    );
});

// props 비교 함수 (얕은 비교로 충분)
RoomCard.displayName = 'RoomCard';

export default RoomCard;

