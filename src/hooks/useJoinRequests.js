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

export function useJoinRequests(mySessionId) {
    const [requests, setRequests] = useState({ received: [], sent: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!mySessionId) {
            setRequests({ received: [], sent: [] });
            return;
        }

        const unsubscribe = subscribeToJoinRequests(mySessionId, setRequests);
        return () => unsubscribe();
    }, [mySessionId]);

    const sendRequest = useCallback(async (requestData) => {
        setLoading(true);
        try {
            await firebaseCreateRequest(requestData);
        } finally {
            setLoading(false);
        }
    }, []);

    const acceptRequest = useCallback(async (requestId, requestData) => {
        setLoading(true);
        try {
            await firebaseAcceptRequest(requestId, requestData);
        } finally {
            setLoading(false);
        }
    }, []);

    const rejectRequest = useCallback(async (requestId) => {
        setLoading(true);
        try {
            await firebaseRejectRequest(requestId);
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelRequest = useCallback(async (requestId) => {
        setLoading(true);
        try {
            await firebaseCancelRequest(requestId);
        } finally {
            setLoading(false);
        }
    }, []);

    const cleanup = useCallback(async (requestId) => {
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
