import { useCallback } from 'react';
import { roomData } from '../data/roomData';
import { checkCompatibility } from '../utils/matchingUtils';
import { sanitizeName } from '../utils/sanitize';
import {
    createRoommateInvitation,
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

        setSelectedRoomForConfirm(roomNumber);
    }, [user, setShowRegistrationModal, setSelectedRoomForConfirm]);

    // 실제 객실 배정 실행
    const performSelection = useCallback(async (roomNumber, roommateInfo = {}, warningDetails = null) => {
        try {
            await addGuestToRoom(roomNumber, {
                name: user.name,
                company: user.company || '',
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

            if (roommateInfo.hasRoommate && roommateInfo.roommateName) {
                await createRoommateInvitation(
                    { ...user, roomNumber },
                    sanitizeName(roommateInfo.roommateName)
                );
            }

            selectUserRoom(roomNumber);
            setSelectedRoomForConfirm(null);
            setPendingSelection(null);
        } catch (error) {
            toast.error(error.message || '객실 선택에 실패했습니다.');
            setSelectedRoomForConfirm(null);
            setPendingSelection(null);
        }
    }, [user, addGuestToRoom, selectUserRoom, setSelectedRoomForConfirm, setPendingSelection, toast]);

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
        handleWarningConfirmed
    };
}
