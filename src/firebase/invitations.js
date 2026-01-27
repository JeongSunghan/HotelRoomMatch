/**
 * Firebase 룸메이트 초대 관련 모듈
 */
import { database, ref, onValue, set, update, get } from './config';
import { selectRoom, setRoomPending, allowRoomPendingAccept, clearRoomPending } from './rooms';
import { INVITATION_EXPIRY_MS } from '../utils/constants';

/**
 * 룸메이트 초대 생성
 * @param {Object} inviterData - 초대자 정보 (roomNumber, sessionId, name, gender 등)
 * @param {string} inviteeName - 초대 대상 이름
 */
export async function createRoommateInvitation(inviterData, inviteeName) {
    if (!database) return null;

    // 초대 대상이 이미 방에 배정되어 있는지 확인
    const allRoomsRef = ref(database, 'rooms');
    const allRoomsSnapshot = await get(allRoomsRef);
    const allRooms = allRoomsSnapshot.val() || {};

    for (const [roomNumber, roomInfo] of Object.entries(allRooms)) {
        let guests = roomInfo.guests || [];
        if (!Array.isArray(guests)) {
            guests = Object.values(guests);
        }

        // 초대 대상 이름이 이미 방에 배정되어 있는지 확인
        if (guests.some(g => g.name === inviteeName.trim())) {
            throw new Error(`${inviteeName}님은 이미 다른 객실(${roomNumber}호)에 배정되어 있습니다.`);
        }
    }

    const createdAt = Date.now();
    const invitationId = String(createdAt);
    const newInvitationRef = ref(database, `roommateInvitations/${invitationId}`);

    const invitation = {
        roomNumber: inviterData.roomNumber,
        inviterSessionId: inviterData.sessionId,
        inviterName: inviterData.name,
        inviterCompany: inviterData.company || '',
        inviterGender: inviterData.gender, // 성별 검증용
        inviteeName: inviteeName.trim(),
        status: 'pending',
        createdAt
    };

    await set(newInvitationRef, invitation);

    // PHASE 3 (Case 1): 초대 진행 중 객실 pending 잠금 설정
    // - reserved(60초) 만료 이후에도 2인실의 2번째 슬롯을 타인이 선점하지 못하도록 차단
    try {
        await setRoomPending(inviterData.roomNumber, {
            invitationId,
            inviterSessionId: inviterData.sessionId,
            inviteeName: inviteeName.trim(),
            createdAt,
            expiresAt: createdAt + INVITATION_EXPIRY_MS,
        });
    } catch (e) {
        // pending 잠금 설정 실패 시 초대도 롤백(무결성 유지)
        await set(newInvitationRef, null);
        throw e;
    }

    return invitation;
}

/**
 * 유저가 방에서 나갈 때 해당 유저가 보낸 초대 정리
 * @param {string} sessionId - 유저 세션 ID
 */
export async function cleanupUserInvitations(sessionId) {
    if (!database) return;

    const invitationsRef = ref(database, 'roommateInvitations');
    const snapshot = await get(invitationsRef);
    const data = snapshot.val() || {};

    for (const [id, invitation] of Object.entries(data)) {
        // 해당 유저가 보낸 pending 초대 삭제
        if (invitation.inviterSessionId === sessionId && invitation.status === 'pending') {
            await set(ref(database, `roommateInvitations/${id}`), null);
            // 객실 pending 잠금도 함께 해제(베스트 에포트)
            clearRoomPending(invitation.roomNumber, id).catch(() => { });
        }
    }
}


export async function checkPendingInvitations(userName) {
    if (!database) return [];

    const invitationsRef = ref(database, 'roommateInvitations');
    const snapshot = await get(invitationsRef);
    const data = snapshot.val() || {};

    const pendingInvitations = [];
    const now = Date.now();

    for (const [id, invitation] of Object.entries(data)) {
        // 24시간 지난 pending 초대는 만료 처리
        if (invitation.status === 'pending' && invitation.createdAt && (now - invitation.createdAt) > INVITATION_EXPIRY_MS) {
            set(ref(database, `roommateInvitations/${id}`), null).catch(() => { });
            // 만료된 초대에 연결된 pending 잠금도 함께 해제(베스트 에포트)
            clearRoomPending(invitation.roomNumber, id).catch(() => { });
            continue;
        }

        // 완료된 초대(accepted/rejected)는 24시간 후 자동 삭제
        if ((invitation.status === 'accepted' || invitation.status === 'rejected') && invitation.createdAt) {
            const completedAt = invitation.acceptedAt || invitation.rejectedAt || invitation.createdAt;
            if ((now - completedAt) > INVITATION_EXPIRY_MS) {
                set(ref(database, `roommateInvitations/${id}`), null).catch(() => { });
                continue;
            }
        }

        if (invitation.inviteeName === userName.trim() && invitation.status === 'pending') {
            pendingInvitations.push({ id, ...invitation });
        }
    }

    return pendingInvitations;
}

/**
 * 초대 수락 (서버 측 검증 강화)
 */
