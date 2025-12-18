import { useState, useMemo } from 'react';
import { roomData } from '../../data/roomData';
import { getGenderLabel } from '../../utils/genderUtils';

/**
 * 객실/이름 검색 모달 (유저용)
 */
export default function SearchModal({ roomGuests, onClose, onRoomClick }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('all'); // 'all', 'name', 'room'

    // 검색 결과
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase().trim();
        const results = [];

        for (const [roomNumber, room] of Object.entries(roomData)) {
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
        }).slice(0, 20); // 최대 20개
    }, [searchQuery, searchType, roomGuests]);

    const handleResultClick = (roomNumber) => {
        if (onRoomClick) {
            onRoomClick(roomNumber);
        }
        onClose();
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
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="이름 또는 방 번호 검색..."
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                            autoFocus
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            🔍
                        </span>
                    </div>

                    {/* 검색 타입 필터 */}
                    <div className="flex gap-2 mt-3">
                        {[
                            { value: 'all', label: '전체' },
                            { value: 'name', label: '이름만' },
                            { value: 'room', label: '방 번호만' },
                        ].map(opt => (
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
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-4xl mb-2">🔍</p>
                            <p>검색어를 입력하세요</p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-4xl mb-2">😔</p>
                            <p>검색 결과가 없습니다</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {searchResults.map((result, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleResultClick(result.roomNumber)}
                                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
                                                {result.type === 'guest' ? (
                                                    <>
                                                        <p className="font-medium text-gray-800">
                                                            {result.guest.name}
                                                            {result.guest.company && (
                                                                <span className="text-gray-500 text-sm ml-1">
                                                                    ({result.guest.company})
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {result.roomNumber}호 • {getGenderLabel(result.room.gender)}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="font-medium text-gray-800">
                                                            {result.roomNumber}호
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {result.room.roomType} • {getGenderLabel(result.room.gender)} •
                                                            {result.guests.length}/{result.room.capacity}명
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
                    )}
                </div>
            </div>
        </div>
    );
}
