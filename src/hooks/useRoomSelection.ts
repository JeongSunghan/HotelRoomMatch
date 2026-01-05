import { useCallback } from 'react';
import { roomData } from '../data/roomData';
import { checkCompatibility } from '../utils/matchingUtils';
import { sanitizeName } from '../utils/sanitize';
import {
    createRoommateInvitation,
    logGuestAdd
} from '../firebase/index';
import { useToast } from '../components/ui/Toast';
import type { User, RoomGuestsMap, Guest } from '../types';

interface UseRoomSelectionProps {
    user: User | null;
    roomGuests: RoomGuestsMap;
    addGuestToRoom: (roomNumber: string, guestData: Guest) => Promise<void>;
    selectUserRoom: (roomNumber: string) => void;
    sendRequest: (requestData: {
        fromUserId: string;
        fromUserName: string;
        toRoomNumber: string;
        toUserId?: string;
        warnings?: unknown;
        guestInfo: Guest;
    }) => Promise<void>;
    setShowRegistrationModal: (show: boolean) => void;
    setSelectedRoomForConfirm: (roomNumber: string | null) => void;
    setWarningContent: (warnings: string[]) => void;
    setPendingSelection: (selection: { roomNumber: string; roommateInfo: { hasRoommate?: boolean; roommateName?: string; roommateCompany?: string } } | null) => void;
    setShowWarningModal: (show: boolean) => void;
    pendingSelection: { roomNumber: string; roommateInfo: { hasRoommate?: boolean; roommateName?: string; roommateCompany?: string } } | null;
    warningContent: string[];
}

interface UseRoomSelectionReturn {
    handleRoomClick: (roomNumber: string) => void;
    performSelection: (roomNumber: string, roommateInfo?: { hasRoommate?: boolean; roommateName?: string; roommateCompany?: string }, warningDetails?: unknown) => Promise<void>;
    handleConfirmSelection: (roomNumber: string, roommateInfo?: { hasRoommate?: boolean; roommateName?: string; roommateCompany?: string }) => Promise<void>;
    handleWarningConfirmed: () => Promise<void>;
}

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
}: UseRoomSelectionProps): UseRoomSelectionReturn {
    const toast = useToast();

    // 객실 클릭 핸들러 (보안 검증 포함)
    const handleRoomClick = useCallback((roomNumber: string): void => {
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
        const room = (roomData as Record<string, { gender?: string }>)[roomNumber];
        if (room && room.gender !== user.gender) {
            console.warn('보안: 성별 불일치 방 클릭 시도');
            return;
        }

        setSelectedRoomForConfirm(roomNumber);
    }, [user, setShowRegistrationModal, setSelectedRoomForConfirm]);

    // 실제 객실 배정 실행
    const performSelection = useCallback(async (
        roomNumber: string,
        roommateInfo: { hasRoommate?: boolean; roommateName?: string; roommateCompany?: string } = {},
        warningDetails: unknown = null
    ): Promise<void> => {
        if (!user) return;

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
                sessionId: user.sessionId,
                gender: user.gender
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
            const errorMessage = error instanceof Error ? error.message : '객실 선택에 실패했습니다.';
            (toast as { error: (msg: string) => void }).error(errorMessage);
            setSelectedRoomForConfirm(null);
            setPendingSelection(null);
        }
    }, [user, addGuestToRoom, selectUserRoom, setSelectedRoomForConfirm, setPendingSelection, toast]);

    // 객실 선택 확정 (매칭 검증 포함)
    const handleConfirmSelection = useCallback(async (
        roomNumber: string,
        roommateInfo: { hasRoommate?: boolean; roommateName?: string; roommateCompany?: string } = {}
    ): Promise<void> => {
        if (!user) return;

        // 이미 배정됨 재검증
        if (user.locked || user.selectedRoom) {
            (toast as { warning: (msg: string) => void }).warning('이미 객실이 배정되어 있습니다.');
            setSelectedRoomForConfirm(null);
            return;
        }

        // 성별 불일치 재검증
        const room = (roomData as Record<string, { gender?: string }>)[roomNumber];
        if (room && room.gender !== user.gender) {
            (toast as { error: (msg: string) => void }).error('성별이 맞지 않는 객실입니다.');
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

        await performSelection(roomNumber, roommateInfo);
    }, [user, roomGuests, setSelectedRoomForConfirm, setWarningContent, setPendingSelection, setShowWarningModal, performSelection, toast]);

    // 경고 확인 후 승인 요청 전송
    const handleWarningConfirmed = useCallback(async (): Promise<void> => {
        if (!pendingSelection || !user) return;

        const { roomNumber, roommateInfo } = pendingSelection;
        const currentGuests = roomGuests[roomNumber] || [];
        const roommate = Array.isArray(currentGuests) ? currentGuests[0] : (Object.values(currentGuests)[0] as Guest | undefined);

        if (!roommate || !roommate.sessionId) {
            await performSelection(roomNumber, roommateInfo);
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

