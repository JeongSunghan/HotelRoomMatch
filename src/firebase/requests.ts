/**
 * Firebase 방 변경 요청 관련 모듈
 */
import { database, ref, onValue, set, update } from './config';
import type { RoomChangeRequest, RequestStatus } from '../types';

/**
 * 방 변경 요청 생성
 */
export async function createRoomChangeRequest(requestData: {
    userId: string;
    userName: string;
    currentRoom: string;
    requestType: 'change' | 'cancel';
    phoneNumber: string;
    reason?: string;
}): Promise<RoomChangeRequest | null> {
    if (!database) return null;

    const requestRef = ref(database, `roomChangeRequests/${Date.now()}`);

    const request: RoomChangeRequest = {
        ...requestData,
        status: 'pending',
        createdAt: Date.now()
    };

    await set(requestRef, request);
    return request;
}

/**
 * 방 변경 요청 구독
 */
export function subscribeToRoomChangeRequests(
    callback: (requests: RoomChangeRequest[]) => void
): () => void {
    if (!database) {
        callback([]);
        return () => { };
    }

    const requestsRef = ref(database, 'roomChangeRequests');
    const unsubscribe = onValue(requestsRef, (snapshot) => {
        const data = snapshot.val() as Record<string, RoomChangeRequest> | null || {};
        const requests = Object.entries(data).map(([id, req]) => ({ id, ...req }));
        callback(requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });

    return unsubscribe;
}

/**
 * 방 변경 요청 해결
 */
export async function resolveRoomChangeRequest(requestId: string): Promise<boolean> {
    if (!database) return false;

    const requestRef = ref(database, `roomChangeRequests/${requestId}`);
    await update(requestRef, {
        status: 'resolved' as RequestStatus,
        resolvedAt: Date.now()
    });

    return true;
}

/**
 * 방 변경 요청 삭제
 */
export async function deleteRoomChangeRequest(requestId: string): Promise<boolean> {
    if (!database) return false;

    const requestRef = ref(database, `roomChangeRequests/${requestId}`);
    await set(requestRef, null);

    return true;
}

