import { useState, useMemo, useEffect, lazy, Suspense, useCallback } from 'react';
import Header from './components/ui/Header';
import FloorSelector from './components/ui/FloorSelector';
import RoomGrid from './components/room/RoomGrid';
import Skeleton from './components/ui/Skeleton';
import { useUser } from './hooks/useUser';
import { useRooms } from './hooks/useRooms';
import { useRoomSelection } from './hooks/useRoomSelection';
import { useUI } from './contexts/UIContext';
import { floors, floorInfo, roomData } from './data/roomData';
import { useJoinRequests } from './hooks/useJoinRequests';
import {
    checkPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    createRoommateInvitation,
    subscribeToMyInvitations,
    createRoomChangeRequest
} from './firebase/index';
import { useToast } from './components/ui/Toast';
import { handleErrorText } from './utils/errorHandler';
import {
    requestNotificationPermission,
    notifyRequestAccepted,
    notifyRequestRejected,
    notifyJoinRequest
} from './utils/notifications';
import { set, ref } from 'firebase/database';
import { database } from './firebase/config';
import type { RoommateInvitation, UserRegistrationData, UserUpdateData, RoomChangeRequest } from './types';

// Lazy loaded 모달 컴포넌트들 (초기 번들 크기 감소)
const RegistrationModal = lazy(() => import('./components/auth/RegistrationModal'));
const AdditionalInfoModal = lazy(() => import('./components/auth/AdditionalInfoModal'));
const SelectionModal = lazy(() => import('./components/room/SelectionModal'));
const InvitationModal = lazy(() => import('./components/room/InvitationModal'));
const MyRoomModal = lazy(() => import('./components/room/MyRoomModal'));
const SearchModal = lazy(() => import('./components/ui/SearchModal'));
const MatchingWarningModal = lazy(() => import('./components/room/MatchingWarningModal'));
const JoinRequestModal = lazy(() => import('./components/room/JoinRequestModal'));
const WaitingApprovalModal = lazy(() => import('./components/room/WaitingApprovalModal'));
const CancelledModal = lazy(() => import('./components/room/CancelledModal'));
const SingleRoomInfoModal = lazy(() => import('./components/room/SingleRoomInfoModal'));


/**
 * 메인 앱 컴포넌트
 */
