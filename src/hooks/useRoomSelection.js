import { useCallback } from 'react';
import { roomData } from '../data/roomData';
import { checkCompatibility } from '../utils/matchingUtils';
import { sanitizeName } from '../utils/sanitize';
import {
    createRoommateInvitation,
    reserveRoom,
    releaseRoomReservation,
    logGuestAdd
} from '../firebase/index';
import { useToast } from '../components/ui/Toast';

/**
 * 객실 선택 로직을 관리하는 커스텀 훅
 * App.jsx에서 분리하여 코드 복잡도 감소
 */
export function useRoomSelection({
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
    onRoomReserved,
    pendingSelection,
    warningContent
}) {
    const toast = useToast();

    // 객실 클릭 핸들러 (보안 검증 포함)
    const handleRoomClick = useCallback((roomNumber) => {
        // 1. 유저 등록 여부 확인
        if (!user) {
            setShowRegistrationModal(true);
            return;
        }

        // 2. 이미 방 배정됨 확인
        if (user.locked || user.selectedRoom) {
            console.warn('보안: 이미 배정된 유저가 방 클릭 시도');
            return;
        }

        // 3. 성별 불일치 확인
        const room = roomData[roomNumber];
        if (room && room.gender !== user.gender) {
            console.warn('보안: 성별 불일치 방 클릭 시도');
            return;
        }

        // PHASE 3: 60초 임시 예약(reserved) 선점
        (async () => {
            try {
                const r = await reserveRoom(roomNumber, user.sessionId);
                if (!r.ok) {
                    // Case 1: pending 잠금(룸메이트 수락 대기)
                    if (r.reason === 'pending' || r.pending) {
                        toast.warning('룸메이트 수락 대기 중인 객실입니다.');
                        return;
                    }

                    // Case 2: reserved(임시 예약)
                    const expiresAt = r.reservation?.expiresAt ? Number(r.reservation.expiresAt) : null;
                    const remainingSec = expiresAt ? Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000)) : null;
                    if (onRoomReserved && expiresAt) {
                        onRoomReserved({ roomNumber, expiresAt });
                    } else {
                        toast.warning(remainingSec ? `다른 사용자가 선택 중입니다. (${remainingSec}초 후 재시도)` : '다른 사용자가 선택 중입니다.');
                    }
                    return;
                }
                setSelectedRoomForConfirm(roomNumber);
            } catch (e) {
                toast.error(e?.message || '예약 처리 중 오류가 발생했습니다.');
            }
        })();
    }, [user, setShowRegistrationModal, setSelectedRoomForConfirm, toast, onRoomReserved]);

    // 실제 객실 배정 실행
    const performSelection = useCallback(async (roomNumber, roommateInfo = {}, warningDetails = null) => {
        try {
            await addGuestToRoom(roomNumber, {
                name: user.name,
                company: user.company || '',
                position: user.position || '',
                email: user.email || '',
                singleRoom: user.singleRoom || 'N',
                gender: user.gender,
                age: user.age,
                sessionId: user.sessionId,
                registeredAt: Date.now(),
                snoring: user.snoring || 'no'
            });

            await logGuestAdd(roomNumber, {
                name: user.name,
                company: user.company,
                sessionId: user.sessionId
            }, 'user', warningDetails);

            // 1인실에서는 룸메이트/초대 기능을 노출하지 않음
            const room = roomData[roomNumber];
            if (room?.capacity === 2 && roommateInfo.hasRoommate && roommateInfo.roommateName) {
                await createRoommateInvitation(
                    { ...user, roomNumber },
                    sanitizeName(roommateInfo.roommateName)
                );
            }

            selectUserRoom(roomNumber);
            setSelectedRoomForConfirm(null);
            setPendingSelection(null);

            // 확정 후 예약 해제(베스트 에포트)
            await releaseRoomReservation(roomNumber, user.sessionId);
        } catch (error) {
            toast.error(error.message || '객실 선택에 실패했습니다.');
            setSelectedRoomForConfirm(null);
            setPendingSelection(null);

            // 실패 시 예약 해제(베스트 에포트)
            try {
                await releaseRoomReservation(roomNumber, user.sessionId);
            } catch (_) {
                // ignore
            }
        }
    }, [user, addGuestToRoom, selectUserRoom, setSelectedRoomForConfirm, setPendingSelection, toast]);

    // 선택 모달 취소(예약 해제 포함)
    const handleCancelSelection = useCallback(async (roomNumber) => {
        if (user?.sessionId && roomNumber) {
            try {
                await releaseRoomReservation(roomNumber, user.sessionId);
            } catch (_) {
                // ignore
            }
        }
        setSelectedRoomForConfirm(null);
        setPendingSelection(null);
    }, [user?.sessionId, setSelectedRoomForConfirm, setPendingSelection]);

    // 객실 선택 확정 (매칭 검증 포함)
    const handleConfirmSelection = useCallback(async (roomNumber, roommateInfo = {}) => {
        if (!user) return;

        // 이미 배정됨 재검증
        if (user.locked || user.selectedRoom) {
            toast.warning('이미 객실이 배정되어 있습니다.');
            setSelectedRoomForConfirm(null);
            return;
        }

        // 성별 불일치 재검증
        const room = roomData[roomNumber];
        if (room && room.gender !== user.gender) {
            toast.error('성별이 맞지 않는 객실입니다.');
            setSelectedRoomForConfirm(null);
            return;
        }

        // 매칭 적합성 검사
        const currentGuests = roomGuests[roomNumber] || [];
        const roommate = Array.isArray(currentGuests) ? currentGuests[0] : Object.values(currentGuests)[0];

        if (roommate) {
            const warnings = checkCompatibility(user, roommate);
            if (warnings.length > 0) {
                setWarningContent(warnings);
                setPendingSelection({ roomNumber, roommateInfo });
                setShowWarningModal(true);
                return;
            }
        }

        performSelection(roomNumber, roommateInfo);
    }, [user, roomGuests, setSelectedRoomForConfirm, setWarningContent, setPendingSelection, setShowWarningModal, performSelection, toast]);

    // 경고 확인 후 승인 요청 전송
    const handleWarningConfirmed = useCallback(async () => {
        if (!pendingSelection) return;

        const { roomNumber, roommateInfo } = pendingSelection;
        const currentGuests = roomGuests[roomNumber] || [];
        const roommate = Array.isArray(currentGuests) ? currentGuests[0] : Object.values(currentGuests)[0];

        if (!roommate) {
            performSelection(roomNumber, roommateInfo);
            return;
        }

        await sendRequest({
            fromUserId: user.sessionId,
            fromUserName: user.name,
            toRoomNumber: roomNumber,
            toUserId: roommate.sessionId,
            warnings: warningContent,
            guestInfo: {
                name: user.name,
                company: user.company || '',
                gender: user.gender,
                age: user.age,
                sessionId: user.sessionId,
                registeredAt: Date.now(),
                snoring: user.snoring || 'no'
            }
        });

        setShowWarningModal(false);
        setPendingSelection(null);
    }, [user, roomGuests, pendingSelection, warningContent, sendRequest, performSelection, setShowWarningModal, setPendingSelection]);

    return {
        handleRoomClick,
        performSelection,
        handleConfirmSelection,
        handleWarningConfirmed,
        handleCancelSelection
    };
}
