/**
 * Firebase 모듈 통합 export
 * 기존 firebase.js와 동일한 인터페이스 제공
 */

// Config & Utilities
export { isFirebaseInitialized, database, ref, onValue, set, update, get } from './config';

// Auth
export { adminSignIn, adminSignOut, subscribeToAuthState } from './auth';

// Rooms
export { subscribeToRooms, selectRoom, removeGuestFromRoom, checkGuestInRoom, updateGuestInfo, checkDuplicateName } from './rooms';

// Users
export {
    saveUser,
    updateUser,
    getUser,
    subscribeToUserSession,
    clearUserSession,
    createOtpRequest,
    verifyOtpRequest,
    generateSecurePassKey
} from './users';

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

// Inquiries
export {
    createInquiry,
    subscribeToInquiries,
    getMyInquiries,
    replyToInquiry,
    deleteInquiry
} from './inquiries';

// History
export {
    HISTORY_ACTIONS,
    addHistory,
    logGuestAdd,
    logGuestRemove,
    logGuestEdit,
    logRoomChange,
    subscribeToHistory,
    getRoomHistory
} from './history';

// Settings
export {
    subscribeToSettings,
    getSettings,
    saveSettings,
    setDeadline,
    checkDeadline,
    getTimeUntilDeadline
} from './settings';

// Allowed Users (사전등록 유저)
export {
    subscribeToAllowedUsers,
    getAllowedUsers,
    verifyUser,
    markUserAsRegistered,
    addAllowedUser,
    removeAllowedUser,
    bulkAddAllowedUsers,
    clearAllAllowedUsers
} from './allowedUsers';

// Join Requests (입실 요청)
export {
    createJoinRequest,
    subscribeToJoinRequests,
    acceptJoinRequest,
    rejectJoinRequest,
    cancelJoinRequest,
    cleanupRequest,
    REQUEST_STATUS
} from './joinRequests';