export default function App() {
    // 사용자 상태
    const {
        user,
        isLoading: userLoading,
        isRegistered,
        canSelect,
        registerUser,
        updateUser,
        selectRoom: selectUserRoom,
        isMyRoom
    } = useUser();

    // 객실 상태
    const {
        roomGuests,
        isLoading: roomsLoading,
        getRoomStatus,
        addGuestToRoom,
        removeGuestFromRoom,
        getStats,
        isFirebaseConnected
    } = useRooms();

    // UI 상태 (UIContext에서 관리)
    const {
        modals,
        openModal,
        closeModal,
        selectedRoomNumber,
        openSelectionModal,
        warningContent,
        setWarningContent,
        pendingSelection,
        setPendingSelection,
        selectedFloor,
        setSelectedFloor,
        roomTypeFilter,
        setRoomTypeFilter,
        MODAL_TYPES,
    } = useUI();

    // 개별 모달 상태 (가독성을 위한 alias)
    const showRegistrationModal = modals[MODAL_TYPES.REGISTRATION];
    const showAdditionalInfoModal = modals[MODAL_TYPES.ADDITIONAL_INFO];
    const selectedRoomForConfirm = selectedRoomNumber;
    const showMyRoomModal = modals[MODAL_TYPES.MY_ROOM];
    const showSingleRoomModal = modals[MODAL_TYPES.SINGLE_ROOM];
    const showSearchModal = modals[MODAL_TYPES.SEARCH];
    const showWarningModal = modals[MODAL_TYPES.WARNING];
    // Toast 알림
    const toast = useToast();

    // setter 래퍼 함수 (기존 코드 호환용)
    const setShowRegistrationModal = (val: boolean): void => val ? openModal(MODAL_TYPES.REGISTRATION) : closeModal(MODAL_TYPES.REGISTRATION);
    const setShowAdditionalInfoModal = (val: boolean): void => val ? openModal(MODAL_TYPES.ADDITIONAL_INFO) : closeModal(MODAL_TYPES.ADDITIONAL_INFO);
    const setShowMyRoomModal = (val: boolean): void => val ? openModal(MODAL_TYPES.MY_ROOM) : closeModal(MODAL_TYPES.MY_ROOM);
    const setShowSingleRoomModal = (val: boolean): void => val ? openModal(MODAL_TYPES.SINGLE_ROOM) : closeModal(MODAL_TYPES.SINGLE_ROOM);
    const setShowSearchModal = (val: boolean): void => val ? openModal(MODAL_TYPES.SEARCH) : closeModal(MODAL_TYPES.SEARCH);
    const setShowWarningModal = (val: boolean): void => val ? openModal(MODAL_TYPES.WARNING) : closeModal(MODAL_TYPES.WARNING);
    const setSelectedRoomForConfirm = (roomNum: string | null): void => {
        if (roomNum) {
            openSelectionModal(roomNum);
        } else {
            closeModal(MODAL_TYPES.SELECTION);
        }
    };

    // 입실 요청 Hook
    const {
        requests,
        sendRequest,
        acceptRequest,
        rejectRequest,
        cancelRequest,
        cleanup,
        REQUEST_STATUS
    } = useJoinRequests(user?.sessionId || null);

    // 객실 선택 로직 Hook
    const {
        handleRoomClick,
        handleConfirmSelection,
        handleWarningConfirmed
    } = useRoomSelection({
        user,
        roomGuests,
        addGuestToRoom,
        selectUserRoom,
        sendRequest,
        setShowRegistrationModal,
        setSelectedRoomForConfirm,
        setWarningContent,
        setPendingSelection,
        setShowWarningModal,
        pendingSelection,
        warningContent
    });

    // 내 요청 상태 감지 (Guest)
    const mySentRequest = requests.sent.find(r => r.status === REQUEST_STATUS.PENDING);

    // 요청 처리 결과 감지 Effect
    useEffect(() => {
        if (!user) return;

        const rejectedReq = requests.sent.find(r => r.status === REQUEST_STATUS.REJECTED);
        if (rejectedReq) {
            toast.warning('룸메이트가 요청을 거절했습니다.');
            notifyRequestRejected();
            cleanup(rejectedReq.id);
            // 모달들 닫기
            setSelectedRoomForConfirm(null);
            setShowWarningModal(false);
            setPendingSelection(null);
        }

        const acceptedReq = requests.sent.find(r => r.status === REQUEST_STATUS.ACCEPTED);
        if (acceptedReq) {
            toast.success('입장이 승인되었습니다!');
            notifyRequestAccepted(acceptedReq.toRoomNumber);
            cleanup(acceptedReq.id);
            // 모달들 닫기
            setSelectedRoomForConfirm(null);
            setShowWarningModal(false);
            setPendingSelection(null);
        }
    }, [requests.sent, user, cleanup, toast, setSelectedRoomForConfirm, setShowWarningModal, setPendingSelection]);

    // 초대 시스템 상태
    const [pendingInvitation, setPendingInvitation] = useState<RoommateInvitation | null>(null);
    const [invitationLoading, setInvitationLoading] = useState<boolean>(false);
    const [rejectionNotification, setRejectionNotification] = useState<RoommateInvitation | null>(null);

    // 방 배정 시 펜딩 초대 리셋
    useEffect(() => {
        if (user?.selectedRoom && pendingInvitation) {
            setPendingInvitation(null);
        }
    }, [user?.selectedRoom, pendingInvitation]);

    // 방 배정 취소 알림 모달
    const [showCancelledModal, setShowCancelledModal] = useState<boolean>(false);

    // 검색 결과 하이라이트
    const [highlightedRoom, setHighlightedRoom] = useState<string | null>(null);

    // 사용자 성별에 맞는 기본 층 설정 (초기 진입 시)
    useEffect(() => {
        if (user?.gender && selectedFloor === null) {
            const defaultFloor = floors.find(f => floorInfo[f].gender === user.gender);
            if (defaultFloor) {
                setSelectedFloor(defaultFloor);
            } else {
                setSelectedFloor(floors[0]);
            }
        }
    }, [user?.gender, selectedFloor, setSelectedFloor]);

    // 로그인 후 추가 정보(성별 등) 누락 시 모달 표시
    useEffect(() => {
        if (user && !user.gender) {
            openModal(MODAL_TYPES.ADDITIONAL_INFO);
        } else {
            closeModal(MODAL_TYPES.ADDITIONAL_INFO);
        }
    }, [user, openModal, closeModal, MODAL_TYPES]);

    // 방 삭제 실시간 동기화: 관리자가 유저를 삭제하면 rooms 구독으로 감지
    useEffect(() => {
        // 유저가 방을 선택한 상태이고 roomGuests 데이터가 로드된 경우
        if (!user?.selectedRoom || !user?.sessionId || roomsLoading) return;

        const myRoom = user.selectedRoom;
        const guestsInMyRoom = roomGuests[myRoom] || [];

        // 내가 아직 그 방에 있는지 확인
        const amIStillInRoom = guestsInMyRoom.some(guest => guest.sessionId === user.sessionId);

        if (!amIStillInRoom && !showCancelledModal) {
            // 관리자가 나를 삭제함 → 취소 알림 모달 표시
            setShowCancelledModal(true);
        }
    }, [roomGuests, user?.selectedRoom, user?.sessionId, showCancelledModal, roomsLoading]);

    // 기본 층 설정 (사용자 등록 전)
    useEffect(() => {
        if (selectedFloor === null) {
            setSelectedFloor(floors[0]);
        }
    }, [selectedFloor, setSelectedFloor]);

    // Ctrl+K 키보드 단축키로 검색 모달 열기 (개선)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            // Ctrl+K 또는 Cmd+K: 검색 모달 열기
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearchModal(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setShowSearchModal]);

    // 페이지 로드 시 대기 중인 초대 확인 (기존 사용자용)
    useEffect(() => {
        const checkInvitations = async (): Promise<void> => {
            // 사용자가 로그인되어 있고, 아직 방이 배정되지 않았으며, 이미 확인하지 않은 경우
            if (user?.name && !user.selectedRoom && !pendingInvitation) {
                try {
                    const invitations = await checkPendingInvitations(user.name);
                    if (invitations.length > 0) {
                        setPendingInvitation(invitations[0]);
                    }
                } catch (error) {
                    console.error('초대 확인 실패:', error);
                }
            }
        };

        checkInvitations();
    }, [user?.name, user?.selectedRoom, pendingInvitation]);

    // 내가 보낸 초대 상태 구독 (거절 알림용)
    useEffect(() => {
        if (!user?.sessionId) return;

        const unsubscribe = subscribeToMyInvitations(user.sessionId, (myInvitations: RoommateInvitation[]) => {
            // 거절된 초대 찾기
            const rejected = myInvitations.find(inv =>
                inv.status === 'rejected' && !inv.notified
            );
            if (rejected) {
                setRejectionNotification(rejected);
            }
        });

        return () => unsubscribe();
    }, [user?.sessionId]);

    // 통계 계산
    const stats = useMemo(() => {
        return {
            male: getStats('M'),
            female: getStats('F'),
            total: getStats()
        };
    }, [getStats]);

    // 사용자 클릭 핸들러 (내 방 정보 모달 열기) - Hook 규칙 준수를 위해 여기에 위치
    const handleUserClick = useCallback((): void => {
        if (user?.locked) {
            setShowMyRoomModal(true);
        }
    }, [user?.locked, setShowMyRoomModal]);

    // 로딩 중 (스켈레톤 UI 표시)
    if (userLoading || roomsLoading) {
        return (
            <div className="min-h-screen p-4 sm:p-6">
                <div className="container mx-auto max-w-7xl space-y-6">
                    {/* 헤더 스켈레톤 */}
                    <div className="card-white rounded-xl p-4 sm:p-6 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <Skeleton variant="text" width="300px" height={32} />
                            <Skeleton variant="rectangular" width="200px" height={60} />
                        </div>
                        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            {Array.from({ length: 8 }).map((_, idx) => (
                                <Skeleton key={idx} variant="rectangular" width="100px" height={24} />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <Skeleton key={idx} variant="rectangular" height={80} />
                            ))}
                        </div>
                    </div>

                    {/* 층 선택 스켈레톤 */}
                    <div className="space-y-4 mb-6">
                        <Skeleton variant="rectangular" width="300px" height={40} />
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <Skeleton key={idx} variant="rectangular" width="100px" height={40} />
                            ))}
                        </div>
                    </div>

                    {/* 객실 그리드 스켈레톤 */}
                    <div className="card-white rounded-xl p-6">
                        <Skeleton variant="text" width="200px" height={28} className="mb-6" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {Array.from({ length: 12 }).map((_, idx) => (
                                <Skeleton key={idx} variant="card" height={180} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 사용자 등록 후 초대 확인
    const handleRegister = async (userData: UserRegistrationData): Promise<void> => {
        const newUser = registerUser(userData);
        setShowRegistrationModal(false);

        // 성별에 맞는 층으로 이동
        const defaultFloor = floors.find(f => floorInfo[f].gender === newUser.gender);
        if (defaultFloor) {
            setSelectedFloor(defaultFloor);
        }

        // 대기 중인 초대 확인
        const invitations = await checkPendingInvitations(newUser.name);
        if (invitations.length > 0) {
            setPendingInvitation(invitations[0]); // 첫 번째 초대만 처리
        }
    };

    // 초대 수락
    const handleAcceptInvitation = async (): Promise<void> => {
        if (!pendingInvitation || !user) return;

        setInvitationLoading(true);
        try {
            const roomNumber = await acceptInvitation(pendingInvitation.id!, {
                name: user.name,
                company: user.company || '',
                gender: user.gender,
                age: user.age,
                sessionId: user.sessionId,
                registeredAt: Date.now()
            });

            // 사용자 상태 업데이트
            selectUserRoom(roomNumber);
            setPendingInvitation(null);
        } catch (error: unknown) {
            const errorMessage = handleErrorText(error, {
                action: '초대 수락',
                component: 'App'
            });
            toast.error(errorMessage);
        } finally {
            setInvitationLoading(false);
        }
    };

    // 초대 거절
    const handleRejectInvitation = async (): Promise<void> => {
        if (!pendingInvitation || !user) return;

        setInvitationLoading(true);
        try {
            await rejectInvitation(pendingInvitation.id!, {
                sessionId: user.sessionId
            });
            setPendingInvitation(null);
        } catch (error) {
            // 초대 거절 실패는 사용자 경험에 큰 영향을 주지 않으므로 조용히 로깅
            console.warn('초대 거절 처리 중 오류 (무시됨):', error);
        } finally {
            setInvitationLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100">
            <div className="max-w-7xl mx-auto">
                {/* Firebase 연결 상태 */}
                {!isFirebaseConnected && (
                    <div className="warning-box mb-4 text-center">
                        <p className="text-amber-700 text-sm">
                            ⚠️ Firebase 미연결 - 로컬 모드로 동작 중 (데이터가 이 브라우저에만 저장됩니다)
                        </p>
                    </div>
                )}

                {/* 거절 알림 */}
                {rejectionNotification && (
                    <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-300 rounded-lg p-4 shadow-lg max-w-sm">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">😢</span>
                            <div>
                                <p className="font-medium text-red-800">룸메이트 거절</p>
                                <p className="text-red-700 text-sm">
                                    {rejectionNotification.inviteeName}님께서 룸메이트 지정을 거부하셨습니다.
                                </p>
                            </div>
                            <button
                                onClick={async (): Promise<void> => {
                                    // DB에서 초대 삭제 (다시 나타나지 않도록)
                                    if (rejectionNotification.id && database) {
                                        try {
                                            await set(ref(database, `roommateInvitations/${rejectionNotification.id}`), null);
                                        } catch (e) {
                                            console.error('Failed to delete invitation:', e);
                                        }
                                    }
                                    setRejectionNotification(null);
                                }}
                                className="text-red-500 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* 헤더 */}
                <Header
                    user={user}
                    stats={stats}
                    onUserClick={handleUserClick}
                />

                {/* 미등록 사용자 안내 */}
                {!isRegistered && (
                    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center mb-6 shadow-sm">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">객실 배정 등록 요청</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            객실 배정을 위해 정보를 입력해주세요.
                        </p>
                        <button
                            onClick={() => setShowRegistrationModal(true)}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            등록하기
                        </button>
                    </div>
                )}

                {/* 선택 완료 안내 */}
                {user?.locked && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl shadow-md">
                                ✓
                            </div>
                            <div>
                                <h3 className="font-bold text-emerald-700">객실 선택 완료!</h3>
                                <p className="text-emerald-600">
                                    <span className="font-semibold">{user.selectedRoom}호</span>에 배정되었습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 층 선택 탭 */}
                <FloorSelector
                    selectedFloor={selectedFloor}
                    onSelectFloor={setSelectedFloor}
                    userGender={user?.gender}
                    roomTypeFilter={roomTypeFilter}
                    onRoomTypeFilterChange={setRoomTypeFilter}
                />

                {/* 객실 그리드 */}
                <RoomGrid
                    selectedFloor={selectedFloor}
                    userGender={user?.gender}
                    getRoomStatus={getRoomStatus}
                    isMyRoom={isMyRoom}
                    onRoomClick={handleRoomClick}
                    onSingleRoomClick={() => setShowSingleRoomModal(true)}
                    canUserSelect={canSelect}
                    isAdmin={false}
                    roomTypeFilter={roomTypeFilter}
                    highlightedRoom={highlightedRoom}
                    isLoading={roomsLoading}
                />

                {/* Lazy loaded 모달들 (Suspense 필요) */}
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
                    {/* 등록 모달 */}
                    {showRegistrationModal && (
                        <RegistrationModal
                            onClose={() => setShowRegistrationModal(false)}
                        />
                    )}

                    {/* 추가 정보 입력 모달 */}
                    {showAdditionalInfoModal && user && (
                        <AdditionalInfoModal
                            user={user}
                            onUpdate={async (updatedData: UserUpdateData) => {
                                await updateUser(updatedData);
                                setShowAdditionalInfoModal(false);

                                // 성별에 맞는 층으로 자동 이동
                                if (updatedData.gender) {
                                    const defaultFloor = floors.find(f => floorInfo[f].gender === updatedData.gender);
                                    if (defaultFloor) {
                                        setSelectedFloor(defaultFloor);
                                    }
                                }
                            }}
                        />
                    )}

                    {/* 룸메이트 초대 모달 - 방 미배정 사용자에게만 표시 */}
                    {pendingInvitation && !user?.selectedRoom && (
                        <InvitationModal
                            invitation={pendingInvitation}
                            onAccept={handleAcceptInvitation}
                            onReject={handleRejectInvitation}
                            isLoading={invitationLoading}
                        />
                    )}

                    {/* 내 방 정보 모달 */}
                    {showMyRoomModal && user?.locked && (
                        <MyRoomModal
                            user={user}
                            roomGuests={roomGuests}
                            onRequestChange={async (requestData: Omit<RoomChangeRequest, 'id' | 'status' | 'createdAt' | 'processedAt' | 'resolvedAt'>) => {
                                await createRoomChangeRequest(requestData);
                            }}
                            onReinvite={async (roommateName: string) => {
                                if (user.selectedRoom) {
                                    await createRoommateInvitation(
                                        { ...user, roomNumber: user.selectedRoom },
                                        roommateName
                                    );
                                }
                            }}
                            onClose={() => setShowMyRoomModal(false)}
                        />
                    )}

                    {/* 선택 확인 모달 */}
                    {selectedRoomForConfirm && user && (
                        <SelectionModal
                            roomNumber={selectedRoomForConfirm}
                            roomStatus={getRoomStatus(selectedRoomForConfirm, user.gender, false)}
                            user={user}
                            onConfirm={handleConfirmSelection}
                            onCancel={() => setSelectedRoomForConfirm(null)}
                        />
                    )}

                    {/* 매칭 경고 모달 */}
                    {showWarningModal && (
                        <MatchingWarningModal
                            warnings={warningContent}
                            onConfirm={handleWarningConfirmed}
                            onCancel={() => {
                                setShowWarningModal(false);
                                setPendingSelection(null);
                            }}
                        />
                    )}

                    {/* 대기 모달 (Guest) */}
                    {mySentRequest && (
                        <WaitingApprovalModal
                            onCancel={() => mySentRequest.id && cancelRequest(mySentRequest.id)}
                        />
                    )}

                    {/* 요청 수신 모달 (Host) */}
                    {requests.received.length > 0 && (
                        <JoinRequestModal
                            request={requests.received[0]}
                            onAccept={async () => {
                                try {
                                    if (requests.received[0].id) {
                                        await acceptRequest(requests.received[0].id, requests.received[0]);
                                        // 수락 완료 후 요청 정리
                                        await cleanup(requests.received[0].id);
                                        // 객실 선택 모달이 열려있으면 닫기
                                        setSelectedRoomForConfirm(null);
                                        toast.success('입실 요청을 수락했습니다.');
                                    }
                                } catch (error: unknown) {
                                    const errorMessage = handleErrorText(error, {
                                        action: '입실 요청 수락',
                                        component: 'App'
                                    });
                                    toast.error(errorMessage);
                                }
                            }}
                            onReject={async () => {
                                try {
                                    if (requests.received[0].id) {
                                        await rejectRequest(requests.received[0].id);
                                        // 거절 후 요청은 Guest 측에서 cleanup 함
                                    }
                                } catch (error: unknown) {
                                    const errorMessage = handleErrorText(error, {
                                        action: '입실 요청 거절',
                                        component: 'App'
                                    });
                                    toast.error(errorMessage);
                                }
                            }}
                        />
                    )}

                    {/* 방 배정 취소 알림 모달 */}
                    {showCancelledModal && (
                        <CancelledModal
                            onRecoverAndReload={async () => {
                                if (updateUser) {
                                    await updateUser({ selectedRoom: null, locked: false });
                                }
                                window.location.reload();
                            }}
                        />
                    )}

                    {/* 1인실 안내 모달 */}
                    {showSingleRoomModal && (
                        <SingleRoomInfoModal onClose={() => setShowSingleRoomModal(false)} />
                    )}

                    {/* 검색 모달 */}
                    {showSearchModal && (
                        <SearchModal
                            roomGuests={roomGuests}
                            onClose={() => setShowSearchModal(false)}
                            onRoomClick={(roomNumber: string) => {
                                // 해당 층으로 이동
                                const room = (roomData as Record<string, { floor: number }>)[roomNumber];
                                if (room) {
                                    setSelectedFloor(room.floor);
                                    // 하이라이트 효과
                                    setHighlightedRoom(roomNumber);
                                    setTimeout(() => setHighlightedRoom(null), 3000);
                                }
                            }}
                        />
                    )}
                </Suspense>

                {/* 플로팅 검색 버튼 */}
                <button
                    onClick={() => setShowSearchModal(true)}
                    className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-transform hover:scale-110"
                    title="검색"
                >
                    🔍
                </button>

                <footer className="mt-8 py-4 border-t border-gray-200 flex justify-between items-center px-4">
                    <p className="text-gray-500 text-sm">KVCA V-Up 객실 배정 시스템</p>
                    <a href="/contact" className="text-blue-600 hover:text-blue-700 text-sm transition-colors">
                        1:1 문의사항
                    </a>
                </footer>
            </div>
        </div>
    );
}

