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
    generateSecurePassKey,
    // 관리자용
    subscribeToAllUsers,
    adminUpdateUser,
    deleteUserCompletely
} from './users';

// Invitations
export {
    createRoommateInvitation,
    checkPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    subscribeToMyInvitations,
    cancelInvitation,
    markInvitationNotified,
    cleanupUserInvitations
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

// ==================== Firestore 마이그레이션 ====================

// Firestore Users
export {
    createUser as createFirestoreUser,
    getUserByEmail as getFirestoreUserByEmail,
    getUserById as getFirestoreUserById,
    updateUser as updateFirestoreUser,
    deleteUser as deleteFirestoreUser,
    getAllUsers as getAllFirestoreUsers,
    subscribeToUser as subscribeToFirestoreUser,
    subscribeToAllUsers as subscribeToAllFirestoreUsers,
    checkEmailExists as checkFirestoreEmailExists,
    getUserCountByGender as getFirestoreUserCountByGender,
    verifyUserByEmail as verifyFirestoreUserByEmail,
    bulkCreateUsers as bulkCreateFirestoreUsers
} from './firestore/users';

// Firestore UserStays
export {
    createUserStay as createFirestoreUserStay,
    getUserStayByUserId as getFirestoreUserStayByUserId,
    getUserStayById as getFirestoreUserStayById,
    updateUserStay as updateFirestoreUserStay,
    deleteUserStay as deleteFirestoreUserStay,
    getAllUserStays as getAllFirestoreUserStays,
    getUserStaysByStatus as getFirestoreUserStaysByStatus,
    subscribeToUserStay as subscribeToFirestoreUserStay,
    subscribeToAllUserStays as subscribeToAllFirestoreUserStays,
    getOrCreateUserStay as getOrCreateFirestoreUserStay,
    updateUserStayBirthDate as updateFirestoreUserStayBirthDate,
    validateUserId as validateFirestoreUserId,
    checkReferentialIntegrity as checkFirestoreReferentialIntegrity,
    cascadeDeleteUserStay as cascadeDeleteFirestoreUserStay,
    getUserStaysByRoomId as getFirestoreUserStaysByRoomId,
    getUserStayStats as getFirestoreUserStayStats
} from './firestore/userStays';

// Firestore Room Assignment
export {
    assignRoom as assignFirestoreRoom,
    unassignRoom as unassignFirestoreRoom,
    changeRoom as changeFirestoreRoom,
    getRoomAssignmentStats as getFirestoreRoomAssignmentStats,
    canAssignRoom as canAssignFirestoreRoom
} from './firestore/roomAssignment';

