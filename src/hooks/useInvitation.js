import { useState, useCallback, useEffect } from 'react';
import {
    checkPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    subscribeToMyInvitations
} from '../firebase/index';

/**
 * 룸메이트 초대 관련 로직을 관리하는 훅
 */
export function useInvitation(user, onRoomSelected) {
    const [pendingInvitation, setPendingInvitation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [rejectionNotification, setRejectionNotification] = useState(null);

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

    // 대기 중인 초대 확인
    const checkForInvitations = useCallback(async (userName) => {
        const invitations = await checkPendingInvitations(userName);
        if (invitations.length > 0) {
            setPendingInvitation(invitations[0]); // 첫 번째 초대만 처리
        }
        return invitations;
    }, []);

    // 초대 수락
    const handleAccept = useCallback(async () => {
        if (!pendingInvitation || !user) return;

        setIsLoading(true);
        try {
            const roomNumber = await acceptInvitation(pendingInvitation.id, {
                name: user.name,
                company: user.company || '',
                gender: user.gender,
                age: user.age,
                sessionId: user.sessionId,
                registeredAt: Date.now()
            });

            // 사용자 상태 업데이트 콜백
            if (onRoomSelected) {
                onRoomSelected(roomNumber);
            }
            setPendingInvitation(null);
            return roomNumber;
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [pendingInvitation, user, onRoomSelected]);

    // 초대 거절
    const handleReject = useCallback(async () => {
        if (!pendingInvitation || !user) return;

        setIsLoading(true);
        try {
            await rejectInvitation(pendingInvitation.id, {
                sessionId: user.sessionId
            });
            setPendingInvitation(null);
        } catch (error) {
            // 에러 무시
        } finally {
            setIsLoading(false);
        }
    }, [pendingInvitation, user]);

    // 거절 알림 닫기
    const dismissRejectionNotification = useCallback(() => {
        setRejectionNotification(null);
    }, []);

    return {
        pendingInvitation,
        isLoading,
        rejectionNotification,
        checkForInvitations,
        handleAccept,
        handleReject,
        dismissRejectionNotification
    };
}
