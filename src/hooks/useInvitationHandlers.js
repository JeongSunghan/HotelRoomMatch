/**
 * 룸메이트 초대 시스템 관리 훅
 * 초대 수신, 수락, 거절 및 거절 알림 처리
 */
import { useState, useEffect, useCallback } from 'react';
import {
    checkPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    subscribeToMyInvitations,
    subscribeToReceivedInvitations
} from '../firebase/index';
import { set, ref } from 'firebase/database';
import { database } from '../firebase/config';

/**
 * @param {import('../types/types').User} user - 현재 사용자
 * @param {Function} registerUser - 사용자 등록 함수
 * @param {Function} selectUserRoom - 방 선택 함수
 * @param {Function} setSelectedFloor - 층 선택 setter
 * @param {Function} setShowRegistrationModal - 등록 모달 닫기 함수
 * @param {Object} toast - Toast 알림 객체
 * @param {Object} floors - 층 정보
 * @param {Object} floorInfo - 층별 상세 정보
 * @returns {Object} 초대 관련 상태 및 핸들러
 */
export function useInvitationHandlers(
    user,
    registerUser,
    selectUserRoom,
    setSelectedFloor,
    setShowRegistrationModal,
    toast,
    floors,
    floorInfo
) {
    // 초대 시스템 상태
    const [pendingInvitation, setPendingInvitation] = useState(null);
    const [invitationLoading, setInvitationLoading] = useState(false);
    const [rejectionNotification, setRejectionNotification] = useState(null);

    // 방 배정 시 펜딩 초대 리셋
    useEffect(() => {
        if (user?.selectedRoom && pendingInvitation) {
            setPendingInvitation(null);
        }
    }, [user?.selectedRoom, pendingInvitation]);

    // 받은 초대 실시간 구독 (onValue 사용)
    useEffect(() => {
        // 사용자가 로그인되어 있고, 아직 방이 배정되지 않은 경우에만 구독
        if (!user?.name || user.selectedRoom) {
            return;
        }

        const unsubscribe = subscribeToReceivedInvitations(user.name, (invitations) => {
            // 가장 최근 초대만 표시 (여러 개가 있으면 첫 번째)
            if (invitations.length > 0) {
                setPendingInvitation(invitations[0]);
            } else {
                // 초대가 없거나 모두 처리된 경우
                setPendingInvitation(null);
            }
        });

        return () => unsubscribe();
    }, [user?.name, user?.selectedRoom]);

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

    // 사용자 등록 후 초대 확인
    const handleRegister = useCallback(async (userData) => {
        const newUser = registerUser(userData);
        setShowRegistrationModal(false);

        // 성별에 맞는 층으로 이동
        const defaultFloor = floors.find(f => floorInfo[f].gender === newUser.gender);
        if (defaultFloor) {
            setSelectedFloor(defaultFloor);
        }

        // 실시간 구독이 자동으로 초대를 감지하므로 별도 확인 불필요
        // (위의 useEffect에서 subscribeToReceivedInvitations가 처리)
    }, [registerUser, setShowRegistrationModal, setSelectedFloor, floors, floorInfo]);

    // 초대 수락
    const handleAcceptInvitation = useCallback(async () => {
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
            toast.error(error.message || '초대 수락에 실패했습니다.');
        } finally {
            setInvitationLoading(false);
        }
    }, [pendingInvitation, user, selectUserRoom, toast]);

    // 초대 거절
    const handleRejectInvitation = useCallback(async () => {
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
    }, [pendingInvitation, user]);

    // 거절 알림 삭제
    const clearRejectionNotification = useCallback(async () => {
        if (rejectionNotification?.id && database) {
            try {
                await set(ref(database, `roommateInvitations/${rejectionNotification.id}`), null);
            } catch (e) {
                console.error('Failed to delete invitation:', e);
            }
        }
        setRejectionNotification(null);
    }, [rejectionNotification]);

    return {
        // 상태
        pendingInvitation,
        invitationLoading,
        rejectionNotification,

        // 핸들러
        handleRegister,
        handleAcceptInvitation,
        handleRejectInvitation,
        clearRejectionNotification
    };
}
