import { useCallback, useEffect, useRef } from 'react';
import { roomData } from '../data/roomData';
import { checkCompatibility } from '../utils/matchingUtils';
import { sanitizeName } from '../utils/sanitize';
import {
    createRoommateInvitation,
    logGuestAdd,
    // 예약 시스템
    createRoomReservation,
    checkRoomReservation,
    releaseRoomReservation,
    RESERVATION_TYPE,
    RESERVATION_TIMEOUT
} from '../firebase/index';
import { useToast } from '../components/ui/Toast';

/**
 * 객실 선택 로직을 관리하는 커스텀 훅
 * - 예약 시스템 통합: 동시 선택 방지
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
    warningContent,
    // 선택 확인 모달용 방 번호 (App.jsx에서 전달받음 - selectedRoomForConfirm)
    selectedRoomNumber,
    // 예약 차단 모달 (UIContext에서 전달)
    openReservationBlockedModal
}) {
    const toast = useToast();

    // 자동 취소 타이머 ref
    const autoCancelTimerRef = useRef(null);

    /**
     * 선택 확인 모달이 열려있을 때 타임아웃 체크 (60초)
     * - selectedRoomNumber는 App.jsx에서 selectedRoomForConfirm 값을 전달받아야 함
     * - 하지만 현재 prop 구조상 selectedRoomNumber가 전달되지 않고 있어서
     * - 내부 함수들에서 사용하는 state인 setSelectedRoomForConfirm 호출 시점에 타이머를 동작시키는 것이 나음
     * - 혹은 App.jsx에서 타이머를 돌려야 함.
     * 
     * [수정] useRoomSelection은 Hook이라 state를 직접 갖지 않음.
     * 따라서 이 방식(useEffect)보다는, selectedRoomNumber를 prop으로 받아와야 함.
     * 현재 useRoomSelection 호출부를 보면 user, roomGuests 등만 전달함.
     * 
     * -> 해결책: selectedRoomForConfirm은 App.jsx의 state이므로 여기서 감지하려면 
     *    useRoomSelection에 selectedRoomNumber prop을 추가해야 함.
     */

    // [Note] 이 훅은 App.jsx에서 호출됨. 
    // selectedRoomForConfirm(=== selectedRoomNumber) 값을 인자로 받고 있지 않으므로
    // App.jsx에서 이 훅을 호출할 때 selectedRoomNumber={selectedRoomForConfirm} 을 추가해줘야 함.

    // 일단은 handleCancelSelection 정의가 필요하므로 먼저 정의 (순환 참조 방지)
    /**
     * 선택 취소 시 예약 해제
     */
    const handleCancelSelection = useCallback(async (roomNumber) => {
        if (user && roomNumber) {
            await releaseRoomReservation(roomNumber, user.sessionId).catch(() => { });
        }
        setSelectedRoomForConfirm(null);
        setPendingSelection(null);
    }, [user, setSelectedRoomForConfirm, setPendingSelection]);

    // 예약 자동 취소 (리다이렉션) 효과
    useEffect(() => {
        // 타이머 정리
        if (autoCancelTimerRef.current) {
            clearTimeout(autoCancelTimerRef.current);
            autoCancelTimerRef.current = null;
        }

        if (selectedRoomNumber) {
            // 60초 후 자동 취소
            autoCancelTimerRef.current = setTimeout(() => {
                handleCancelSelection(selectedRoomNumber);
                alert('예약 시간이 초과되었습니다. 메인 화면으로 이동합니다.');
            }, RESERVATION_TIMEOUT.SELECTION);
        }

        return () => {
            if (autoCancelTimerRef.current) {
                clearTimeout(autoCancelTimerRef.current);
            }
        };
    }, [selectedRoomNumber, handleCancelSelection, toast]);


    /**
     * 객실 클릭 핸들러 (보안 검증 + 예약 검증)
     */
    const handleRoomClick = useCallback(async (roomNumber) => {
        // ... (이전 코드 유지)
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

        // 3-1. 1인실 권한 확인
        if (room && room.capacity === 1 && user.singleRoom !== 'Y') {
            toast.error('1인실 배정 대상자가 아닙니다.');
            return;
        }

        // 4. 예약 상태 확인 (동시 선택 방지)
        try {
            const reservationStatus = await checkRoomReservation(roomNumber);

            if (reservationStatus.isReserved) {
                const reservation = reservationStatus.reservation;

                // 본인의 예약이면 진행 허용
                if (reservation.reservedBy === user.sessionId) {
                    setSelectedRoomForConfirm(roomNumber);
                    return;
                }

                // 다른 사람의 예약이면 차단 모달 표시
                if (openReservationBlockedModal) {
                    openReservationBlockedModal(reservation);
                } else {
                    toast.warning('다른 사용자가 이 객실을 선택 중입니다. 잠시 후 다시 시도해주세요.');
                }
                return;
            }

            // 5. 예약 생성 (60초 임시 예약)
            const reserveResult = await createRoomReservation(
                roomNumber,
                user.sessionId,
                RESERVATION_TYPE.SELECTION_PENDING,
                { userName: user.name }
            );

            if (!reserveResult.success) {
                // 예약 생성 실패 (다른 사용자가 먼저 예약)
                if (reserveResult.existingReservation && openReservationBlockedModal) {
                    openReservationBlockedModal(reserveResult.existingReservation);
                } else {
                    toast.warning(reserveResult.message || '다른 사용자가 이 객실을 선택 중입니다.');
                }
                return;
            }

            // 6. 선택 모달 열기
            setSelectedRoomForConfirm(roomNumber);

        } catch (error) {
            console.error('예약 확인 오류:', error);
            // 오류 발생 시에도 진행 허용 (기존 동작 유지)
            setSelectedRoomForConfirm(roomNumber);
        }
    }, [user, setShowRegistrationModal, setSelectedRoomForConfirm, openReservationBlockedModal, toast]);

    /**
     * 실제 객실 배정 실행
     */
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

            // 룸메이트 초대 시 슬롯 예약 (5분)
            if (roommateInfo.hasRoommate && roommateInfo.roommateName) {
                await createRoommateInvitation(
                    { ...user, roomNumber },
                    sanitizeName(roommateInfo.roommateName)
                );

                // 2인실인데 룸메이트 초대 시 → 슬롯 예약 유지 (roommate_invite 타입으로 변경)
                const room = roomData[roomNumber];
                if (room && room.capacity === 2) {
                    await createRoomReservation(
                        roomNumber,
                        user.sessionId,
                        RESERVATION_TYPE.ROOMMATE_INVITE,
                        { reservedFor: roommateInfo.roommateName, userName: user.name }
                    );
                }
            } else {
                // 예약 해제 (배정 완료)
                await releaseRoomReservation(roomNumber, user.sessionId);
            }

            selectUserRoom(roomNumber);
            setSelectedRoomForConfirm(null);
            setPendingSelection(null);

        } catch (error) {
            // 실패 시 예약 해제
            await releaseRoomReservation(roomNumber, user.sessionId).catch(() => { });
            toast.error(error.message || '객실 선택에 실패했습니다.');
            setSelectedRoomForConfirm(null);
            setPendingSelection(null);
        }
    }, [user, addGuestToRoom, selectUserRoom, setSelectedRoomForConfirm, setPendingSelection, toast]);

    /**
     * 객실 선택 확정 (매칭 검증 포함)
     */
    const handleConfirmSelection = useCallback(async (roomNumber, roommateInfo = {}) => {
        if (!user) return;

        // 이미 배정됨 재검증
        if (user.locked || user.selectedRoom) {
            toast.warning('이미 객실이 배정되어 있습니다.');
            await releaseRoomReservation(roomNumber, user.sessionId).catch(() => { });
            setSelectedRoomForConfirm(null);
            return;
        }

        // 성별 불일치 재검증
        const room = roomData[roomNumber];
        if (room && room.gender !== user.gender) {
            toast.error('성별이 맞지 않는 객실입니다.');
            await releaseRoomReservation(roomNumber, user.sessionId).catch(() => { });
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

    /**
     * 경고 확인 후 승인 요청 전송
     */
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

        // 요청 전송 후 예약 해제
        await releaseRoomReservation(roomNumber, user.sessionId).catch(() => { });

        setShowWarningModal(false);
        setPendingSelection(null);
    }, [user, roomGuests, pendingSelection, warningContent, sendRequest, performSelection, setShowWarningModal, setPendingSelection]);

    return {
        handleRoomClick,
        performSelection,
        handleConfirmSelection,
        handleCancelSelection,
        handleWarningConfirmed
    };
}
