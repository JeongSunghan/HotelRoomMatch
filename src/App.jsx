import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import Header from './components/ui/Header';
import FloorSelector from './components/ui/FloorSelector';
import RoomGrid from './components/room/RoomGrid';
import UserProfilePanel from './components/ui/UserProfilePanel';
import { useUser } from './hooks/useUser';
import { useRooms } from './hooks/useRooms';
import { useRoomSelection } from './hooks/useRoomSelection';
import { useUI } from './contexts/UIContext';
import { floors, floorInfo, roomData } from './data/roomData';
import { useJoinRequests } from './hooks/useJoinRequests';
import { useInvitationHandlers } from './hooks/useInvitationHandlers';
import { useRequestHandlers } from './hooks/useRequestHandlers';
import { useFloorNavigation } from './hooks/useFloorNavigation';
import { createRoommateInvitation, createRoomChangeRequest } from './firebase/index';
import { useToast } from './components/ui/Toast';

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
const ReservedRedirectModal = lazy(() => import('./components/room/ReservedRedirectModal'));


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
    const setShowRegistrationModal = (val) => val ? openModal(MODAL_TYPES.REGISTRATION) : closeModal(MODAL_TYPES.REGISTRATION);
    const setShowAdditionalInfoModal = (val) => val ? openModal(MODAL_TYPES.ADDITIONAL_INFO) : closeModal(MODAL_TYPES.ADDITIONAL_INFO);
    const setShowMyRoomModal = (val) => val ? openModal(MODAL_TYPES.MY_ROOM) : closeModal(MODAL_TYPES.MY_ROOM);
    const setShowSingleRoomModal = (val) => val ? openModal(MODAL_TYPES.SINGLE_ROOM) : closeModal(MODAL_TYPES.SINGLE_ROOM);
    const setShowSearchModal = (val) => val ? openModal(MODAL_TYPES.SEARCH) : closeModal(MODAL_TYPES.SEARCH);
    const setShowWarningModal = (val) => val ? openModal(MODAL_TYPES.WARNING) : closeModal(MODAL_TYPES.WARNING);
    const setSelectedRoomForConfirm = (roomNum) => {
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
    } = useJoinRequests(user?.sessionId);

    // 객실 선택 로직 Hook
    const {
        handleRoomClick,
        handleConfirmSelection,
        handleWarningConfirmed,
        handleCancelSelection
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
        onRoomReserved: ({ roomNumber, expiresAt }) => {
            setReservedRedirect({ roomNumber, expiresAt });
        },
        pendingSelection,
        warningContent
    });

    // 내 요청 상태 감지 (Guest)
    const mySentRequest = requests.sent.find(r => r.status === REQUEST_STATUS.PENDING);

    // 초대 시스템 Hook
    const {
        pendingInvitation,
        invitationLoading,
        rejectionNotification,
        handleRegister,
        handleAcceptInvitation,
        handleRejectInvitation,
        clearRejectionNotification
    } = useInvitationHandlers(
        user,
        registerUser,
        selectUserRoom,
        setSelectedFloor,
        () => closeModal(MODAL_TYPES.REGISTRATION),
        toast,
        floors,
        floorInfo
    );

    // 요청 처리 Hook
    const {
        handleAcceptRequest,
        handleRejectRequest
    } = useRequestHandlers(
        user,
        requests,
        toast,
        cleanup,
        acceptRequest,
        rejectRequest,
        (room) => openSelectionModal(room),
        (show) => show ? openModal(MODAL_TYPES.WARNING) : closeModal(MODAL_TYPES.WARNING),
        setPendingSelection,
        REQUEST_STATUS
    );

    // 층 네비게이션 Hook
    const {
        highlightedRoom,
        navigateToRoom
    } = useFloorNavigation(user, selectedFloor, setSelectedFloor);

    // 방 배정 취소 알림 모달
    const [showCancelledModal, setShowCancelledModal] = useState(false);

    // PHASE 3 (Case 2): reserved 클릭 안내 모달
    const [reservedRedirect, setReservedRedirect] = useState(null); // { roomNumber, expiresAt }

    // 사용자 성별에 맞는 기본 층 설정 (초기 진입 시)
    useEffect(() => {
        if (selectedFloor !== null) return;

        const defaultFloor = user?.gender
            ? floors.find(f => floorInfo[f].gender === user.gender)
            : null;

        setSelectedFloor(defaultFloor || floors[0]);
    }, [user?.gender, selectedFloor]);

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

    // 통계 계산
    const stats = useMemo(() => {
        return {
            male: getStats('M'),
            female: getStats('F'),
            total: getStats()
        };
    }, [getStats]);

    // 로딩 중
    if (userLoading || roomsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">로딩 중...</p>
                </div>
            </div>
        );
    }

    // Admin 로그인
    const handleAdminLogin = async (email, password) => {
        setAdminLoginLoading(true);
        setAdminLoginError(null);
        try {
            await loginAdmin(email, password);
            setShowAdminLoginModal(false);
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                setAdminLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');
            } else if (error.code === 'auth/invalid-email') {
                setAdminLoginError('올바른 이메일 형식이 아닙니다.');
            } else {
                setAdminLoginError('로그인에 실패했습니다.');
            }
        } finally {
            setAdminLoginLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-6">
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
                                onClick={clearRejectionNotification}
                                className="text-red-500 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* 헤더 */}
                <Header
                    stats={stats}
                />

                {/* STEP 1-2: User Profile / Room Assignment 영역 분리 */}
                <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
                    {/* User Profile 영역 */}
                    <div className="space-y-6">
                        <UserProfilePanel
                            user={user}
                            isRegistered={isRegistered}
                            onRegisterClick={() => setShowRegistrationModal(true)}
                            onOpenMyRoom={() => user?.locked && openModal(MODAL_TYPES.MY_ROOM)}
                        />
                    </div>

                    {/* Room Assignment 영역 */}
                    <div className="space-y-6">
                        <FloorSelector
                            selectedFloor={selectedFloor}
                            onSelectFloor={setSelectedFloor}
                            userGender={user?.gender}
                            roomTypeFilter={roomTypeFilter}
                            onRoomTypeFilterChange={setRoomTypeFilter}
                        />

                        <RoomGrid
                            selectedFloor={selectedFloor}
                            userGender={user?.gender}
                            canSelectSingleRoom={user?.singleRoom === 'Y'}
                            mySessionId={user?.sessionId}
                            getRoomStatus={getRoomStatus}
                            isMyRoom={isMyRoom}
                            onRoomClick={handleRoomClick}
                            onSingleRoomClick={() => setShowSingleRoomModal(true)}
                            canUserSelect={canSelect}
                            roomTypeFilter={roomTypeFilter}
                            highlightedRoom={highlightedRoom}
                        />
                    </div>
                </div>

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
                            onUpdate={(updatedData) => {
                                updateUser(updatedData);
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
                            onRequestChange={async (requestData) => {
                                await createRoomChangeRequest(requestData);
                            }}
                            onReinvite={async (roommateName) => {
                                await createRoommateInvitation(
                                    { ...user, roomNumber: user.selectedRoom },
                                    roommateName
                                );
                            }}
                            onClose={() => setShowMyRoomModal(false)}
                        />
                    )}

                    {/* 선택 확인 모달 */}
                    {selectedRoomForConfirm && user && (
                        <SelectionModal
                            roomNumber={selectedRoomForConfirm}
                            roomStatus={getRoomStatus(selectedRoomForConfirm, user.gender, false, user?.singleRoom === 'Y', user?.sessionId)}
                            user={user}
                            onConfirm={handleConfirmSelection}
                            onCancel={() => handleCancelSelection(selectedRoomForConfirm)}
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
                            onCancel={() => cancelRequest(mySentRequest.id)}
                        />
                    )}

                    {/* 요청 수신 모달 (Host) */}
                    {requests.received.length > 0 && (
                        <JoinRequestModal
                            request={requests.received[0]}
                            onAccept={async () => {
                                try {
                                    await acceptRequest(requests.received[0].id, requests.received[0]);
                                    // 수락 완료 후 요청 정리
                                    await cleanup(requests.received[0].id);
                                    // 객실 선택 모달이 열려있으면 닫기
                                    setSelectedRoomForConfirm(null);
                                    toast.success('입실 요청을 수락했습니다.');
                                } catch (error) {
                                    toast.error('수락 처리 중 오류: ' + error.message);
                                }
                            }}
                            onReject={async () => {
                                try {
                                    await rejectRequest(requests.received[0].id);
                                    // 거절 후 요청은 Guest 측에서 cleanup 함
                                } catch (error) {
                                    toast.error('거절 처리 중 오류: ' + error.message);
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

                    {/* PHASE 3 (Case 2): reserved 클릭 안내 모달 */}
                    {reservedRedirect?.roomNumber && reservedRedirect?.expiresAt && (
                        <ReservedRedirectModal
                            roomNumber={reservedRedirect.roomNumber}
                            expiresAt={reservedRedirect.expiresAt}
                            onClose={() => setReservedRedirect(null)}
                        />
                    )}

                    {/* 검색 모달 */}
                    {showSearchModal && (
                        <SearchModal
                            roomGuests={roomGuests}
                            onClose={() => setShowSearchModal(false)}
                            onRoomClick={(roomNumber) => {
                                // 해당 층으로 이동
                                const room = roomData[roomNumber];
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

                <footer className="footer flex justify-between items-center px-4">
                    <p>KVCA V-Up 객실 배정 시스템</p>
                    <a href="/contact" className="text-gray-400 hover:text-gray-600 text-sm underline">
                        1:1 문의사항
                    </a>
                </footer>
            </div>
        </div>
    );
}
