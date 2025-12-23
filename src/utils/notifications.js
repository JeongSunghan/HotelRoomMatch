/**
 * 브라우저 알림 유틸리티
 * Push Notification API 활용
 */

// 알림 권한 상태 확인
export function getNotificationPermission() {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}

// 알림 권한 요청
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('이 브라우저는 알림을 지원하지 않습니다.');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// 브라우저 알림 표시
export function showNotification(title, options = {}) {
    if (!('Notification' in window)) {
        console.warn('이 브라우저는 알림을 지원하지 않습니다.');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.warn('알림 권한이 없습니다.');
        return null;
    }

    const defaultOptions = {
        icon: '/vite.svg',
        badge: '/vite.svg',
        vibrate: [200, 100, 200],
        tag: 'v-up-notification',
        renotify: true,
        requireInteraction: false,
        ...options
    };

    const notification = new Notification(title, defaultOptions);

    // 클릭 시 창 포커스
    notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
            options.onClick();
        }
    };

    return notification;
}

// 입실 요청 알림
export function notifyJoinRequest(fromUserName) {
    return showNotification('🏨 입실 요청', {
        body: `${fromUserName}님이 객실 입실을 요청했습니다.`,
        tag: 'join-request',
        requireInteraction: true
    });
}

// 요청 수락 알림
export function notifyRequestAccepted(roomNumber) {
    return showNotification('✅ 입실 승인', {
        body: `${roomNumber}호 입실이 승인되었습니다!`,
        tag: 'request-accepted'
    });
}

// 요청 거절 알림
export function notifyRequestRejected() {
    return showNotification('❌ 입실 거절', {
        body: '룸메이트가 요청을 거절했습니다.',
        tag: 'request-rejected'
    });
}

// 초대 알림
export function notifyInvitation(fromUserName, roomNumber) {
    return showNotification('💌 초대장 도착', {
        body: `${fromUserName}님이 ${roomNumber}호로 초대했습니다.`,
        tag: 'invitation',
        requireInteraction: true
    });
}
