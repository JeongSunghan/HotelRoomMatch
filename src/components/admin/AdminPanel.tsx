import { useState, useMemo, useEffect, ChangeEvent } from 'react';
import { roomData, floors, floorInfo } from '../../data/roomData';
import { getGenderLabel } from '../../utils/genderUtils';
import { exportRoomAssignmentsToCSV } from '../../utils/csvExport';
import RoomManagementTab from './RoomManagementTab';
import RequestsTab from './RequestsTab';
import {
    subscribeToRoomChangeRequests,
    resolveRoomChangeRequest,
    deleteRoomChangeRequest,
    clearUserSession,
    checkGuestInRoom
} from '../../firebase/index';
import type { RoomGuestsMap, Guest, RoomChangeRequest, RoomInfo, Gender } from '../../types';

interface AdminPanelProps {
    roomGuests: RoomGuestsMap;
    onRemoveGuest: (roomNumber: string, sessionId: string) => Promise<void>;
    onAddGuest: (roomNumber: string, guestData: Guest) => Promise<void>;
    onClose: () => void;
    getStats: (gender?: Gender | null) => {
        totalRooms: number;
        totalCapacity: number;
        occupiedSlots: number;
        availableSlots: number;
        occupancyRate: number;
    };
}

interface AssignedRoom extends RoomInfo {
    roomNumber: string;
    guests: Guest[];
    isFull: boolean;
}

interface ConfirmDelete {
    roomNumber: string;
    sessionId: string;
    guestName: string;
}

type TabType = 'rooms' | 'requests';
type FilterStatus = 'all' | 'empty' | 'partial' | 'full';

/**
 * Admin 패널 컴포넌트 - 네이비 스타일 (개선됨)
 */
export default function AdminPanel({
    roomGuests,
    onRemoveGuest,
    onAddGuest,
    onClose,
    getStats
}: AdminPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('rooms');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterFloor, setFilterFloor] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);
    const [changeRequests, setChangeRequests] = useState<RoomChangeRequest[]>([]);

    // 방 수정 요청 구독
    useEffect(() => {
        const unsubscribe = subscribeToRoomChangeRequests((requests: RoomChangeRequest[]) => {
            setChangeRequests(requests);
        });
        return () => unsubscribe();
    }, []);

    const pendingRequests = changeRequests.filter(r => r.status === 'pending');

    const stats = useMemo(() => ({
        male: getStats('M'),
        female: getStats('F'),
        total: getStats()
    }), [getStats]);

    const assignedRooms = useMemo((): AssignedRoom[] => {
        const rooms: AssignedRoom[] = [];

        for (const [roomNumber, room] of Object.entries(roomData as Record<string, RoomInfo>)) {
            const guests = roomGuests[roomNumber] || [];

            if (filterFloor !== 'all' && room.floor !== parseInt(filterFloor, 10)) continue;
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

    const handleRemoveGuest = (roomNumber: string, sessionId: string, guestName: string): void => {
        setConfirmDelete({ roomNumber, sessionId, guestName });
    };

    const confirmRemoveGuest = async (): Promise<void> => {
        if (confirmDelete) {
            // 방에서 게스트 제거
            await onRemoveGuest(confirmDelete.roomNumber, confirmDelete.sessionId);
            // 사용자 세션도 삭제 (재등록 가능하게)
            await clearUserSession(confirmDelete.sessionId);
            setConfirmDelete(null);
        }
    };

    // 요청 처리 완료
    const handleResolveRequest = async (request: RoomChangeRequest): Promise<void> => {
        try {
            // 1. 취소 요청인 경우
            if (request.type === 'cancel' && request.currentRoom && request.userId) {
                await onRemoveGuest(request.currentRoom, request.userId);
                await clearUserSession(request.userId);
            }
            // 2. 방 변경 요청인 경우 (핵심 로직 추가)
            else if (request.type === 'change' && request.currentRoom && request.userId) {
                // (1) 유저가 현재 방에 실제로 존재하는지 확인 (중복 처리/충돌 방지)
                const exists = await checkGuestInRoom(request.currentRoom, request.userId);

                if (!exists) {
                    const proceed = window.confirm(
                        '⚠️ 경고: 해당 유저는 이미 현재 방에 존재하지 않습니다.\n' +
                        '(이미 관리자에 의해 취소되었거나 나간 상태일 수 있음)\n\n' +
                        '그래도 요청을 "완료" 상태로 변경하시겠습니까? (방 이동 로직은 수행되지 않음)'
                    );
                    if (!proceed) return;
                } else {
                    // (2) 유저 존재 시: 이동 로직 수행
                    // 유저 정보 가져오기 (roomGuests에서)
                    const currentRoomGuests = roomGuests[request.currentRoom] || [];
                    const guestData = currentRoomGuests.find(g => g.sessionId === request.userId);

                    if (!guestData) {
                        alert('오류: 유저 정보를 찾을 수 없습니다.');
                        return;
                    }

                    // 기존 방에서 제거 & 새 방에 추가 (순차 실행)
                    await onRemoveGuest(request.currentRoom, request.userId);

                    // targetRoom이 있는 경우에만 추가 (RoomChangeRequest 타입에 targetRoom이 없을 수 있으므로 확인 필요)
                    const targetRoom = (request as RoomChangeRequest & { targetRoom?: string }).targetRoom;
                    if (targetRoom) {
                        await onAddGuest(targetRoom, guestData);
                    }
                }
            }

            // 요청 상태 업데이트 (DB)
            if (request.id) {
                await resolveRoomChangeRequest(request.id);
            }

        } catch (error: unknown) {
            console.error('요청 처리 중 오류:', error);
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert('요청 처리 중 오류가 발생했습니다: ' + errorMessage);
        }
    };

    const handleDeleteRequest = async (requestId: string): Promise<void> => {
        await deleteRoomChangeRequest(requestId);
    };

    const formatDate = (timestamp: number): string => {
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
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => exportRoomAssignmentsToCSV(roomGuests, roomData as Record<string, RoomInfo>)}
                                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                title="CSV 내보내기"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                CSV
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
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
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                className="flex-1 min-w-[200px] px-4 py-2 bg-white/10 border border-white/20 rounded-lg
                             text-white placeholder-blue-200 focus:outline-none focus:border-white/40"
                            />

                            <select
                                value={filterFloor}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterFloor(e.target.value)}
                                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg
                             text-white focus:outline-none focus:border-white/40"
                            >
                                <option value="all" className="text-gray-800">전체 층</option>
                                {floors.map(floor => (
                                    <option key={floor} value={floor.toString()} className="text-gray-800">{floorInfo[floor].label}</option>
                                ))}
                            </select>

                            <select
                                value={filterStatus}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value as FilterStatus)}
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
                        <RoomManagementTab
                            assignedRooms={assignedRooms}
                            onRemoveGuest={handleRemoveGuest}
                            onAddGuest={onAddGuest}
                        />
                    ) : (
                        <RequestsTab
                            changeRequests={changeRequests}
                            onResolveRequest={handleResolveRequest}
                            onDeleteRequest={handleDeleteRequest}
                            formatDate={formatDate}
                        />
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

