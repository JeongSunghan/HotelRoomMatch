/**
 * Firebase 설정 관리 모듈
 * 시스템 설정값 (마감시간 등) 관리
 */
import { database, ref, onValue, set, get } from './config';
import type { Settings } from '../types';

/**
 * 기본 설정값
 */
const DEFAULT_SETTINGS: Settings = {
    deadline: null,
    allowRegistration: true,
    adminEmail: ''
};

/**
 * 설정값 구독 (실시간)
 */
export function subscribeToSettings(callback: (settings: Settings) => void): () => void {
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
export async function getSettings(): Promise<Settings> {
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
export async function saveSettings(settings: Partial<Settings>): Promise<boolean> {
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
 * @param enabled - 활성화 여부
 * @param deadlineTime - ISO 문자열 (예: "2024-12-31T23:59") 또는 timestamp
 * @param message - 마감 시 표시할 메시지
 */
export async function setDeadline(enabled: boolean, deadlineTime: string | number | null = null, message: string | null = null): Promise<boolean> {
    const current = await getSettings();

    const deadline = enabled && deadlineTime 
        ? (typeof deadlineTime === 'string' ? new Date(deadlineTime).getTime() : deadlineTime)
        : null;

    return saveSettings({
        ...current,
        deadline,
        allowRegistration: enabled ? current.allowRegistration : true
    });
}

/**
 * 마감 여부 확인
 * @returns 마감 여부 및 메시지
 */
export async function checkDeadline(): Promise<{ isDeadlinePassed: boolean; message: string }> {
    const settings = await getSettings();

    if (!settings.deadline) {
        return { isDeadlinePassed: false, message: '' };
    }

    const deadlineDate = new Date(settings.deadline);
    const now = new Date();

    if (now > deadlineDate) {
        return { isDeadlinePassed: true, message: '배정 마감 시간이 지났습니다. 관리자에게 문의하세요.' };
    }

    return { isDeadlinePassed: false, message: '' };
}

/**
 * 마감 시간까지 남은 시간 (밀리초)
 */
export async function getTimeUntilDeadline(): Promise<number | null> {
    const settings = await getSettings();

    if (!settings.deadline) {
        return null;
    }

    const deadlineDate = new Date(settings.deadline);
    const now = new Date();
    const remaining = deadlineDate.getTime() - now.getTime();

    return remaining > 0 ? remaining : 0;
}

