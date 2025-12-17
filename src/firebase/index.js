/**
 * Firebase 모듈 통합 export
 * 기존 firebase.js와 동일한 인터페이스 제공
 */

// Config & Utilities
export { isFirebaseInitialized, database, ref, onValue, set, update, get } from './config';

// Auth
export { adminSignIn, adminSignOut, subscribeToAuthState } from './auth';

// Rooms
export { subscribeToRooms, selectRoom, removeGuestFromRoom, checkGuestInRoom } from './rooms';

// Users
export { saveUser, getUser, subscribeToUserSession, clearUserSession } from './users';

// Invitations
export {
    createRoommateInvitation,
    checkPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    subscribeToMyInvitations,
    cancelInvitation
} from './invitations';

// Requests
export {
    createRoomChangeRequest,
    subscribeToRoomChangeRequests,
    resolveRoomChangeRequest,
    deleteRoomChangeRequest
} from './requests';
