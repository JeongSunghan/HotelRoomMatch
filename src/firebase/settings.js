/**
 * Firebase 설정 관리 모듈
 * 시스템 설정값 (마감시간 등) 관리
 */
import { database, ref, onValue, set, get } from './config';

/**
 * 기본 설정값
 */
const DEFAULT_SETTINGS = {
    deadlineEnabled: false,
    deadlineTime: null,  // ISO 문자열 형태
    deadlineMessage: '배정 마감 시간이 지났습니다. 관리자에게 문의하세요.'
};

/**
 * 설정값 구독 (실시간)
 */
export function subscribeToSettings(callback) {
    if (!database) {
        callback(DEFAULT_SETTINGS);
        return () => { };
    }

    const settingsRef = ref(database, 'settings');

    const unsubscribe = onValue(settingsRef, (snapshot) => {
        const data = snapshot.val() || DEFAULT_SETTINGS;
        callback({
            ...DEFAULT_SETTINGS,
            ...data
        });
    });

    return unsubscribe;
}

/**
 * 설정값 가져오기 (일회성)
 */
export async function getSettings() {
    if (!database) return DEFAULT_SETTINGS;

    const settingsRef = ref(database, 'settings');
    const snapshot = await get(settingsRef);
    return {
        ...DEFAULT_SETTINGS,
        ...(snapshot.val() || {})
    };
}

/**
 * 설정값 저장
 */
export async function saveSettings(settings) {
    if (!database) return false;

    const settingsRef = ref(database, 'settings');
    await set(settingsRef, {
        ...settings,
        updatedAt: Date.now()
    });
    return true;
}

/**
 * 마감 시간 설정
 * @param {boolean} enabled - 활성화 여부
 * @param {string} deadlineTime - ISO 문자열 (예: "2024-12-31T23:59")
 * @param {string} message - 마감 시 표시할 메시지
 */
export async function setDeadline(enabled, deadlineTime = null, message = null) {
    const current = await getSettings();

    return saveSettings({
        ...current,
        deadlineEnabled: enabled,
        deadlineTime: enabled ? deadlineTime : null,
        deadlineMessage: message || current.deadlineMessage
    });
}

/**
 * 마감 여부 확인
 * @returns {Promise<{isDeadlinePassed: boolean, message: string}>}
 */
export async function checkDeadline() {
    const settings = await getSettings();

    if (!settings.deadlineEnabled || !settings.deadlineTime) {
        return { isDeadlinePassed: false, message: '' };
    }

    const deadlineDate = new Date(settings.deadlineTime);
    const now = new Date();

    if (now > deadlineDate) {
        return { isDeadlinePassed: true, message: settings.deadlineMessage };
    }

    return { isDeadlinePassed: false, message: '' };
}

/**
 * 마감 시간까지 남은 시간 (밀리초)
 */
export async function getTimeUntilDeadline() {
    const settings = await getSettings();

    if (!settings.deadlineEnabled || !settings.deadlineTime) {
        return null;
    }

    const deadlineDate = new Date(settings.deadlineTime);
    const now = new Date();
    const remaining = deadlineDate.getTime() - now.getTime();

    return remaining > 0 ? remaining : 0;
}