export async function acceptInvitation(invitationId, acceptorData, roomGender = null) {
    if (!database) return false;

    const invitationRef = ref(database, `roommateInvitations/${invitationId}`);
    const snapshot = await get(invitationRef);
    const invitation = snapshot.val();

    // 1. 초대 유효성 검증
    if (!invitation || invitation.status !== 'pending') {
        throw new Error('유효하지 않은 초대입니다.');
    }

    // 2. 초대 만료 검증 (서버 측)
    const now = Date.now();
    if (invitation.createdAt && (now - invitation.createdAt) > INVITATION_EXPIRY_MS) {
        // 만료된 초대 삭제
        await set(invitationRef, null);
        throw new Error('초대가 만료되었습니다.');
    }

    // 3. 성별 검증: 초대자와 수락자의 성별이 다르면 거부
    if (invitation.inviterGender && acceptorData.gender && invitation.inviterGender !== acceptorData.gender) {
        throw new Error('성별이 다른 사용자와는 같은 객실을 사용할 수 없습니다.');
    }

    // 4. 수락자가 이미 다른 방에 배정되어 있는지 확인 (서버 측)
    const allRoomsRef = ref(database, 'rooms');
    const allRoomsSnapshot = await get(allRoomsRef);
    const allRooms = allRoomsSnapshot.val() || {};

    for (const [existingRoom, roomInfo] of Object.entries(allRooms)) {
        let guests = roomInfo.guests || [];
        if (!Array.isArray(guests)) {
            guests = Object.values(guests);
        }

        if (guests.some(g => g.sessionId === acceptorData.sessionId)) {
            throw new Error('이미 다른 객실에 배정되어 있습니다.');
        }
    }

    // 5. 초대 상태 업데이트
    // 5-1. pending 잠금에서 수락자 세션만 통과 허용(서버 검증용)
    // - 구버전 초대(잠금이 없을 수도 있음)와의 호환을 위해 베스트 에포트로 처리
    try {
        await allowRoomPendingAccept(invitation.roomNumber, invitationId, acceptorData.sessionId);
    } catch (_) {
        // ignore
    }

    // 6. 방 선택 (selectRoom에서 추가 검증 수행)
    await selectRoom(invitation.roomNumber, acceptorData, 2, roomGender);

    // 7. 초대 상태 업데이트 (방 선택 성공 후 확정)
    await update(invitationRef, {
        status: 'accepted',
        acceptedAt: Date.now(),
        acceptorSessionId: acceptorData.sessionId
    });

    // 8. pending 잠금 해제(베스트 에포트)
    clearRoomPending(invitation.roomNumber, invitationId).catch(() => { });
    return invitation.roomNumber;
}

export async function rejectInvitation(invitationId, rejectorData) {
    if (!database) return false;

    const invitationRef = ref(database, `roommateInvitations/${invitationId}`);
    const snapshot = await get(invitationRef);
    const invitation = snapshot.val();

    await update(invitationRef, {
        status: 'rejected',
        rejectedAt: Date.now(),
        rejectorSessionId: rejectorData.sessionId,
        notified: false // 초대자에게 알림 필요
    });

    // pending 잠금 해제(베스트 에포트)
    if (invitation?.roomNumber) {
        clearRoomPending(invitation.roomNumber, invitationId).catch(() => { });
    }

    return true;
}

/**
 * 거절 알림 확인 처리 (초대자가 알림을 확인했을 때 호출)
 */
export async function markInvitationNotified(invitationId) {
    if (!database) return false;

    const invitationRef = ref(database, `roommateInvitations/${invitationId}`);
    await update(invitationRef, { notified: true });
    return true;
}

export function subscribeToMyInvitations(sessionId, callback) {
    if (!database) {
        callback([]);
        return () => { };
    }

    const invitationsRef = ref(database, 'roommateInvitations');
    const unsubscribe = onValue(invitationsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const myInvitations = [];

        for (const [id, invitation] of Object.entries(data)) {
            if (invitation.inviterSessionId === sessionId) {
                myInvitations.push({ id, ...invitation });
            }
        }

        callback(myInvitations);
    });

    return unsubscribe;
}

/**
 * 내가 보낸 초대 취소
 */
export async function cancelInvitation(invitationId, inviterSessionId) {
    if (!database) return false;

    const invitationRef = ref(database, `roommateInvitations/${invitationId}`);
    const snapshot = await get(invitationRef);
    const invitation = snapshot.val();

    // 초대가 존재하고, 내가 보낸 초대인지, pending 상태인지 확인
    if (!invitation) {
        throw new Error('초대를 찾을 수 없습니다.');
    }

    if (invitation.inviterSessionId !== inviterSessionId) {
        throw new Error('본인이 보낸 초대만 취소할 수 있습니다.');
    }

    if (invitation.status !== 'pending') {
        throw new Error('이미 처리된 초대입니다.');
    }

    // 초대 삭제
    await set(invitationRef, null);
    // pending 잠금 해제(베스트 에포트)
    clearRoomPending(invitation.roomNumber, invitationId).catch(() => { });
    return true;
}
