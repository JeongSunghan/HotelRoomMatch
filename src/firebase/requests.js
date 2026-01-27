/**
 * Firebase 방 변경 요청 관련 모듈
 */
import { database, ref, onValue, set, update } from './config';
import { ensureAnonymousAuth } from './authGuard';

export async function createRoomChangeRequest(requestData) {
    if (!database) return null;
    await ensureAnonymousAuth({ context: 'createRoomChangeRequest.ensureAuth', showToast: true, rethrow: true });

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
    let unsubscribe = () => { };
    let cancelled = false;
    let notified = false;

    ensureAnonymousAuth({ context: 'subscribeToRoomChangeRequests.ensureAuth', showToast: false, rethrow: false })
        .then(() => {
            if (cancelled) return;
            unsubscribe = onValue(
                requestsRef,
                (snapshot) => {
                    const data = snapshot.val() || {};
                    const requests = Object.entries(data).map(([id, req]) => ({ id, ...req }));
                    callback(requests.sort((a, b) => b.createdAt - a.createdAt));
                },
                (error) => {
                    if (notified) return;
                    notified = true;
                    import('../utils/errorHandler')
                        .then(({ handleFirebaseError }) => handleFirebaseError(error, { context: 'subscribeToRoomChangeRequests', showToast: true, rethrow: false }))
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

export async function resolveRoomChangeRequest(requestId) {
    if (!database) return false;
    await ensureAnonymousAuth({ context: 'resolveRoomChangeRequest.ensureAuth', showToast: true, rethrow: true });

    const requestRef = ref(database, `roomChangeRequests/${requestId}`);
    await update(requestRef, {
        status: 'resolved',
        resolvedAt: Date.now()
    });

    return true;
}

export async function deleteRoomChangeRequest(requestId) {
    if (!database) return false;
    await ensureAnonymousAuth({ context: 'deleteRoomChangeRequest.ensureAuth', showToast: true, rethrow: true });

    const requestRef = ref(database, `roomChangeRequests/${requestId}`);
    await set(requestRef, null);

    return true;
}
