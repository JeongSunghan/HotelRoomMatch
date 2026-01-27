/**
 * Firebase 설정 관리 모듈
 * 시스템 설정값 (마감시간 등) 관리
 */
import { database, ref, onValue, set, get } from './config';
import { ensureAnonymousAuth } from './authGuard';

/**
 * 기본 설정값
 */
const DEFAULT_SETTINGS = {
    deadlineEnabled: false,
    deadlineTime: null,  // ISO 문자열 형태
    deadlineMessage: '배정 마감 시간이 지났습니다. 관리자에게 문의하세요.',
    // 나이 제한 (null이면 제한 없음)
    ageMin: null,
    ageMax: null
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

    let unsubscribe = () => { };
    let cancelled = false;
    let notified = false;

    // settings.read 는 rules에서 true지만, auth 기반 노드들과 초기화 타이밍을 맞추기 위해 베스트 에포트로 auth 확보
    ensureAnonymousAuth({ context: 'subscribeToSettings.ensureAuth', showToast: false, rethrow: false })
        .then(() => {
            if (cancelled) return;
            unsubscribe = onValue(
                settingsRef,
                (snapshot) => {
                    const data = snapshot.val() || DEFAULT_SETTINGS;
                    callback({
                        ...DEFAULT_SETTINGS,
                        ...data
                    });
                },
                (error) => {
                    if (notified) return;
                    notified = true;
                    import('../utils/errorHandler')
                        .then(({ handleFirebaseError }) => handleFirebaseError(error, { context: 'subscribeToSettings', showToast: true, rethrow: false }))
                        .catch(() => { });
                }
            );
        })
        .catch(() => { });

    return () => {
        cancelled = true;
        unsubscribe();
    };
}

/**
 * 설정값 가져오기 (일회성)
 */
export async function getSettings() {
    if (!database) return DEFAULT_SETTINGS;

    // settings.read 는 rules에서 true지만, 다른 노드들과 일관성을 위해 auth 확보(베스트 에포트)
    await ensureAnonymousAuth({ context: 'getSettings.ensureAuth', showToast: false, rethrow: false });

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
    await ensureAnonymousAuth({ context: 'saveSettings.ensureAuth', showToast: true, rethrow: true });

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
 * 나이 제한 설정
 * @param {number|null} ageMin - 최소 나이 (null이면 제한 없음)
 * @param {number|null} ageMax - 최대 나이 (null이면 제한 없음)
 */
export async function setAgeLimit(ageMin = null, ageMax = null) {
    const current = await getSettings();

    const min = Number.isFinite(ageMin) ? Number(ageMin) : null;
    const max = Number.isFinite(ageMax) ? Number(ageMax) : null;

    if (min !== null && (min < 1 || min > 150)) {
        throw new Error('최소 나이는 1~150 사이여야 합니다.');
    }
    if (max !== null && (max < 1 || max > 150)) {
        throw new Error('최대 나이는 1~150 사이여야 합니다.');
    }
    if (min !== null && max !== null && min > max) {
        throw new Error('최소 나이는 최대 나이보다 클 수 없습니다.');
    }

    return saveSettings({
        ...current,
        ageMin: min,
        ageMax: max
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
