/**
 * Firebase 히스토리 로깅 모듈
 * 배정/삭제/이동 등의 이력을 기록
 */
import { database, ref, push, onValue, get, query, orderByChild, limitToLast } from './config';
import { ensureAnonymousAuth } from './authGuard';

/**
 * 히스토리 액션 타입
 */
export const HISTORY_ACTIONS = {
    REGISTER: 'register',      // 유저 등록 (본인)
    ADMIN_ADD: 'admin_add',    // 관리자 추가
    ADMIN_REMOVE: 'admin_remove', // 관리자 삭제
    ADMIN_EDIT: 'admin_edit',  // 관리자 수정
    CSV_UPLOAD: 'csv_upload',  // CSV 일괄 업로드
    ROOM_CHANGE: 'room_change', // 방 변경
    ADMIN_MIGRATE_ONSITE: 'admin_migrate_onsite' // 현장등록(배정만) -> 등록유저 전환
};

/**
 * 히스토리 기록 추가
 * @param {Object} data - 히스토리 데이터
 */
export async function addHistory(data) {
    if (!database) return null;
    await ensureAnonymousAuth({ context: 'addHistory.ensureAuth', showToast: false, rethrow: false });

    const historyRef = ref(database, 'history');
    const historyData = {
        ...data,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
    };

    const result = await push(historyRef, historyData);
    return result.key;
}

/**
 * 게스트 추가 히스토리 기록
 */
export async function logGuestAdd(roomNumber, guestData, source = 'user', warningDetails = null) {
    return addHistory({
        action: source === 'csv' ? HISTORY_ACTIONS.CSV_UPLOAD
            : source === 'admin' ? HISTORY_ACTIONS.ADMIN_ADD
                : HISTORY_ACTIONS.REGISTER,
        roomNumber,
        guestName: guestData.name,
        guestCompany: guestData.company || '',
        guestSessionId: guestData.sessionId,
        source,
        warningDetails // 경고 무시 내용 (없으면 null)
    });
}

/**
 * 게스트 삭제 히스토리 기록
 */
export async function logGuestRemove(roomNumber, guestName, sessionId, removedBy = 'admin') {
    return addHistory({
        action: HISTORY_ACTIONS.ADMIN_REMOVE,
        roomNumber,
        guestName,
        guestSessionId: sessionId,
        removedBy
    });
}

/**
 * 게스트 정보 수정 히스토리 기록
 */
export async function logGuestEdit(roomNumber, oldData, newData) {
    return addHistory({
        action: HISTORY_ACTIONS.ADMIN_EDIT,
        roomNumber,
        guestSessionId: oldData.sessionId,
        oldName: oldData.name,
        newName: newData.name,
        oldCompany: oldData.company,
        newCompany: newData.company
    });
}

/**
 * 방 변경 히스토리 기록
 */
export async function logRoomChange(fromRoom, toRoom, guestName, sessionId) {
    return addHistory({
        action: HISTORY_ACTIONS.ROOM_CHANGE,
        fromRoom,
        toRoom,
        guestName,
        guestSessionId: sessionId
    });
}

/**
 * 히스토리 구독 (실시간)
 * @param {Function} callback - 콜백 함수
 * @param {number} limit - 가져올 개수 (기본 100)
 */
export function subscribeToHistory(callback, limit = 100) {
    if (!database) {
        callback([]);
        return () => { };
    }

    const historyRef = ref(database, 'history');

    let unsubscribe = () => { };
    let cancelled = false;
    let notified = false;

    ensureAnonymousAuth({ context: 'subscribeToHistory.ensureAuth', showToast: false, rethrow: false })
        .then(() => {
            if (cancelled) return;
            unsubscribe = onValue(
                historyRef,
                (snapshot) => {
                    const data = snapshot.val();
                    if (!data) {
                        callback([]);
                        return;
                    }

                    // 객체를 배열로 변환하고 시간순 정렬 (최신 먼저)
                    const historyList = Object.entries(data)
                        .map(([id, item]) => ({ id, ...item }))
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, limit);

                    callback(historyList);
                },
                (error) => {
                    if (notified) return;
                    notified = true;
                    import('../utils/errorHandler')
                        .then(({ handleFirebaseError }) => handleFirebaseError(error, { context: 'subscribeToHistory', showToast: true, rethrow: false }))
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
 * 특정 방의 히스토리 조회
 */
export async function getRoomHistory(roomNumber) {
    if (!database) return [];

    const historyRef = ref(database, 'history');
    const snapshot = await get(historyRef);
    const data = snapshot.val();

    if (!data) return [];

    return Object.entries(data)
        .map(([id, item]) => ({ id, ...item }))
        .filter(item => item.roomNumber === roomNumber || item.fromRoom === roomNumber || item.toRoom === roomNumber)
        .sort((a, b) => b.timestamp - a.timestamp);
}
