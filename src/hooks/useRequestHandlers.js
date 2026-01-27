/**
 * 입실 요청 처리 관리 훅
 * 요청 결과 감지 및 수락/거절 핸들러
 */
import { useEffect, useCallback, useRef } from 'react';
import {
    notifyRequestAccepted,
    notifyRequestRejected
} from '../utils/notifications';

/**
 * @param {import('../types/types').User} user - 현재 사용자
 * @param {Object} requests - 요청 목록 (received, sent)
 * @param {Object} toast - Toast 알림 객체
 * @param {Function} cleanup - 요청 정리 함수
 * @param {Function} acceptRequest - 요청 수락 함수
 * @param {Function} rejectRequest - 요청 거절 함수
 * @param {Function} setSelectedRoomForConfirm - 선택 모달 제어 함수
 * @param {Function} setShowWarningModal - 경고 모달 제어 함수
 * @param {Function} setPendingSelection - 대기 선택 상태 setter
 * @param {string} REQUEST_STATUS - 요청 상태 상수
 * @param {Function} selectUserRoom - 방 선택 함수 (요청 수락 시 Guest의 방 배정 상태 업데이트용)
 * @returns {Object} 요청 처리 핸들러
 */
export function useRequestHandlers(
    user,
    requests,
    toast,
    cleanup,
    acceptRequest,
    rejectRequest,
    setSelectedRoomForConfirm,
    setShowWarningModal,
    setPendingSelection,
    REQUEST_STATUS,
    selectUserRoom
) {
    // 이미 처리된 요청 ID 추적 (중복 알람 방지)
    const processedRequestIds = useRef(new Set());

    // 요청 처리 결과 감지 Effect
    useEffect(() => {
        if (!user) return;

        // 거절된 요청 처리
        const rejectedReq = requests.sent.find(r => 
            r.status === REQUEST_STATUS.REJECTED && 
            !processedRequestIds.current.has(r.id)
        );
        if (rejectedReq) {
            processedRequestIds.current.add(rejectedReq.id);
            toast.warning('룸메이트가 요청을 거절했습니다.');
            notifyRequestRejected();
            cleanup(rejectedReq.id);
            // 모달들 닫기
            setSelectedRoomForConfirm(null);
            setShowWarningModal(false);
            setPendingSelection(null);
        }

        // 수락된 요청 처리
        const acceptedReq = requests.sent.find(r => 
            r.status === REQUEST_STATUS.ACCEPTED && 
            !processedRequestIds.current.has(r.id)
        );
        if (acceptedReq) {
            processedRequestIds.current.add(acceptedReq.id);
            toast.success('입장이 승인되었습니다!');
            notifyRequestAccepted(acceptedReq.toRoomNumber);
            
            // 요청을 보낸 유저(Guest)의 방 배정 상태 업데이트
            // acceptJoinRequest에서 이미 DB를 업데이트했지만, 클라이언트 상태도 동기화
            if (selectUserRoom && acceptedReq.toRoomNumber) {
                selectUserRoom(acceptedReq.toRoomNumber).catch(err => {
                    console.error('방 배정 상태 업데이트 실패:', err);
                });
            }
            
            cleanup(acceptedReq.id);
            // 모달들 닫기
            setSelectedRoomForConfirm(null);
            setShowWarningModal(false);
            setPendingSelection(null);
        }

        // 처리 완료된 요청은 추적 목록에서 제거 (메모리 누수 방지)
        // 단, pending 상태로 돌아간 요청은 다시 처리 가능하도록
        const allRequestIds = new Set(requests.sent.map(r => r.id));
        processedRequestIds.current.forEach(id => {
            if (!allRequestIds.has(id)) {
                processedRequestIds.current.delete(id);
            }
        });
    }, [
        requests.sent,
        user,
        cleanup,
        toast,
        setSelectedRoomForConfirm,
        setShowWarningModal,
        setPendingSelection,
        REQUEST_STATUS,
        selectUserRoom
    ]);

    // 요청 수락 핸들러 (Host용)
    const handleAcceptRequest = useCallback(async (request) => {
        try {
            await acceptRequest(request.id, request);
            // 수락 완료 후 요청 정리
            await cleanup(request.id);
            // 객실 선택 모달이 열려있으면 닫기
            setSelectedRoomForConfirm(null);
            // toast는 useEffect에서 실시간으로 처리하므로 중복 제거
            // Host 측에서는 조용히 처리 (Guest 측에서 승인 알람이 표시됨)
        } catch (error) {
            toast.error('수락 처리 중 오류: ' + error.message);
        }
    }, [acceptRequest, cleanup, setSelectedRoomForConfirm, toast]);

    // 요청 거절 핸들러 (Host용)
    const handleRejectRequest = useCallback(async (requestId) => {
        try {
            await rejectRequest(requestId);
            // 거절 후 요청은 Guest 측에서 cleanup 함
        } catch (error) {
            toast.error('거절 처리 중 오류: ' + error.message);
        }
    }, [rejectRequest, toast]);

    return {
        handleAcceptRequest,
        handleRejectRequest
    };
}
