import { useState, useMemo, useEffect } from 'react';
import { roomData, floors, floorInfo } from '../data/roomData';
import { getGenderLabel } from '../utils/genderUtils';
import {
    subscribeToRoomChangeRequests,
    resolveRoomChangeRequest,
    deleteRoomChangeRequest,
    clearUserSession
} from '../firebase';

/**
 * Admin 패널 컴포넌트 - 네이비 스타일 (개선됨)
 */
export default function AdminPanel({
    roomGuests,
    onRemoveGuest,
    onClose,
    getStats
}) {
    const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' or 'requests'
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFloor, setFilterFloor] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [changeRequests, setChangeRequests] = useState([]);

    // 방 수정 요청 구독
    useEffect(() => {
        const unsubscribe = subscribeToRoomChangeRequests(setChangeRequests);
        return () => unsubscribe();
    }, []);

    const pendingRequests = changeRequests.filter(r => r.status === 'pending');

    const stats = useMemo(() => ({
        male: getStats('M'),
        female: getStats('F'),
        total: getStats()
    }), [getStats]);

    const assignedRooms = useMemo(() => {
        const rooms = [];

        for (const [roomNumber, room] of Object.entries(roomData)) {
            const guests = roomGuests[roomNumber] || [];

            if (filterFloor !== 'all' && room.floor !== parseInt(filterFloor)) continue;
            if (filterStatus === 'empty' && guests.length > 0) continue;
            if (filterStatus === 'partial' && (guests.length === 0 || guests.length >= room.capacity)) continue;
            if (filterStatus === 'full' && guests.length < room.capacity) continue;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchRoom = roomNumber.includes(query);
                const matchGuest = guests.some(g => g.name.toLowerCase().includes(query));
                if (!matchRoom && !matchGuest) continue;
            }

            rooms.push({
                roomNumber,
                ...room,
                guests,
                isFull: guests.length >= room.capacity
            });
        }

        return rooms.sort((a, b) => {
            if (a.floor !== b.floor) return b.floor - a.floor;
            return a.roomNumber.localeCompare(b.roomNumber);
        });
    }, [roomGuests, filterFloor, filterStatus, searchQuery]);

    const handleRemoveGuest = (roomNumber, sessionId, guestName) => {
        setConfirmDelete({ roomNumber, sessionId, guestName });
    };

    const confirmRemoveGuest = async () => {
        if (confirmDelete) {
            // 방에서 게스트 제거
            await onRemoveGuest(confirmDelete.roomNumber, confirmDelete.sessionId);
            // 사용자 세션도 삭제 (재등록 가능하게)
            await clearUserSession(confirmDelete.sessionId);
            setConfirmDelete(null);
        }
    };

    const handleResolveRequest = async (requestId) => {
        await resolveRoomChangeRequest(requestId);
    };

    const handleDeleteRequest = async (requestId) => {
        await deleteRoomChangeRequest(requestId);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 modal-overlay" onClick={onClose} />

            <div className="relative bg-white rounded-xl w-full max-w-5xl my-8 overflow-hidden shadow-2xl">
                {/* 헤더 */}
                <div className="sticky top-0 header-navy p-6 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">🔑 관리자 패널</h2>
                            <p className="text-blue-200 text-sm">배정 현황 조회 및 수정</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 탭 */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setActiveTab('rooms')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'rooms'
                                ? 'bg-white text-navy-800'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            🏨 객실 관리
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${activeTab === 'requests'
                                ? 'bg-white text-navy-800'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            📋 수정 요청
                            {pendingRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* 통계 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-white">{stats.male.occupiedSlots}</p>
                            <p className="text-xs text-blue-200">남성 배정</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-blue-300">{stats.male.availableSlots}</p>
                            <p className="text-xs text-blue-200">남성 잔여</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-white">{stats.female.occupiedSlots}</p>
                            <p className="text-xs text-blue-200">여성 배정</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-pink-300">{stats.female.availableSlots}</p>
                            <p className="text-xs text-blue-200">여성 잔여</p>
                        </div>
                    </div>

                    {/* 필터 (객실 관리 탭에서만) */}
                    {activeTab === 'rooms' && (
                        <div className="flex flex-wrap gap-3">
                            <input
                                type="text"
                                placeholder="이름 또는 방 번호 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 min-w-[200px] px-4 py-2 bg-white/10 border border-white/20 rounded-lg
                             text-white placeholder-blue-200 focus:outline-none focus:border-white/40"
                            />

                            <select
                                value={filterFloor}
                                onChange={(e) => setFilterFloor(e.target.value)}
                                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg
                             text-white focus:outline-none focus:border-white/40"
                            >
                                <option value="all" className="text-gray-800">전체 층</option>
                                {floors.map(floor => (
                                    <option key={floor} value={floor} className="text-gray-800">{floorInfo[floor].label}</option>
                                ))}
                            </select>

                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg
                             text-white focus:outline-none focus:border-white/40"
                            >
                                <option value="all" className="text-gray-800">전체 상태</option>
                                <option value="empty" className="text-gray-800">빈 방</option>
                                <option value="partial" className="text-gray-800">부분 배정</option>
                                <option value="full" className="text-gray-800">배정 완료</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* 컨텐츠 */}
                <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-50">
                    {activeTab === 'rooms' ? (
                        // 객실 목록
                        <div className="space-y-3">
                            {assignedRooms.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>검색 결과가 없습니다.</p>
                                </div>
                            ) : (
                                assignedRooms.map(room => (
                                    <div
                                        key={room.roomNumber}
                                        className={`
                                            p-4 rounded-lg border bg-white transition-colors
                                            ${room.isFull
                                                ? room.gender === 'M'
                                                    ? 'border-blue-300'
                                                    : 'border-pink-300'
                                                : room.guests.length > 0
                                                    ? 'border-gray-300'
                                                    : 'border-gray-200'
                                            }
                                        `}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white
                                                    ${room.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}
                                                `}>
                                                    {room.roomNumber}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-800">{room.floor}층</span>
                                                        <span className="text-gray-400">•</span>
                                                        <span className="text-gray-500 text-sm">{room.roomType}</span>
                                                        <span className={`
                                                            text-xs px-2 py-0.5 rounded-full font-medium
                                                            ${room.capacity === 2 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}
                                                        `}>
                                                            {room.capacity === 2 ? '2인실' : '1인실'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {getGenderLabel(room.gender)} 전용 • {room.guests.length}/{room.capacity} 배정
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {room.guests.length === 0 ? (
                                                    <span className="text-gray-400 text-sm italic">빈 방</span>
                                                ) : (
                                                    room.guests.map((guest, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`
                                                                flex items-center gap-2 px-3 py-1.5 rounded-lg
                                                                ${guest.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                                                            `}
                                                        >
                                                            <div>
                                                                <span className="font-medium">{guest.name}</span>
                                                                {guest.company && (
                                                                    <span className="text-xs ml-1 opacity-70">({guest.company})</span>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveGuest(room.roomNumber, guest.sessionId, guest.name)}
                                                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                                                title="삭제"
                                                            >
                                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // 수정 요청 목록
                        <div className="space-y-3">
                            {changeRequests.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>수정 요청이 없습니다.</p>
                                </div>
                            ) : (
                                changeRequests.map(request => (
                                    <div
                                        key={request.id}
                                        className={`p-4 rounded-lg border bg-white ${request.status === 'pending'
                                            ? 'border-amber-300 bg-amber-50'
                                            : 'border-gray-200 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${request.type === 'cancel'
                                                            ? 'bg-red-200 text-red-800'
                                                            : 'bg-blue-200 text-blue-800'
                                                        }`}>
                                                        {request.type === 'cancel' ? '취소 요청' : '변경 요청'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${request.status === 'pending'
                                                        ? 'bg-amber-200 text-amber-800'
                                                        : 'bg-green-200 text-green-800'
                                                        }`}>
                                                        {request.status === 'pending' ? '대기 중' : '처리 완료'}
                                                    </span>
                                                    <span className="text-gray-400 text-sm">
                                                        {formatDate(request.createdAt)}
                                                    </span>
                                                </div>

                                                <p className="font-medium text-gray-800">
                                                    {request.userName}
                                                    {request.userCompany && (
                                                        <span className="text-gray-500 text-sm ml-1">({request.userCompany})</span>
                                                    )}
                                                </p>

                                                <p className="text-sm text-gray-600 mt-1">
                                                    현재 방: <strong>{request.currentRoom}호</strong>
                                                </p>

                                                <p className="text-sm text-blue-600 mt-1">
                                                    📞 {request.phoneNumber}
                                                </p>

                                                {request.reason && (
                                                    <p className="text-sm text-gray-500 mt-2 p-2 bg-gray-100 rounded">
                                                        "{request.reason}"
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                {request.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleResolveRequest(request.id)}
                                                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
                                                    >
                                                        처리 완료
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteRequest(request.id)}
                                                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                            {activeTab === 'rooms'
                                ? `총 ${assignedRooms.length}개 객실 표시`
                                : `총 ${changeRequests.length}개 요청 (대기: ${pendingRequests.length})`
                            }
                        </span>
                        <span>
                            전체 배정률: {stats.total.occupancyRate}% ({stats.total.occupiedSlots}/{stats.total.totalCapacity})
                        </span>
                    </div>
                </div>
            </div>

            {/* 삭제 확인 모달 */}
            {confirmDelete && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
                    <div className="relative modal-card rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">배정 취소 확인</h3>
                        <p className="text-gray-600 mb-2">
                            <strong className="text-gray-800">{confirmDelete.guestName}</strong>님의
                            <strong className="text-gray-800"> {confirmDelete.roomNumber}호</strong> 배정을 취소하시겠습니까?
                        </p>
                        <p className="text-amber-600 text-sm mb-4">
                            ⚠️ 해당 사용자는 다시 객실을 선택해야 합니다.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-4 py-2 btn-secondary rounded-lg font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmRemoveGuest}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                            >
                                배정 취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
