/**
 * 입실 요청 관리 훅
 * - 입실 요청 생성/수락/거절/취소
 * - 실시간 요청 상태 구독
 */
import { useState, useEffect, useCallback } from 'react';
import {
    subscribeToJoinRequests,
    createJoinRequest as firebaseCreateRequest,
    acceptJoinRequest as firebaseAcceptRequest,
    rejectJoinRequest as firebaseRejectRequest,
    cancelJoinRequest as firebaseCancelRequest,
    cleanupRequest as firebaseCleanupRequest,
    REQUEST_STATUS
} from '../firebase/index';
import type { JoinRequest, Guest } from '../types';

interface UseJoinRequestsReturn {
    requests: { received: JoinRequest[]; sent: JoinRequest[] };
    loading: boolean;
    sendRequest: (requestData: {
        fromUserId: string;
        fromUserName: string;
        toRoomNumber: string;
        toUserId?: string;
        warnings?: unknown;
        guestInfo: Guest;
    }) => Promise<void>;
    acceptRequest: (requestId: string, requestData: {
        toRoomNumber: string;
        fromUserId: string;
        guestInfo: Guest;
        warnings?: unknown;
    }) => Promise<void>;
    rejectRequest: (requestId: string) => Promise<void>;
    cancelRequest: (requestId: string) => Promise<void>;
    cleanup: (requestId: string) => Promise<void>;
    REQUEST_STATUS: typeof REQUEST_STATUS;
}

export function useJoinRequests(mySessionId: string | null): UseJoinRequestsReturn {
    const [requests, setRequests] = useState<{ received: JoinRequest[]; sent: JoinRequest[] }>({ received: [], sent: [] });
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!mySessionId) {
            setRequests({ received: [], sent: [] });
            return;
        }

        const unsubscribe = subscribeToJoinRequests(mySessionId, setRequests);
        return () => unsubscribe();
    }, [mySessionId]);

    const sendRequest = useCallback(async (requestData: {
        fromUserId: string;
        fromUserName: string;
        toRoomNumber: string;
        toUserId?: string;
        warnings?: unknown;
        guestInfo: Guest;
    }): Promise<void> => {
        setLoading(true);
        try {
            await firebaseCreateRequest(requestData);
        } finally {
            setLoading(false);
        }
    }, []);

    const acceptRequest = useCallback(async (requestId: string, requestData: {
        toRoomNumber: string;
        fromUserId: string;
        guestInfo: Guest;
        warnings?: unknown;
    }): Promise<void> => {
        setLoading(true);
        try {
            await firebaseAcceptRequest(requestId, requestData);
        } finally {
            setLoading(false);
        }
    }, []);

    const rejectRequest = useCallback(async (requestId: string): Promise<void> => {
        setLoading(true);
        try {
            await firebaseRejectRequest(requestId);
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelRequest = useCallback(async (requestId: string): Promise<void> => {
        setLoading(true);
        try {
            await firebaseCancelRequest(requestId);
        } finally {
            setLoading(false);
        }
    }, []);

    const cleanup = useCallback(async (requestId: string): Promise<void> => {
        try {
            await firebaseCleanupRequest(requestId);
        } catch (e) {
            console.error(e);
        }
    }, []);

    return {
        requests,
        loading,
        sendRequest,
        acceptRequest,
        rejectRequest,
        cancelRequest,
        cleanup,
        REQUEST_STATUS
    };
}


