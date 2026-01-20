/**
 * 알림 관리 커스텀 훅
 * 알림 추가/읽음 처리 등의 편의 기능 제공
 */
import { useCallback } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';

/**
 * @typedef {Object} NotificationConfig
 * @property {'invitation'|'request'|'room'|'warning'} type - 알림 타입
 * @property {string} title - 제목
 * @property {string} message - 내용
 * @property {Object} [data] - 추가 데이터
 */

export function useNotifications() {
    const {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
    } = useNotificationContext();

    // 초대 관련 알림
    const notifyInvitationReceived = useCallback((inviterName, roomNumber) => {
        return addNotification({
            type: 'invitation',
            title: '🤝 룸메이트 초대',
            message: `${inviterName}님이 ${roomNumber}호로 초대했습니다.`,
            data: { inviterName, roomNumber }
        });
    }, [addNotification]);

    const notifyInvitationAccepted = useCallback((inviteeName) => {
        return addNotification({
            type: 'invitation',
            title: '✅ 초대 수락',
            message: `${inviteeName}님이 초대를 수락했습니다!`,
            data: { inviteeName }
        });
    }, [addNotification]);

    const notifyInvitationRejected = useCallback((inviteeName) => {
        return addNotification({
            type: 'invitation',
            title: '❌ 초대 거절',
            message: `${inviteeName}님이 초대를 거절했습니다.`,
            data: { inviteeName }
        });
    }, [addNotification]);

    // 요청 관련 알림
    const notifyRequestReceived = useCallback((requesterName, roomNumber) => {
        return addNotification({
            type: 'request',
            title: '📩 입실 요청',
            message: `${requesterName}님이 ${roomNumber}호 입실을 요청했습니다.`,
            data: { requesterName, roomNumber }
        });
    }, [addNotification]);

    const notifyRequestAccepted = useCallback((roomNumber) => {
        return addNotification({
            type: 'request',
            title: '✅ 입실 승인',
            message: `${roomNumber}호 입실이 승인되었습니다!`,
            data: { roomNumber }
        });
    }, [addNotification]);

    const notifyRequestRejected = useCallback(() => {
        return addNotification({
            type: 'request',
            title: '❌ 입실 거절',
            message: '입실 요청이 거절되었습니다.',
            data: {}
        });
    }, [addNotification]);

    // 방 관련 알림
    const notifyRoomAssigned = useCallback((roomNumber) => {
        return addNotification({
            type: 'room',
            title: '🏠 방 배정 완료',
            message: `${roomNumber}호가 배정되었습니다!`,
            data: { roomNumber }
        });
    }, [addNotification]);

    const notifyRoomCancelled = useCallback(() => {
        return addNotification({
            type: 'warning',
            title: '⚠️ 방 배정 취소',
            message: '관리자에 의해 방 배정이 취소되었습니다.',
            data: {}
        });
    }, [addNotification]);

    return {
        // 상태
        notifications,
        unreadCount,

        // 기본 기능
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,

        // 편의 함수
        notifyInvitationReceived,
        notifyInvitationAccepted,
        notifyInvitationRejected,
        notifyRequestReceived,
        notifyRequestAccepted,
        notifyRequestRejected,
        notifyRoomAssigned,
        notifyRoomCancelled
    };
}
