/**
 * Header 컴포넌트 - 벤토 그리드 대시보드
 * 디자인: 컴팩트한 모듈형 헤더
 * 
 * [업데이트] 2026-01-07 - 리메이크 버전으로 교체
 * 기존 버전: legacy/Header.tsx
 */

import { memo, useCallback } from 'react';
import { getGenderLabel } from '../../utils/genderUtils';
import { ThemeToggle } from '../../hooks/useTheme';
import type { User } from '../../types';

interface Stats {
    male?: {
        occupiedSlots: number;
        availableSlots: number;
        totalCapacity?: number;
        occupancyRate?: number;
    };
    female?: {
        occupiedSlots: number;
        availableSlots: number;
        totalCapacity?: number;
        occupancyRate?: number;
    };
}

interface HeaderProps {
    user: User | null;
    stats?: Stats | null;
    onUserClick?: () => void;
}

/**
 * 벤토 그리드 기반 컴팩트 헤더
 */
const Header = memo(function Header({ user, stats, onUserClick }: HeaderProps) {
    const hasRoom = user?.selectedRoom;

    const handleUserClick = useCallback(() => {
        onUserClick?.();
    }, [onUserClick]);

    // 점유율 계산
    const getMaleOccupancyRate = (): number => {
        if (!stats?.male) return 0;
        const total = stats.male.totalCapacity || (stats.male.occupiedSlots + stats.male.availableSlots);
        return total > 0 ? (stats.male.occupiedSlots / total) * 100 : 0;
    };

    const getFemaleOccupancyRate = (): number => {
        if (!stats?.female) return 0;
        const total = stats.female.totalCapacity || (stats.female.occupiedSlots + stats.female.availableSlots);
        return total > 0 ? (stats.female.occupiedSlots / total) * 100 : 0;
    };

    return (
        <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 shadow-xl">
            <div className="container mx-auto px-4 py-4">
                {/* 타이틀 + 테마 토글 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl md:text-2xl font-bold text-white">
                            V-Up 호텔 객실 배정
                        </h1>
                        <ThemeToggle />
                    </div>
                </div>

                {/* 벤토 그리드 레이아웃 - 균일한 높이 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    {/* 좌측: 내 방 티켓 모듈 (lg:col-span-4) */}
                    <div 
                        className={`
                            lg:col-span-4 
                            rounded-xl p-4
                            border-2 transition-all duration-300
                            flex items-center
                            min-h-[88px]
                            ${hasRoom 
                                ? 'bg-gradient-to-br from-lime-500/10 to-lime-600/5 border-lime-400/50 shadow-lg shadow-lime-500/20' 
                                : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 border-dashed'}
                            ${onUserClick && hasRoom ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-lime-500/30' : ''}
                        `}
                        onClick={hasRoom && onUserClick ? handleUserClick : undefined}
                        role={hasRoom && onUserClick ? 'button' : undefined}
                        tabIndex={hasRoom && onUserClick ? 0 : undefined}
                    >
                        <div className="flex items-center gap-4 w-full">
                            {/* 아이콘 */}
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                                ${hasRoom 
                                    ? 'bg-lime-400/20 text-lime-400' 
                                    : 'bg-gray-700 text-gray-500'}
                            `}>
                                {hasRoom ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                )}
                            </div>

                            {/* 정보 */}
                            <div className="flex-1 min-w-0">
                                {hasRoom ? (
                                    <>
                                        <p className="text-xs text-gray-400 mb-1">내 방</p>
                                        <p className="text-xl font-bold text-white">
                                            {user?.selectedRoom}호
                                        </p>
                                        <p className="text-xs text-lime-400 mt-0.5">
                                            배정 완료 ✓
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-gray-500 mb-1">내 방</p>
                                        <p className="text-sm text-gray-400">
                                            좌석을 선택해주세요
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* 화살표 (클릭 가능한 경우) */}
                            {hasRoom && onUserClick && (
                                <div className="text-lime-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 중앙: 잔여 현황 모듈 (lg:col-span-5) - 균일한 높이 */}
                    {stats && (
                        <div className="lg:col-span-5 grid grid-cols-2 gap-3 min-h-[88px]">
                            {/* 남성 */}
                            <div className="bg-gradient-to-br from-blue-900/30 to-gray-900 border border-blue-500/30 rounded-xl p-4 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-blue-300 font-semibold uppercase tracking-wide">Male</span>
                                    <span className="text-xs text-gray-500">
                                        {getMaleOccupancyRate().toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-blue-400">
                                        {stats.male?.availableSlots || 0}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        / {(stats.male?.totalCapacity) || (stats.male?.occupiedSlots || 0) + (stats.male?.availableSlots || 0)}
                                    </span>
                                </div>
                                {/* 프로그레스 바 */}
                                <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                                        style={{ width: `${getMaleOccupancyRate()}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* 여성 */}
                            <div className="bg-gradient-to-br from-pink-900/30 to-gray-900 border border-pink-500/30 rounded-xl p-4 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-pink-300 font-semibold uppercase tracking-wide">Female</span>
                                    <span className="text-xs text-gray-500">
                                        {getFemaleOccupancyRate().toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-pink-400">
                                        {stats.female?.availableSlots || 0}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        / {(stats.female?.totalCapacity) || (stats.female?.occupiedSlots || 0) + (stats.female?.availableSlots || 0)}
                                    </span>
                                </div>
                                {/* 프로그레스 바 */}
                                <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-500"
                                        style={{ width: `${getFemaleOccupancyRate()}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 우측: 사용자 정보 (lg:col-span-3) - 균일한 높이 */}
                    {user && (
                        <div className="lg:col-span-3 flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700 min-h-[88px]">
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0
                                ${user.gender === 'M' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-pink-500 to-pink-600'}
                            `}>
                                {user.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                <div className="flex items-center gap-2 text-xs mt-1">
                                    <span className={`
                                        px-2 py-0.5 rounded-full font-medium
                                        ${user.gender === 'M' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'}
                                    `}>
                                        {getGenderLabel(user.gender)}
                                    </span>
                                    {user.age && (
                                        <span className="text-gray-400">{user.age}세</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
});

Header.displayName = 'Header';

export default Header;

