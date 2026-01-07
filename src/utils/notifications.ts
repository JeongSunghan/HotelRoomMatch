/**
 * 브라우저 알림 유틸리티
 * Push Notification API 활용
 * 개선: 알림 설정 저장, 알림 타입별 필터링 지원
 */

const NOTIFICATION_SETTINGS_KEY = 'vup58_notification_settings';

/**
 * 알림 권한 상태
 */
export type NotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

/**
 * 알림 타입
 */
export type NotificationType = 'join-request' | 'request-accepted' | 'request-rejected' | 'invitation' | 'all';

/**
 * 알림 설정
 */
export interface NotificationSettings {
    enabled: boolean;
    soundEnabled: boolean;
    types: NotificationType[];
}

/**
 * 기본 알림 설정
 */
const DEFAULT_SETTINGS: NotificationSettings = {
    enabled: true,
    soundEnabled: true,
    types: ['all']
};

/**
 * 알림 설정 로드
 */
export function loadNotificationSettings(): NotificationSettings {
    try {
        const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (saved) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } as NotificationSettings;
        }
    } catch {
        // 설정 로드 실패 시 기본값 반환
    }
    return DEFAULT_SETTINGS;
}

/**
 * 알림 설정 저장
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
    try {
        localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // 설정 저장 실패 무시
    }
}

/**
 * 알림이 활성화되어 있는지 확인
 */
export function isNotificationEnabled(type: NotificationType = 'all'): boolean {
    const settings = loadNotificationSettings();
    if (!settings.enabled) return false;
    return settings.types.includes('all') || settings.types.includes(type);
}

/**
 * 알림 옵션
 */
export interface NotificationOptions {
    icon?: string;
    badge?: string;
    vibrate?: number[];
    tag?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    body?: string;
    onClick?: () => void;
    type?: NotificationType;
    sound?: boolean;
}

/**
 * 알림 권한 상태 확인
 * @returns 권한 상태
 */
export function getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission as NotificationPermission;
}

/**
 * 알림 권한 요청
 * @returns 권한 부여 여부
 */
export async function requestNotificationPermission(): Promise<boolean> {
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

/**
 * 알림 사운드 재생 (옵션)
 */
function playNotificationSound(): void {
    if (!isNotificationEnabled()) return;
    const settings = loadNotificationSettings();
    if (!settings.soundEnabled) return;

    try {
        // 간단한 비프음 생성 (Web Audio API)
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // 800Hz
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch {
        // 사운드 재생 실패 무시
    }
}

/**
 * 브라우저 알림 표시
 * @param title - 알림 제목
 * @param options - 알림 옵션
 * @returns Notification 객체 또는 null
 */
export function showNotification(
    title: string,
    options: NotificationOptions = {}
): Notification | null {
    if (!('Notification' in window)) {
        console.warn('이 브라우저는 알림을 지원하지 않습니다.');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.warn('알림 권한이 없습니다.');
        return null;
    }

    // 알림 타입별 활성화 확인 (개선)
    const notificationType = options.type || 'all';
    if (!isNotificationEnabled(notificationType)) {
        return null; // 해당 타입의 알림이 비활성화됨
    }

    const defaultOptions: NotificationOptions = {
        icon: '/vite.svg',
        badge: '/vite.svg',
        vibrate: [200, 100, 200],
        tag: 'v-up-notification',
        renotify: true,
        requireInteraction: false,
        sound: true,
        ...options
    };

    // 사운드 재생 (개선)
    if (defaultOptions.sound) {
        playNotificationSound();
    }

    const notificationOptions: NotificationOptions & { body?: string } = {
        ...defaultOptions,
        body: defaultOptions.body
    };

    const notification = new Notification(title, notificationOptions as NotificationInit);

    // 클릭 시 창 포커스
    notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
            options.onClick();
        }
    };

    // 알림 자동 닫기 (5초 후, requireInteraction이 false인 경우)
    if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
            notification.close();
        }, 5000);
    }

    return notification;
}

/**
 * 입실 요청 알림
 * @param fromUserName - 요청자 이름
 * @returns Notification 객체 또는 null
 */
export function notifyJoinRequest(fromUserName: string): Notification | null {
    return showNotification('🏨 입실 요청', {
        body: `${fromUserName}님이 객실 입실을 요청했습니다.`,
        tag: 'join-request',
        type: 'join-request',
        requireInteraction: true
    });
}

/**
 * 요청 수락 알림
 * @param roomNumber - 방 번호
 * @returns Notification 객체 또는 null
 */
export function notifyRequestAccepted(roomNumber: string): Notification | null {
    return showNotification('✅ 입실 승인', {
        body: `${roomNumber}호 입실이 승인되었습니다!`,
        tag: 'request-accepted',
        type: 'request-accepted'
    });
}

/**
 * 요청 거절 알림
 * @returns Notification 객체 또는 null
 */
export function notifyRequestRejected(): Notification | null {
    return showNotification('❌ 입실 거절', {
        body: '룸메이트가 요청을 거절했습니다.',
        tag: 'request-rejected',
        type: 'request-rejected'
    });
}

/**
 * 초대 알림
 * @param fromUserName - 초대자 이름
 * @param roomNumber - 방 번호
 * @returns Notification 객체 또는 null
 */
export function notifyInvitation(fromUserName: string, roomNumber: string): Notification | null {
    return showNotification('💌 초대장 도착', {
        body: `${fromUserName}님이 ${roomNumber}호로 초대했습니다.`,
        tag: 'invitation',
        type: 'invitation',
        requireInteraction: true
    });
}


