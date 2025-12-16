import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, get } from 'firebase/database';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let database = null;

try {
    if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
        app = initializeApp(firebaseConfig);
        database = getDatabase(app);
    }
} catch (error) {
    // Firebase 초기화 실패 - 로컬 모드로 동작
}

export function isFirebaseInitialized() {
    return database !== null;
}

export function subscribeToRooms(callback) {
    if (!database) {
        callback({});
        return () => { };
    }

    const roomsRef = ref(database, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
        const data = snapshot.val() || {};
        callback(data);
    });

    return unsubscribe;
}

export async function selectRoom(roomNumber, guestData) {
    if (!database) return false;

    const roomRef = ref(database, `rooms/${roomNumber}/guests`);
    const snapshot = await get(roomRef);
    let currentGuests = snapshot.val() || [];

    if (currentGuests && !Array.isArray(currentGuests)) {
        currentGuests = Object.values(currentGuests);
    }

    if (currentGuests.some(g => g.sessionId === guestData.sessionId)) {
        throw new Error('이미 이 방에 등록되어 있습니다.');
    }

    const updatedGuests = [...currentGuests, guestData];
    await set(roomRef, updatedGuests);

    return true;
}

export async function saveUser(sessionId, userData) {
    if (!database) return false;

    const userRef = ref(database, `users/${sessionId}`);
    await set(userRef, {
        ...userData,
        selectedAt: Date.now(),
        locked: true
    });

    return true;
}

export async function getUser(sessionId) {
    if (!database) return null;

    const userRef = ref(database, `users/${sessionId}`);
    const snapshot = await get(userRef);
    return snapshot.val();
}

export async function removeGuestFromRoom(roomNumber, sessionId) {
    if (!database) return false;

    const roomRef = ref(database, `rooms/${roomNumber}/guests`);
    const snapshot = await get(roomRef);
    let currentGuests = snapshot.val() || [];

    if (currentGuests && !Array.isArray(currentGuests)) {
        currentGuests = Object.values(currentGuests);
    }

    const updatedGuests = currentGuests.filter(g => g.sessionId !== sessionId);
    await set(roomRef, updatedGuests);

    return true;
}

export async function createRoommateInvitation(inviterData, inviteeName) {
    if (!database) return null;

    const newInvitationRef = ref(database, `roommateInvitations/${Date.now()}`);

    const invitation = {
        roomNumber: inviterData.roomNumber,
        inviterSessionId: inviterData.sessionId,
        inviterName: inviterData.name,
        inviterCompany: inviterData.company || '',
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
    for (const [id, invitation] of Object.entries(data)) {
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

export async function createRoomChangeRequest(requestData) {
    if (!database) return null;

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
    const unsubscribe = onValue(requestsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const requests = Object.entries(data).map(([id, req]) => ({ id, ...req }));
        callback(requests.sort((a, b) => b.createdAt - a.createdAt));
    });

    return unsubscribe;
}

export async function resolveRoomChangeRequest(requestId) {
    if (!database) return false;

    const requestRef = ref(database, `roomChangeRequests/${requestId}`);
    await update(requestRef, {
        status: 'resolved',
        resolvedAt: Date.now()
    });

    return true;
}

export async function deleteRoomChangeRequest(requestId) {
    if (!database) return false;

    const requestRef = ref(database, `roomChangeRequests/${requestId}`);
    await set(requestRef, null);

    return true;
}

export async function clearUserSession(sessionId) {
    if (!database) return false;

    const userRef = ref(database, `users/${sessionId}`);
    await set(userRef, null);

    return true;
}

export { database, ref, onValue, set, update, get };
