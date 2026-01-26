/**
 * 입실 요청(Join Request) 관리 모듈
 * 경고 발생 시 기존 입실자의 승인을 받기 위한 비동기 프로세스
 */
import { database, ref, push, set, onValue, remove, get, update, runTransaction } from './config';
import { logGuestAdd } from './history';

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

    return onValue(requestsRef, (snapshot) => {
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
    });
}

/**
 * 입실 요청 수락 (Transaction으로 안전하게 처리)
 * 1. 방에 게스트 추가
 * 2. 게스트의 users 정보 업데이트 (selectedRoom, locked)
 * 3. 요청 상태 accepted로 변경
 */
export async function acceptJoinRequest(requestId, requestData) {
    if (!database) return;

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
            return [...currentGuests, requestData.guestInfo];
        });

        // 2. 게스트의 users 정보 업데이트 (locked: true, selectedRoom)
        const guestUserRef = ref(database, `users/${requestData.fromUserId}`);
        await update(guestUserRef, {
            selectedRoom: requestData.toRoomNumber,
            locked: true,
            selectedAt: Date.now()
        });

        // 3. 요청 상태 업데이트
        const reqRef = ref(database, `join_requests/${requestId}`);
        await update(reqRef, { status: REQUEST_STATUS.ACCEPTED });

        // 4. 로그 남기기
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

    const reqRef = ref(database, `join_requests/${requestId}`);
    await update(reqRef, { status: REQUEST_STATUS.REJECTED });
}

/**
 * 입실 요청 취소 (Guest가 직접 취소)
 */
export async function cancelJoinRequest(requestId) {
    if (!database) return;
    const reqRef = ref(database, `join_requests/${requestId}`);
    await remove(reqRef);
}

/**
 * 완료된 요청 정리 (Cleanup)
 * Accepted/Rejected 상태인 요청을 확인 후 삭제하는 데 사용
 */
export async function cleanupRequest(requestId) {
    if (!database) return;
    const reqRef = ref(database, `join_requests/${requestId}`);
    await remove(reqRef);
}
