/**
 * Firebase 히스토리 로깅 모듈
 * 배정/삭제/이동 등의 이력을 기록
 */
import { database, ref, push, onValue, get } from './config';
import type { HistoryEntry, Guest } from '../types';

/**
 * 히스토리 액션 타입
 */
export const HISTORY_ACTIONS = {
    REGISTER: 'register',      // 유저 등록 (본인)
    ADMIN_ADD: 'admin_add',    // 관리자 추가
    ADMIN_REMOVE: 'admin_remove', // 관리자 삭제
    ADMIN_EDIT: 'admin_edit',  // 관리자 수정
    CSV_UPLOAD: 'csv_upload',  // CSV 일괄 업로드
    ROOM_CHANGE: 'room_change' // 방 변경
} as const;

/**
 * 히스토리 기록 추가
 */
export async function addHistory(data: {
    action: string;
    roomNumber?: string;
    guestName?: string;
    guestCompany?: string;
    guestSessionId?: string;
    source?: string;
    warningDetails?: unknown;
    removedBy?: string;
    fromRoom?: string;
    toRoom?: string;
    oldName?: string;
    newName?: string;
    oldCompany?: string;
    newCompany?: string;
}): Promise<string | null> {
    if (!database) return null;

    const historyRef = ref(database, 'history');
    const historyData: HistoryEntry = {
        ...data,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
    } as HistoryEntry;

    const result = await push(historyRef, historyData);
    return result.key;
}

/**
 * 게스트 추가 히스토리 기록
 */
export async function logGuestAdd(
    roomNumber: string,
    guestData: Guest,
    source: string = 'user',
    warningDetails: unknown = null
): Promise<string | null> {
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
export async function logGuestRemove(
    roomNumber: string,
    guestName: string,
    sessionId: string,
    removedBy: string = 'admin'
): Promise<string | null> {
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
export async function logGuestEdit(
    roomNumber: string,
    oldData: { sessionId: string; name: string; company?: string },
    newData: { name: string; company?: string }
): Promise<string | null> {
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
export async function logRoomChange(
    fromRoom: string,
    toRoom: string,
    guestName: string,
    sessionId: string
): Promise<string | null> {
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
 * 최적화: 변경사항이 있을 때만 콜백 호출
 */
export function subscribeToHistory(
    callback: (history: HistoryEntry[]) => void,
    limit: number = 100
): () => void {
    if (!database) {
        callback([]);
        return () => { };
    }

    const historyRef = ref(database, 'history');
    
    // 이전 결과를 저장하여 불필요한 업데이트 방지 (최적화)
    let lastHistory: HistoryEntry[] | null = null;

    const unsubscribe = onValue(historyRef, (snapshot) => {
        const data = snapshot.val() as Record<string, HistoryEntry> | null;
        if (!data) {
            if (!lastHistory || lastHistory.length > 0) {
                lastHistory = [];
                callback([]);
            }
            return;
        }

        // 객체를 배열로 변환하고 시간순 정렬 (최신 먼저)
        const historyList = Object.entries(data)
            .map(([id, item]) => ({ id, ...item }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, limit);

        // 변경사항이 있을 때만 콜백 호출 (최적화)
        if (!lastHistory || 
            lastHistory.length !== historyList.length ||
            JSON.stringify(lastHistory.map(h => h.id)) !== JSON.stringify(historyList.map(h => h.id))) {
            lastHistory = historyList;
            callback(historyList);
        }
    });

    return unsubscribe;
}

/**
 * 특정 방의 히스토리 조회
 */
export async function getRoomHistory(roomNumber: string): Promise<HistoryEntry[]> {
    if (!database) return [];

    const historyRef = ref(database, 'history');
    const snapshot = await get(historyRef);
    const data = snapshot.val() as Record<string, HistoryEntry> | null;

    if (!data) return [];

    return Object.entries(data)
        .map(([id, item]) => ({ id, ...item }))
        .filter(item => item.roomNumber === roomNumber || item.fromRoom === roomNumber || item.toRoom === roomNumber)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

