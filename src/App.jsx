import { useState, useMemo, useEffect } from 'react';
import Header from './components/ui/Header';
import FloorSelector from './components/ui/FloorSelector';
import RoomGrid from './components/room/RoomGrid';
import RegistrationModal from './components/auth/RegistrationModal';
import SelectionModal from './components/room/SelectionModal';
import InvitationModal from './components/room/InvitationModal';
import MyRoomModal from './components/room/MyRoomModal';
import { useUser } from './hooks/useUser';
import { useRooms } from './hooks/useRooms';
import { floors, floorInfo, roomData } from './data/roomData';
import {
    checkPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    createRoommateInvitation,
    subscribeToMyInvitations,
    createRoomChangeRequest
} from './firebase/index';

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

    // UI 상태
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [selectedRoomForConfirm, setSelectedRoomForConfirm] = useState(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showMyRoomModal, setShowMyRoomModal] = useState(false);

    // 초대 시스템 상태
    const [pendingInvitation, setPendingInvitation] = useState(null);
    const [invitationLoading, setInvitationLoading] = useState(false);
    const [rejectionNotification, setRejectionNotification] = useState(null);

    // 방 배정 취소 알림 모달
    const [showCancelledModal, setShowCancelledModal] = useState(false);

    // 사용자 성별에 맞는 기본 층 설정
    useEffect(() => {
        if (user?.gender) {
            const defaultFloor = floors.find(f => floorInfo[f].gender === user.gender);
            if (defaultFloor && selectedFloor === null) {
                setSelectedFloor(defaultFloor);
            }
        }
    }, [user?.gender, selectedFloor]);

    // 방 삭제 실시간 동기화: 관리자가 유저를 삭제하면 rooms 구독으로 감지
    useEffect(() => {
        // 유저가 방을 선택한 상태이고 roomGuests 데이터가 로드된 경우
        if (!user?.selectedRoom || !user?.sessionId || Object.keys(roomGuests).length === 0) return;

        const myRoom = user.selectedRoom;
        const guestsInMyRoom = roomGuests[myRoom] || [];

        // 내가 아직 그 방에 있는지 확인
        const amIStillInRoom = guestsInMyRoom.some(guest => guest.sessionId === user.sessionId);

        if (!amIStillInRoom && !showCancelledModal) {
            // 관리자가 나를 삭제함 → 취소 알림 모달 표시
            setShowCancelledModal(true);
        }
    }, [roomGuests, user?.selectedRoom, user?.sessionId, showCancelledModal]);

    // 기본 층 설정 (사용자 등록 전)
    if (selectedFloor === null) {
        setSelectedFloor(floors[0]);
    }

    // 내가 보낸 초대 상태 구독 (거절 알림용)
    useEffect(() => {
        if (!user?.sessionId) return;

        const unsubscribe = subscribeToMyInvitations(user.sessionId, (myInvitations) => {
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

    // 사용자 등록 후 초대 확인
    const handleRegister = async (userData) => {
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
    const handleAcceptInvitation = async () => {
        if (!pendingInvitation || !user) return;

        setInvitationLoading(true);
        try {
            const roomNumber = await acceptInvitation(pendingInvitation.id, {
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
        } catch (error) {
            alert(error.message || '초대 수락에 실패했습니다.');
        } finally {
            setInvitationLoading(false);
        }
    };

    // 초대 거절
    const handleRejectInvitation = async () => {
        if (!pendingInvitation || !user) return;

        setInvitationLoading(true);
        try {
            await rejectInvitation(pendingInvitation.id, {
                sessionId: user.sessionId
            });
            setPendingInvitation(null);
        } catch (error) {
            // 에러 무시
        } finally {
            setInvitationLoading(false);
        }
    };

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

    // 객실 클릭 (클라이언트 보안 강화)
    const handleRoomClick = (roomNumber) => {
        // 1. 유저 등록 여부 확인
        if (!user) {
            setShowRegistrationModal(true);
            return;
        }

        // 2. 이미 방 배정됨 확인 (클라이언트 재검증)
        if (user.locked || user.selectedRoom) {
            console.warn('보안: 이미 배정된 유저가 방 클릭 시도');
            return;
        }

        // 3. 성별 불일치 확인 (클라이언트 재검증)
        const room = roomData[roomNumber];
        if (room && room.gender !== user.gender) {
            console.warn('보안: 성별 불일치 방 클릭 시도');
            return;
        }

        setSelectedRoomForConfirm(roomNumber);
    };

    // 객실 선택 확정 (클라이언트 보안 강화)
    const handleConfirmSelection = async (roomNumber, roommateInfo = {}) => {
        // 1. 유저 검증
        if (!user) return;

        // 2. 이미 배정됨 재검증 (개발자도구 우회 방지)
        if (user.locked || user.selectedRoom) {
            console.warn('보안: 이미 배정된 유저가 확정 시도');
            alert('이미 객실이 배정되어 있습니다.');
            setSelectedRoomForConfirm(null);
            return;
        }

        // 3. 성별 불일치 재검증
        const room = roomData[roomNumber];
        if (room && room.gender !== user.gender) {
            console.warn('보안: 성별 불일치 확정 시도');
            alert('성별이 맞지 않는 객실입니다.');
            setSelectedRoomForConfirm(null);
            return;
        }

        try {
            // Firebase에 저장 (서버에서 추가 검증)
            await addGuestToRoom(roomNumber, {
                name: user.name,
                company: user.company || '',
                gender: user.gender,
                age: user.age,
                sessionId: user.sessionId,
                registeredAt: Date.now()
            });

            // 룸메이트 초대 생성
            if (roommateInfo.hasRoommate && roommateInfo.roommateName) {
                await createRoommateInvitation(
                    { ...user, roomNumber },
                    roommateInfo.roommateName
                );
            }

            // 사용자 상태 업데이트
            selectUserRoom(roomNumber);
            setSelectedRoomForConfirm(null);
        } catch (error) {
            // 서버 측 검증 실패 시 사용자에게 알림
            alert(error.message || '객실 선택에 실패했습니다.');
            setSelectedRoomForConfirm(null);
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
                                onClick={() => setRejectionNotification(null)}
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
                    onUserClick={() => user?.locked && setShowMyRoomModal(true)}
                />

                {/* 미등록 사용자 안내 */}
                {!isRegistered && (
                    <div className="card-white rounded-xl p-6 text-center mb-6">
                        <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-1">객실 배정에 참여하세요</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            본인 확인을 위해 간단한 정보를 입력해주세요.
                        </p>
                        <button
                            onClick={() => setShowRegistrationModal(true)}
                            className="px-6 py-2.5 btn-primary rounded-lg font-medium text-sm"
                        >
                            등록하기
                        </button>
                    </div>
                )}

                {/* 선택 완료 안내 */}
                {user?.locked && (
                    <div className="success-box mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl">
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
                />

                {/* 객실 그리드 */}
                <RoomGrid
                    selectedFloor={selectedFloor}
                    userGender={user?.gender}
                    getRoomStatus={getRoomStatus}
                    isMyRoom={isMyRoom}
                    onRoomClick={handleRoomClick}
                    canUserSelect={canSelect}
                />

                {/* 등록 모달 */}
                {showRegistrationModal && (
                    <RegistrationModal
                        onRegister={handleRegister}
                        onClose={() => setShowRegistrationModal(false)}
                    />
                )}

                {/* 룸메이트 초대 모달 */}
                {pendingInvitation && (
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

                {/* 1인실 문의 안내 모달 */}
                {showContactModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 modal-overlay" onClick={() => setShowContactModal(false)} />
                        <div className="relative modal-card rounded-xl p-6 w-full max-w-sm text-center">
                            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">💰</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">1인실 배정 안내</h3>
                            <p className="text-gray-600 mb-4">
                                1인실은 별도 결제가 필요합니다.<br />
                                아래 담당자에게 연락해주세요.
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-blue-800 font-bold text-lg">📞 02-3017-7092</p>
                                <p className="text-blue-600 text-sm mt-1">담당자에게 연락해주세요</p>
                            </div>
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="w-full py-3 btn-primary rounded-lg font-medium"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                )}

                {/* 방 배정 취소 알림 모달 */}
                {showCancelledModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                        <div className="relative bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">
                                방 배정이 취소되었습니다
                            </h2>
                            <p className="text-gray-600 mb-6">
                                관리자에 의해 방 배정이 취소되었습니다.<br />
                                사이트를 새로고침해주세요.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                            >
                                🔄 새로고침
                            </button>
                        </div>
                    </div>
                )}
                <footer className="footer">
                    <p>KVCA V-Up 객실 배정 시스템</p>
                </footer>
            </div>
        </div>
    );
}
