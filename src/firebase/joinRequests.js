/**
 * 입실 요청(Join Request) 관리 모듈
 * 경고 발생 시 기존 입실자의 승인을 받기 위한 비동기 프로세스
 */
import { database, ref, push, set, onValue, remove, get, update, runTransaction } from './config';
import { logGuestAdd } from './history';
import { ensureAnonymousAuth } from './authGuard';

// 요청 상태 상수
export const REQUEST_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
};

/**
 * 입실 요청 생성
 * @param {Object} requestData 
 * { fromUserId, fromUserName, toRoomNumber, toUserId, warnings }
 */
export async function createJoinRequest(requestData) {
    if (!database) throw new Error('Firebase not initialized');
    await ensureAnonymousAuth({ context: 'createJoinRequest.ensureAuth', showToast: true, rethrow: true });

    const requestsRef = ref(database, 'join_requests');
    const newRequestRef = push(requestsRef);

    await set(newRequestRef, {
        ...requestData,
        status: REQUEST_STATUS.PENDING,
        timestamp: Date.now()
    });

    return newRequestRef.key;
}

/**
 * 내게 온 요청(Host용) 또는 내가 보낸 요청(Guest용) 구독
 * @param {string} mySessionId 
 * @param {Function} callback 
 */
export function subscribeToJoinRequests(mySessionId, callback) {
    if (!database) return () => { };

    const requestsRef = ref(database, 'join_requests');

    let unsubscribe = () => { };
    let cancelled = false;
    let notified = false;

    ensureAnonymousAuth({ context: 'subscribeToJoinRequests.ensureAuth', showToast: false, rethrow: false })
        .then(() => {
            if (cancelled) return;
            unsubscribe = onValue(
                requestsRef,
                (snapshot) => {
                    const data = snapshot.val();
                    if (!data) {
                        callback({ received: [], sent: [] });
                        return;
                    }

                    const allRequests = Object.entries(data).map(([id, req]) => ({
                        id,
                        ...req
                    }));

                    // 내가 받은 요청 (Host) - 대기 중인 것만
                    const received = allRequests.filter(
                        req => req.toUserId === mySessionId && req.status === REQUEST_STATUS.PENDING
                    );

                    // 내가 보낸 요청 (Guest)
                    const sent = allRequests.filter(
                        req => req.fromUserId === mySessionId
                    );

                    callback({ received, sent });
                },
                (error) => {
                    if (notified) return;
                    notified = true;
                    import('../utils/errorHandler')
                        .then(({ handleFirebaseError }) => handleFirebaseError(error, { context: 'subscribeToJoinRequests', showToast: true, rethrow: false }))
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
 * 입실 요청 수락 (Transaction으로 안전하게 처리)
 * 1. 요청 상태 accepted로 변경
 * 2. 방에 게스트 추가
 * 3. 요청 데이터 삭제 (또는 히스토리 보존 위해 남겨둘 수도 있음 -> 여기선 즉시 삭제하지 않고 accepted로 둠)
 */
export async function acceptJoinRequest(requestId, requestData) {
    if (!database) return;
    await ensureAnonymousAuth({ context: 'acceptJoinRequest.ensureAuth', showToast: true, rethrow: true });

    // 1. 방에 게스트 추가 (Transaction)
    const roomRef = ref(database, `rooms/${requestData.toRoomNumber}/guests`);

    try {
        await runTransaction(roomRef, (currentGuests) => {
            if (!currentGuests) currentGuests = [];
            else if (!Array.isArray(currentGuests)) currentGuests = Object.values(currentGuests);

            // 정원 초과 등 체크
            if (currentGuests.length >= 2) return; // 이미 찼으면 중단

            // 이미 있는지 체크
            if (currentGuests.some(g => g.sessionId === requestData.fromUserId)) return;

            // 게스트 추가
            // (주의: requestData에는 user full info가 없을 수 있음. 
            // 생성 시 전체 정보를 넣거나, 여기서 다시 DB 조회해야 하는데
            // createJoinRequest 할 때 guestInfo 전체를 넣는 것이 좋음)
            return [...currentGuests, requestData.guestInfo];
        });

        // 2. 요청 상태 업데이트
        const reqRef = ref(database, `join_requests/${requestId}`);
        await update(reqRef, { status: REQUEST_STATUS.ACCEPTED });

        // 3. 로그 남기기
        await logGuestAdd(
            requestData.toRoomNumber,
            requestData.guestInfo,
            'request_accepted',
            requestData.warnings // 경고 내용 포함
        );

    } catch (error) {
        const { handleFirebaseError } = await import('../utils/errorHandler');
        handleFirebaseError(error, {
            context: 'acceptJoinRequest',
            showToast: true,
            rethrow: true
        });
    }
}

/**
 * 입실 요청 거절
 */
export async function rejectJoinRequest(requestId) {
    if (!database) return;
    await ensureAnonymousAuth({ context: 'rejectJoinRequest.ensureAuth', showToast: true, rethrow: true });

    const reqRef = ref(database, `join_requests/${requestId}`);
    await update(reqRef, { status: REQUEST_STATUS.REJECTED });
}

/**
 * 입실 요청 취소 (Guest가 직접 취소)
 */
export async function cancelJoinRequest(requestId) {
    if (!database) return;
    await ensureAnonymousAuth({ context: 'cancelJoinRequest.ensureAuth', showToast: true, rethrow: true });
    const reqRef = ref(database, `join_requests/${requestId}`);
    await remove(reqRef);
}

/**
 * 완료된 요청 정리 (Cleanup)
 * Accepted/Rejected 상태인 요청을 확인 후 삭제하는 데 사용
 */
export async function cleanupRequest(requestId) {
    if (!database) return;
    await ensureAnonymousAuth({ context: 'cleanupRequest.ensureAuth', showToast: true, rethrow: true });
    const reqRef = ref(database, `join_requests/${requestId}`);
    await remove(reqRef);
}
