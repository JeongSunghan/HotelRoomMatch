
import { useState, useMemo, useEffect } from 'react';
import { roomData, floors, floorInfo } from '../../data/roomData';
import { exportRoomAssignmentsToCSV } from '../../utils/csvExport';
import {
    subscribeToRoomChangeRequests,
    resolveRoomChangeRequest,
    deleteRoomChangeRequest,
    clearUserSession,
    updateUser,
    checkGuestInRoom,
    subscribeToInquiries,
    replyToInquiry,
    deleteInquiry,
    logGuestRemove
} from '../../firebase/index';

import Sidebar from './Sidebar';
import RoomManagementTab from './RoomManagementTab';
import RequestsTab from './RequestsTab';
import InquiryManagement from './InquiryManagement';
import CsvUploadModal from './CsvUploadModal';
import HistoryTab from './HistoryTab';
import DeadlineSettings from './DeadlineSettings';
import AllowedUsersTab from './AllowedUsersTab';
import UserManagementTab from './UserManagementTab';

/**
 * 관리자 대시보드 (페이지 전체 레이아웃)
 */
export default function AdminDashboard({
    roomGuests,
    onRemoveGuest,
    onAddGuest,
    onLogout,
    getStats
}) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFloor, setFilterFloor] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [changeRequests, setChangeRequests] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [showCsvModal, setShowCsvModal] = useState(false);

    // 방 수정 요청 구독
    useEffect(() => {
        const unsubscribe = subscribeToRoomChangeRequests(setChangeRequests);
        return () => unsubscribe();
    }, []);

    // 문의 목록 구독
    useEffect(() => {
        const unsubscribe = subscribeToInquiries(setInquiries);
        return () => unsubscribe();
    }, []);

    const pendingRequests = changeRequests.filter(r => r.status === 'pending');
    const pendingInquiries = inquiries.filter(i => i.status === 'pending');

    const stats = useMemo(() => ({
        male: getStats('M'),
        female: getStats('F'),
        total: getStats()
    }), [getStats]);

    // 방 목록 필터링
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
            await onRemoveGuest(confirmDelete.roomNumber, confirmDelete.sessionId);
            // await clearUserSession(confirmDelete.sessionId);
            // 유저 세션은 유지하고(PassKey 보존) 방 정보만 초기화
            await updateUser(confirmDelete.sessionId, { selectedRoom: null, locked: false });

            // 히스토리 로깅
            await logGuestRemove(confirmDelete.roomNumber, confirmDelete.guestName, confirmDelete.sessionId, 'admin');

            setConfirmDelete(null);
        }
    };

    const handleResolveRequest = async (request) => {
        try {
            if (request.type === 'cancel' && request.currentRoom && request.sessionId) {
                await onRemoveGuest(request.currentRoom, request.sessionId);
                // await clearUserSession(request.sessionId);
                await updateUser(request.sessionId, { selectedRoom: null, locked: false });
            }
            else if (request.type === 'change' && request.currentRoom && request.targetRoom && request.sessionId) {
                const exists = await checkGuestInRoom(request.currentRoom, request.sessionId);
                if (!exists) {
                    const proceed = window.confirm(
                        '⚠️ 경고: 해당 유저는 이미 현재 방에 존재하지 않습니다.\n' +
                        '그래도 요청을 "완료" 상태로 변경하시겠습니까?'
                    );
                    if (!proceed) return;
                } else {
                    const currentRoomGuests = roomGuests[request.currentRoom] || [];
                    const guestData = currentRoomGuests.find(g => g.sessionId === request.sessionId);

                    if (guestData) {
                        await onRemoveGuest(request.currentRoom, request.sessionId);
                        await onAddGuest(request.targetRoom, guestData);
                    }
                }
            }
            await resolveRoomChangeRequest(request.id);
        } catch (error) {
            alert('오류: ' + error.message);
        }
    };

    const handleDeleteRequest = async (requestId) => {
        await deleteRoomChangeRequest(requestId);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // 대시보드 메인 뷰
    const renderDashboard = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm text-gray-500">총 입실률</p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{stats.total.occupancyRate}%</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {stats.total.occupiedSlots} / {stats.total.totalCapacity} 명
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                    <p className="text-sm text-gray-500">남성 현황</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.male.occupiedSlots}</p>
                    <p className="text-xs text-blue-400 mt-1">잔여: {stats.male.availableSlots}석</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-pink-100">
                    <p className="text-sm text-gray-500">여성 현황</p>
                    <p className="text-3xl font-bold text-pink-600 mt-2">{stats.female.occupiedSlots}</p>
                    <p className="text-xs text-pink-400 mt-1">잔여: {stats.female.availableSlots}석</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100 cursor-pointer hover:bg-amber-50 transition-colors"
                    onClick={() => setActiveTab('requests')}>
                    <p className="text-sm text-gray-500">방 변경 요청</p>
                    <p className="text-3xl font-bold text-amber-600 mt-2">{pendingRequests.length}</p>
                    <p className="text-xs text-amber-500 mt-1">대기 중</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 cursor-pointer hover:bg-purple-50 transition-colors"
                    onClick={() => setActiveTab('inquiries')}>
                    <p className="text-sm text-gray-500">1:1 문의</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{pendingInquiries.length}</p>
                    <p className="text-xs text-purple-500 mt-1">대기 중</p>
                </div>
            </div>

            {/* 최근 변경 요청 미리보기 */}
            <div className="flex gap-6">
                <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">최근 요청</h3>
                        <button onClick={() => setActiveTab('requests')} className="text-sm text-blue-600 hover:underline">전체보기</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <RequestsTab
                            changeRequests={changeRequests.slice(0, 3)} // 상위 3개만
                            onResolveRequest={handleResolveRequest}
                            onDeleteRequest={handleDeleteRequest}
                            formatDate={formatDate}
                        />
                    </div>
                </div>
                <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">최근 문의</h3>
                        <button onClick={() => setActiveTab('inquiries')} className="text-sm text-blue-600 hover:underline">전체보기</button>
                    </div>
                    {inquiries.length > 0 ? (
                        <div className="space-y-2">
                            {inquiries.slice(0, 3).map(inq => (
                                <div key={inq.id} className="p-3 border rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-50" onClick={() => setActiveTab('inquiries')}>
                                    <div className="truncate flex-1">
                                        <p className="font-medium text-gray-800 truncate">{inq.title}</p>
                                        <p className="text-xs text-gray-500">{inq.userName} • {formatDate(inq.createdAt)}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${inq.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {inq.status === 'replied' ? '완료' : '대기'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-8">문의 내역이 없습니다.</p>
                    )}
                </div>
            </div>

            {/* 마감 설정 */}
            <DeadlineSettings />
        </div>
    );

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} />

            <div className="flex-1 p-8 overflow-y-auto h-screen">
                {activeTab === 'dashboard' && renderDashboard()}

                {activeTab === 'rooms' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">객실 관리</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCsvModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    📤 CSV 업로드
                                </button>
                                <button
                                    onClick={() => exportRoomAssignmentsToCSV(roomGuests, roomData)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    📥 CSV 다운로드
                                </button>
                            </div>
                        </div>

                        {/* 필터 */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4">
                            <input
                                type="text"
                                placeholder="이름 또는 방 번호..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                                value={filterFloor}
                                onChange={(e) => setFilterFloor(e.target.value)}
                                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">전체 층</option>
                                {floors.map(floor => (
                                    <option key={floor} value={floor}>{floor}층</option>
                                ))}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">전체 상태</option>
                                <option value="empty">빈 방</option>
                                <option value="partial">부분 배정</option>
                                <option value="full">배정 완료</option>
                            </select>
                        </div>

                        <RoomManagementTab
                            assignedRooms={assignedRooms}
                            onRemoveGuest={handleRemoveGuest}
                            onAddGuest={onAddGuest}
                        />
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800">요청 관리</h2>
                        <RequestsTab
                            changeRequests={changeRequests}
                            onResolveRequest={handleResolveRequest}
                            onDeleteRequest={handleDeleteRequest}
                            formatDate={formatDate}
                        />
                    </div>
                )}

                {activeTab === 'inquiries' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800">1:1 문의 관리</h2>
                        <InquiryManagement
                            inquiries={inquiries}
                            onReply={replyToInquiry}
                            onDelete={deleteInquiry}
                            formatDate={formatDate}
                        />
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800">히스토리</h2>
                        <HistoryTab />
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800">사전등록 유저 관리</h2>
                        <AllowedUsersTab />
                    </div>
                )}

                {activeTab === 'activeUsers' && (
                    <UserManagementTab />
                )}
            </div>

            {/* 모달 (삭제 확인) */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">배정 취소 확인</h3>
                        <p className="text-gray-600 mb-4">
                            {confirmDelete.guestName} ({confirmDelete.roomNumber}호)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmRemoveGuest}
                                className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV 업로드 모달 */}
            {showCsvModal && (
                <CsvUploadModal
                    onUpload={onAddGuest}
                    onClose={() => setShowCsvModal(false)}
                />
            )}
        </div>
    );
}
