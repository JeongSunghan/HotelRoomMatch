/**
 * Firebase 룸메이트 초대 관련 모듈
 */
import { database, ref, onValue, set, update, get } from './config';
import { selectRoom } from './rooms';
import { INVITATION_EXPIRY_MS } from '../utils/constants';

export async function createRoommateInvitation(inviterData, inviteeName) {
    if (!database) return null;

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

export async function checkPendingInvitations(userName) {
    if (!database) return [];

    const invitationsRef = ref(database, 'roommateInvitations');
    const snapshot = await get(invitationsRef);
    const data = snapshot.val() || {};

    const pendingInvitations = [];
    const now = Date.now();

    for (const [id, invitation] of Object.entries(data)) {
        // 24시간 지난 초대는 만료 처리
        if (invitation.createdAt && (now - invitation.createdAt) > INVITATION_EXPIRY_MS) {
            // 만료된 초대 자동 삭제 (비동기로 처리, 결과 대기 안함)
            set(ref(database, `roommateInvitations/${id}`), null).catch(() => { });
            continue;
        }

        if (invitation.inviteeName === userName.trim() && invitation.status === 'pending') {
            pendingInvitations.push({ id, ...invitation });
        }
    }

    return pendingInvitations;
}

export async function acceptInvitation(invitationId, acceptorData) {
    if (!database) return false;

    const invitationRef = ref(database, `roommateInvitations/${invitationId}`);
    const snapshot = await get(invitationRef);
    const invitation = snapshot.val();

    if (!invitation || invitation.status !== 'pending') {
        throw new Error('유효하지 않은 초대입니다.');
    }

    // 성별 검증: 초대자와 수락자의 성별이 다르면 거부
    if (invitation.inviterGender && acceptorData.gender && invitation.inviterGender !== acceptorData.gender) {
        throw new Error('성별이 다른 사용자와는 같은 객실을 사용할 수 없습니다.');
    }

    await update(invitationRef, {
        status: 'accepted',
        acceptedAt: Date.now(),
        acceptorSessionId: acceptorData.sessionId
    });

    await selectRoom(invitation.roomNumber, acceptorData);
    return invitation.roomNumber;
}

export async function rejectInvitation(invitationId, rejectorData) {
    if (!database) return false;

    const invitationRef = ref(database, `roommateInvitations/${invitationId}`);

    await update(invitationRef, {
        status: 'rejected',
        rejectedAt: Date.now(),
        rejectorSessionId: rejectorData.sessionId
    });

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
    return true;
}
