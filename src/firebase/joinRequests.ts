/**
 * 입실 요청(Join Request) 관리 모듈
 * 경고 발생 시 기존 입실자의 승인을 받기 위한 비동기 프로세스
 */
import { database, ref, push, set, onValue, remove, get, update, runTransaction } from './config';
import { logGuestAdd } from './history';
import type { JoinRequest, Guest, RequestStatus } from '../types';

// 요청 상태 상수
export const REQUEST_STATUS: Record<string, RequestStatus> = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
};

/**
 * 입실 요청 생성
 */
export async function createJoinRequest(requestData: {
    fromUserId: string;
    fromUserName: string;
    toRoomNumber: string;
    toUserId?: string;
    warnings?: unknown;
    guestInfo: Guest;
}): Promise<string | null> {
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
 */
export function subscribeToJoinRequests(
    mySessionId: string,
    callback: (data: { received: JoinRequest[]; sent: JoinRequest[] }) => void
): () => void {
    if (!database) return () => { };

    const requestsRef = ref(database, 'join_requests');

    return onValue(requestsRef, (snapshot) => {
        const data = snapshot.val() as Record<string, JoinRequest> | null;
        if (!data) {
            callback({ received: [], sent: [] });
            return;
        }

        const allRequests = Object.entries(data).map(([id, req]) => ({
            id,
            ...req
        })) as JoinRequest[];

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
 */
export async function acceptJoinRequest(
    requestId: string,
    requestData: {
        toRoomNumber: string;
        fromUserId: string;
        guestInfo: Guest;
        warnings?: unknown;
    }
): Promise<void> {
    if (!database) throw new Error('Firebase not initialized');

    // 1. 방에 게스트 추가 (Transaction)
    const roomRef = ref(database, `rooms/${requestData.toRoomNumber}/guests`);

    try {
        await runTransaction(roomRef, (currentGuests) => {
            if (!currentGuests) currentGuests = [];
            else if (!Array.isArray(currentGuests)) currentGuests = Object.values(currentGuests);

            // 정원 초과 등 체크
            if (currentGuests.length >= 2) return currentGuests; // 이미 찼으면 중단

            // 이미 있는지 체크
            const guests = currentGuests as Guest[];
            if (guests.some(g => g.sessionId === requestData.fromUserId)) return currentGuests;

            // 게스트 추가
            return [...guests, requestData.guestInfo];
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
        console.error('Accept fail:', error);
        throw error;
    }
}

/**
 * 입실 요청 거절
 */
export async function rejectJoinRequest(requestId: string): Promise<void> {
    if (!database) return;

    const reqRef = ref(database, `join_requests/${requestId}`);
    await update(reqRef, { status: REQUEST_STATUS.REJECTED });
}

/**
 * 입실 요청 취소 (Guest가 직접 취소)
 */
export async function cancelJoinRequest(requestId: string): Promise<void> {
    if (!database) return;
    const reqRef = ref(database, `join_requests/${requestId}`);
    await remove(reqRef);
}

/**
 * 완료된 요청 정리 (Cleanup)
 */
export async function cleanupRequest(requestId: string): Promise<void> {
    if (!database) return;
    const reqRef = ref(database, `join_requests/${requestId}`);
    await remove(reqRef);
}

