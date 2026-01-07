import { useState, useMemo, useEffect, useRef } from 'react';
import { roomData } from '../../data/roomData';
import { getGenderLabel } from '../../utils/genderUtils';
import type { RoomGuestsMap, Guest, RoomInfo } from '../../types';

type SearchType = 'all' | 'name' | 'room';

interface SearchResult {
    type: 'room' | 'guest';
    roomNumber: string;
    room: RoomInfo;
    guest?: Guest;
    guests: Guest[];
    matchText: string;
}

interface SearchModalProps {
    roomGuests: RoomGuestsMap;
    onClose: () => void;
    onRoomClick?: (roomNumber: string) => void;
}

const RECENT_SEARCHES_KEY = 'vup58_recent_searches';
const MAX_RECENT_SEARCHES = 5;

/**
 * 검색어에서 매칭 부분 하이라이트 (React 컴포넌트로 반환)
 * 보안 강화: dangerouslySetInnerHTML 대신 React 요소 사용
 */
function HighlightedText({ text, query }: { text: string; query: string }): JSX.Element {
    if (!query.trim()) {
        return <>{text}</>;
    }

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) => {
                if (part.toLowerCase() === query.toLowerCase()) {
                    return (
                        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                            {part}
                        </mark>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
}

/**
 * 최근 검색어 저장/로드
 */
function saveRecentSearch(query: string): void {
    if (!query.trim()) return;
    try {
        const recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]') as string[];
        const filtered = recent.filter(q => q !== query);
        const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
        // 로컬 스토리지 저장 실패 무시
    }
}

function loadRecentSearches(): string[] {
    try {
        return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]') as string[];
    } catch {
        return [];
    }
}

/**
 * 객실/이름 검색 모달 (유저용)
 * 개선: 키보드 단축키, 검색어 하이라이트, 최근 검색어 지원
 */
export default function SearchModal({ roomGuests, onClose, onRoomClick }: SearchModalProps) {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchType, setSearchType] = useState<SearchType>('all'); // 'all', 'name', 'room'
    const [recentSearches] = useState<string[]>(loadRecentSearches());
    const inputRef = useRef<HTMLInputElement>(null);

    // 키보드 단축키 처리
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            // Escape: 모달 닫기
            if (e.key === 'Escape') {
                onClose();
            }
            // Enter: 첫 번째 결과 클릭
            if (e.key === 'Enter' && searchResults.length > 0) {
                handleResultClick(searchResults[0].roomNumber);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchResults]);

    // 입력 필드 자동 포커스
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // 검색 결과
    const searchResults = useMemo<SearchResult[]>(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase().trim();
        const results: SearchResult[] = [];

        for (const [roomNumber, room] of Object.entries(roomData as Record<string, RoomInfo>)) {
            const guests = roomGuests[roomNumber] || [];

            // 방 번호 검색
            if (searchType === 'all' || searchType === 'room') {
                if (roomNumber.includes(query)) {
                    results.push({
                        type: 'room',
                        roomNumber,
                        room,
                        guests,
                        matchText: `${roomNumber}호`
                    });
                    continue;
                }
            }

            // 이름 검색
            if (searchType === 'all' || searchType === 'name') {
                for (const guest of guests) {
                    if (guest.name?.toLowerCase().includes(query)) {
                        results.push({
                            type: 'guest',
                            roomNumber,
                            room,
                            guest,
                            guests,
                            matchText: guest.name
                        });
                    }
                }
            }
        }

        // 정렬: 방 결과 먼저, 그 다음 이름 결과
        return results.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'room' ? -1 : 1;
            return a.roomNumber.localeCompare(b.roomNumber);
        }).slice(0, 50); // 최대 50개로 증가 (개선)
    }, [searchQuery, searchType, roomGuests]);

    const handleResultClick = (roomNumber: string): void => {
        if (onRoomClick) {
            onRoomClick(roomNumber);
        }
        // 검색어 저장 (최근 검색어)
        if (searchQuery.trim()) {
            saveRecentSearch(searchQuery.trim());
        }
        onClose();
    };

    const handleRecentSearchClick = (query: string): void => {
        setSearchQuery(query);
        inputRef.current?.focus();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">🔍 검색</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                        ✕
                    </button>
                </div>

                {/* 검색 입력 */}
                <div className="mb-4">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="이름 또는 방 번호 검색... (Enter: 선택, Esc: 닫기)"
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            autoFocus
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            🔍
                        </span>
                        {searchQuery.trim() && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                                aria-label="검색어 지우기"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* 검색 타입 필터 */}
                    <div className="flex gap-2 mt-3">
                        {([
                            { value: 'all' as SearchType, label: '전체' },
                            { value: 'name' as SearchType, label: '이름만' },
                            { value: 'room' as SearchType, label: '방 번호만' },
                        ]).map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setSearchType(opt.value)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${searchType === opt.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 검색 결과 */}
                <div className="flex-1 overflow-y-auto">
                    {searchQuery.trim() === '' ? (
                        <div>
                            {/* 최근 검색어 표시 */}
                            {recentSearches.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-500 mb-2">최근 검색어</p>
                                    <div className="flex flex-wrap gap-2">
                                        {recentSearches.map((query, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleRecentSearchClick(query)}
                                                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                                            >
                                                {query}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-4xl mb-2">🔍</p>
                                <p>검색어를 입력하세요</p>
                            </div>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-4xl mb-2">😔</p>
                            <p>검색 결과가 없습니다</p>
                        </div>
                    ) : (
                        <div>
                            {/* 검색 결과 개수 표시 */}
                            <div className="mb-3 text-sm text-gray-500">
                                총 <strong className="text-gray-700 dark:text-gray-300">{searchResults.length}</strong>개의 결과
                            </div>
                            <div className="space-y-2">
                                {searchResults.map((result, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleResultClick(result.roomNumber)}
                                        className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleResultClick(result.roomNumber);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`${result.type === 'guest' ? result.guest?.name : result.roomNumber}호 클릭`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white
                                                    ${result.room.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}
                                                `}>
                                                    {result.roomNumber}
                                                </div>
                                                <div>
                                                    {result.type === 'guest' && result.guest ? (
                                                        <>
                                                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                                                <HighlightedText text={result.guest.name || ''} query={searchQuery} />
                                                                {result.guest.company && (
                                                                    <span className="text-gray-500 text-sm ml-1 dark:text-gray-400">
                                                                        ({result.guest.company})
                                                                    </span>
                                                                )}
                                                            </p>
                                                            {result.guest.company && (
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {result.roomNumber}호 • {getGenderLabel(result.room.gender)}
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                                                <HighlightedText text={`${result.roomNumber}호`} query={searchQuery} />
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {result.room.roomType} • {getGenderLabel(result.room.gender)} • {result.guests.length}/{result.room.capacity}명
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-gray-400">→</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


