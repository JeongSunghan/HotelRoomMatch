/**
 * Firebase 룸메이트 초대 관련 모듈
 */
import { database, ref, onValue, set, update, get } from './config';
import { selectRoom, releaseRoomReservation } from './rooms';
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

    const newInvitationRef = ref(database, `roommateInvitations/${Date.now()}`);

    const invitation = {
        roomNumber: inviterData.roomNumber,
        inviterSessionId: inviterData.sessionId,
        inviterName: inviterData.name,
        inviterCompany: inviterData.company || '',
        inviterGender: inviterData.gender, // 성별 검증용
        inviteeName: inviteeName.trim(),
        status: 'pending',
        createdAt: Date.now()
    };

    await set(newInvitationRef, invitation);
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
            // 예약 슬롯 해제
            await releaseRoomReservation(invitation.roomNumber, sessionId).catch(() => { });
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

            // 만료 시 예약 슬롯 해제
            if (invitation.roomNumber && invitation.inviterSessionId) {
                releaseRoomReservation(invitation.roomNumber, invitation.inviterSessionId).catch(() => { });
            }
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
    await update(invitationRef, {
        status: 'accepted',
        acceptedAt: Date.now(),
        acceptorSessionId: acceptorData.sessionId
    });

    // 6. 예약 슬롯 해제 (초대자의 예약을 해제)
    await releaseRoomReservation(invitation.roomNumber, invitation.inviterSessionId).catch(() => { });

    // 7. 방 선택 (selectRoom에서 추가 검증 수행)
    await selectRoom(invitation.roomNumber, acceptorData, 2, roomGender);
    return invitation.roomNumber;
}

export async function rejectInvitation(invitationId, rejectorData) {
    if (!database) return false;

    const invitationRef = ref(database, `roommateInvitations/${invitationId}`);
    const snapshot = await get(invitationRef);
    const invitation = snapshot.val(); // 초대 정보 가져오기

    await update(invitationRef, {
        status: 'rejected',
        rejectedAt: Date.now(),
        rejectorSessionId: rejectorData.sessionId,
        notified: false // 초대자에게 알림 필요
    });

    // 예약 슬롯 해제 (거절 시에도 슬롯 풀어야 함)
    if (invitation) {
        await releaseRoomReservation(invitation.roomNumber, invitation.inviterSessionId).catch(() => { });
    }

    return true;
}

/**
 * 거절 알림 확인 처리 (초대자가 알림을 확인했을 때 호출)
 */
export async function markInvitationNotified(invitationId) {
    if (!database) return false;

    const invitationRef = ref(database, `roommateInvitations/${invitationId}`);

    // 알림 확인 시 예약 해제 한 번 더 시도 (안전장치)
    const snapshot = await get(invitationRef);
    const invitation = snapshot.val();
    if (invitation) {
        await releaseRoomReservation(invitation.roomNumber, invitation.inviterSessionId).catch(() => { });
    }

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

    // 예약 슬롯 해제
    await releaseRoomReservation(invitation.roomNumber, inviterSessionId).catch(() => { });

    return true;
}
