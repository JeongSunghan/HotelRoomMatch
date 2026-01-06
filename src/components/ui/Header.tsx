import { memo, useCallback } from 'react';
import { getGenderLabel } from '../../utils/genderUtils';
import { ThemeToggle } from '../../hooks/useTheme';
import type { User } from '../../types';

interface Stats {
    male?: {
        occupiedSlots: number;
        availableSlots: number;
    };
    female?: {
        occupiedSlots: number;
        availableSlots: number;
    };
}

interface HeaderProps {
    user: User | null;
    stats?: Stats | null;
    onUserClick?: () => void;
}

/**
 * 헤더 컴포넌트 - 화이트 스타일 (수정됨)
 * React.memo로 최적화: props가 변경되지 않으면 리렌더링 방지
 */
const Header = memo(function Header({ user, stats, onUserClick }: HeaderProps) {
    // 사용자 클릭 핸들러 메모이제이션
    const handleUserClick = useCallback(() => {
        onUserClick?.();
    }, [onUserClick]);
    return (
        <header className="card-white rounded-xl p-6 mb-6">
            {/* 타이틀 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold gradient-text">
                            V-Up 호텔 객실 배정
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            KVCA 벤처투자 전문인력 양성(V-Up)
                        </p>
                    </div>
                    <ThemeToggle />
                </div>

                {/* 사용자 정보 - 개선된 UI */}
                {user && (
                    <button
                        onClick={handleUserClick}
                        disabled={!user.locked}
                        aria-label={`${user.name}님의 객실 정보 보기`}
                        aria-disabled={!user.locked}
                        className={`
                            flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border-2 transition-all
                            ${user.gender === 'M'
                                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 hover:border-blue-400 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-700'
                                : 'bg-gradient-to-r from-pink-50 to-pink-100 border-pink-300 hover:border-pink-400 dark:from-pink-900/20 dark:to-pink-800/20 dark:border-pink-700'}
                            ${user.locked ? 'cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800' : 'cursor-default opacity-60'}
                            min-h-[44px] touch-manipulation
                        `}
                    >
                        {/* 아바타 */}
                        <div className={`
                            w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold text-white
                            ${user.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}
                        `} aria-hidden="true">
                            {user.gender === 'M' ? '♂' : '♀'}
                        </div>

                        {/* 정보 */}
                        <div className="text-left">
                            <p className="font-bold text-gray-800 dark:text-gray-100 text-base sm:text-lg">{user.name}</p>
                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.gender === 'M' ? 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200' : 'bg-pink-200 text-pink-700 dark:bg-pink-800 dark:text-pink-200'
                                    }`}>
                                    {getGenderLabel(user.gender)}
                                </span>
                                {user.age && (
                                    <span className="text-gray-500 dark:text-gray-400">{user.age}세</span>
                                )}
                                {user.locked && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {user.selectedRoom}호</span>
                                )}
                            </div>
                        </div>

                        {/* 화살표 */}
                        {user.locked && (
                            <span className="text-gray-400 ml-2">▶</span>
                        )}
                    </button>
                )}
            </div>

            {/* 범례 */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700" role="region" aria-label="객실 상태 범례">
                <div className="legend-item">
                    <div className="legend-color border-2 border-blue-500 bg-white" />
                    <span className="text-gray-600">남성 빈 방</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color border-2 border-pink-500 bg-white" />
                    <span className="text-gray-600">여성 빈 방</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color bg-blue-100 border border-blue-300" />
                    <span className="text-gray-600">남성 1명 (2인실)</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color bg-pink-100 border border-pink-300" />
                    <span className="text-gray-600">여성 1명 (2인실)</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color bg-blue-500" />
                    <span className="text-gray-600">남성 배정완료</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color bg-pink-500" />
                    <span className="text-gray-600">여성 배정완료</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color bg-emerald-500 ring-2 ring-emerald-300" />
                    <span className="text-gray-600">내 방</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color bg-gray-300" />
                    <span className="text-gray-600">1인실 (잠금)</span>
                </div>
            </div>

            {/* 통계 */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-blue-600">{stats.male?.occupiedSlots || 0}</p>
                        <p className="text-xs text-gray-500">남성 배정</p>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-blue-400">{stats.male?.availableSlots || 0}</p>
                        <p className="text-xs text-gray-500">남성 잔여</p>
                    </div>
                    <div className="bg-pink-50 border border-pink-100 rounded-lg p-3 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-pink-600">{stats.female?.occupiedSlots || 0}</p>
                        <p className="text-xs text-gray-500">여성 배정</p>
                    </div>
                    <div className="bg-pink-50/50 border border-pink-100 rounded-lg p-3 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-pink-400">{stats.female?.availableSlots || 0}</p>
                        <p className="text-xs text-gray-500">여성 잔여</p>
                    </div>
                </div>
            )}
        </header>
    );
});

Header.displayName = 'Header';

export default Header;
