/**
 * Firebase 방 변경 요청 관련 모듈
 */
import { database, ref, onValue, set, update } from './config';

export async function createRoomChangeRequest(requestData) {
    if (!database) return null;

    const requestRef = ref(database, `roomChangeRequests/${Date.now()}`);

    const request = {
        ...requestData,
        status: 'pending',
        createdAt: Date.now()
    };

    await set(requestRef, request);
    return request;
}

export function subscribeToRoomChangeRequests(callback) {
    if (!database) {
        callback([]);
        return () => { };
    }

    const requestsRef = ref(database, 'roomChangeRequests');
    const unsubscribe = onValue(requestsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const requests = Object.entries(data).map(([id, req]) => ({ id, ...req }));
        callback(requests.sort((a, b) => b.createdAt - a.createdAt));
    });

    return unsubscribe;
}

export async function resolveRoomChangeRequest(requestId) {
    if (!database) return false;

    const requestRef = ref(database, `roomChangeRequests/${requestId}`);
    await update(requestRef, {
        status: 'resolved',
        resolvedAt: Date.now()
    });

    return true;
}

export async function deleteRoomChangeRequest(requestId) {
    if (!database) return false;

    const requestRef = ref(database, `roomChangeRequests/${requestId}`);
    await set(requestRef, null);

    return true;
}
