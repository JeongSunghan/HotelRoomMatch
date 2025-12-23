/**
 * Firebase 사용자 관련 모듈
 */
import { database, ref, onValue, set, update, get } from './config';

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

export async function updateUser(sessionId, updates) {
    if (!database) return false;

    const userRef = ref(database, `users/${sessionId}`);
    await update(userRef, updates);
    return true;
}

export async function getUser(sessionId) {
    if (!database) return null;

    const userRef = ref(database, `users/${sessionId}`);
    const snapshot = await get(userRef);
    return snapshot.val();
}

// 사용자 세션 실시간 구독 (관리자 삭제 감지용)
export function subscribeToUserSession(sessionId, callback) {
    if (!database || !sessionId) {
        callback(null);
        return () => { };
    }

    const userRef = ref(database, `users/${sessionId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
        callback(snapshot.val());
    });

    return unsubscribe;
}

export async function clearUserSession(sessionId) {
    if (!database) return false;

    const userRef = ref(database, `users/${sessionId}`);
    await set(userRef, null);

    return true;
}

// ==================== 관리자용 함수 ====================

/**
 * 모든 활성 유저 실시간 구독 (관리자용)
 * @param {Function} callback - 유저 목록 콜백
 * @returns {Function} unsubscribe 함수
 */
export function subscribeToAllUsers(callback) {
    if (!database) {
        callback([]);
        return () => { };
    }

    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
        const data = snapshot.val() || {};
        const users = Object.entries(data).map(([sessionId, user]) => ({
            sessionId,
            ...user
        }));
        callback(users);
    });

    return unsubscribe;
}

/**
 * 관리자용 유저 정보 업데이트 (성별 변경 등 모든 필드)
 * 객실 게스트 정보도 함께 동기화
 * @param {string} sessionId - 유저 세션 ID
 * @param {Object} updates - 업데이트할 필드들
 * @returns {Promise<boolean>}
 */
export async function adminUpdateUser(sessionId, updates) {
    if (!database) return false;

    // 1. users/{sessionId} 업데이트
    const userRef = ref(database, `users/${sessionId}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val();

    if (!userData) return false;

    await update(userRef, {
        ...updates,
        updatedAt: Date.now()
    });

    // 2. 유저가 객실에 배정되어 있다면 rooms/{roomNumber}/guests도 업데이트
    if (userData.selectedRoom) {
        const roomRef = ref(database, `rooms/${userData.selectedRoom}`);
        const roomSnapshot = await get(roomRef);
        const roomData = roomSnapshot.val();

        if (roomData && roomData.guests) {
            let guests = roomData.guests;
            if (!Array.isArray(guests)) {
                guests = Object.values(guests);
            }

            // 해당 유저의 게스트 정보 찾아서 업데이트
            const updatedGuests = guests.map(guest => {
                if (guest.sessionId === sessionId) {
                    return { ...guest, ...updates };
                }
                return guest;
            });

            await update(roomRef, { guests: updatedGuests });
        }
    }

    return true;
}

/**
 * 유저 완전 삭제 (탈퇴 처리)
 * users, allowedUsers, rooms, otp_requests, roommateInvitations, joinRequests 모두에서 제거
 * @param {string} sessionId - 유저 세션 ID
 * @param {string} email - 유저 이메일
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteUserCompletely(sessionId, email) {
    if (!database) return { success: false, message: 'Database not connected' };

    try {
        // 1. users/{sessionId}에서 유저 정보 조회
        const userRef = ref(database, `users/${sessionId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        // 2. 객실에서 제거 (배정되어 있는 경우)
        if (userData && userData.selectedRoom) {
            const roomRef = ref(database, `rooms/${userData.selectedRoom}`);
            const roomSnapshot = await get(roomRef);
            const roomData = roomSnapshot.val();

            if (roomData && roomData.guests) {
                let guests = roomData.guests;
                if (!Array.isArray(guests)) {
                    guests = Object.values(guests);
                }

                const filteredGuests = guests.filter(g => g.sessionId !== sessionId);
                await set(roomRef, filteredGuests.length > 0 ? { guests: filteredGuests } : null);
            }
        }

        // 3. users/{sessionId} 삭제
        await set(userRef, null);

        // 4. allowedUsers에서 registered 상태 초기화 (재가입 가능하도록)
        if (email) {
            const emailKey = btoa(email.toLowerCase()).replace(/=/g, '');
            const allowedUserRef = ref(database, `allowedUsers/${emailKey}`);
            const allowedSnapshot = await get(allowedUserRef);
            const allowedData = allowedSnapshot.val();

            if (allowedData) {
                await update(allowedUserRef, {
                    registered: false,
                    registeredSessionId: null,
                    registeredUid: null,
                    registeredAt: null,
                    deletedAt: Date.now()
                });
            }
        }

        // 5. otp_requests 삭제 (있을 경우)
        if (email) {
            const emailKey = btoa(email.toLowerCase()).replace(/=/g, '');
            const otpRef = ref(database, `otp_requests/${emailKey}`);
            await set(otpRef, null);
        }

        // 6. 해당 유저와 관련된 초대 삭제 (보낸 것 + 받은 것)
        const invitationsRef = ref(database, 'roommateInvitations');
        const invSnapshot = await get(invitationsRef);
        const invitations = invSnapshot.val() || {};

        for (const [id, inv] of Object.entries(invitations)) {
            if (inv.inviterSessionId === sessionId || inv.acceptorSessionId === sessionId) {
                await set(ref(database, `roommateInvitations/${id}`), null);
            }
        }

        // 7. 해당 유저와 관련된 입실 요청 삭제
        const requestsRef = ref(database, 'joinRequests');
        const reqSnapshot = await get(requestsRef);
        const requests = reqSnapshot.val() || {};

        for (const [id, req] of Object.entries(requests)) {
            if (req.fromUserId === sessionId || req.toUserId === sessionId) {
                await set(ref(database, `joinRequests/${id}`), null);
            }
        }

        return { success: true, message: '유저가 완전히 삭제되었습니다.' };
    } catch (error) {
        console.error('deleteUserCompletely error:', error);
        return { success: false, message: error.message };
    }
}

// ==================== OTP 서버사이드 검증 ====================

/**
 * 간단한 해시 함수 (Web Crypto API)
 * @param {string} text - 해시할 텍스트
 * @returns {Promise<string>} 해시 문자열
 */
async function simpleHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text + 'vup58_otp_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * 해시 검증
 */
async function verifyHash(input, hash) {
    const inputHash = await simpleHash(input);
    return inputHash === hash;
}

/**
 * OTP 생성 및 DB 저장
 * @param {string} email - 사용자 이메일
 * @returns {Promise<string>} 생성된 OTP 코드 (이메일 전송용)
 */
export async function createOtpRequest(email) {
    if (!database) {
        // Firebase 미연결 시 코드만 반환 (개발용)
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    const emailKey = btoa(email.toLowerCase()).replace(/=/g, '');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await simpleHash(code);

    const otpRef = ref(database, `otp_requests/${emailKey}`);
    await set(otpRef, {
        hashedCode,
        expiresAt: Date.now() + 180000, // 3분
        attempts: 0,
        createdAt: Date.now()
    });

    return code;
}

/**
 * OTP 검증 (서버 측)
 * @param {string} email - 사용자 이메일
 * @param {string} inputCode - 입력된 OTP 코드
 * @returns {Promise<{valid: boolean, message?: string}>}
 */
export async function verifyOtpRequest(email, inputCode) {
    if (!database) {
        // Firebase 미연결 시 항상 실패 (보안)
        return { valid: false, message: 'Firebase 연결이 필요합니다.' };
    }

    const emailKey = btoa(email.toLowerCase()).replace(/=/g, '');
    const otpRef = ref(database, `otp_requests/${emailKey}`);
    const snapshot = await get(otpRef);

    if (!snapshot.exists()) {
        return { valid: false, message: '인증 요청을 찾을 수 없습니다. 다시 요청해주세요.' };
    }

    const data = snapshot.val();

    // 만료 확인
    if (Date.now() > data.expiresAt) {
        await set(otpRef, null); // 만료된 OTP 삭제
        return { valid: false, message: '인증 시간이 만료되었습니다. 다시 요청해주세요.' };
    }

    // 시도 횟수 제한 (5회)
    if (data.attempts >= 5) {
        await set(otpRef, null); // 초과 시 삭제
        return { valid: false, message: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' };
    }

    // 코드 검증
    const isValid = await verifyHash(inputCode, data.hashedCode);

    if (!isValid) {
        // 시도 횟수 증가
        await update(otpRef, { attempts: data.attempts + 1 });
        const remaining = 5 - (data.attempts + 1);
        return { valid: false, message: `인증번호가 일치하지 않습니다. (${remaining}회 남음)` };
    }

    // 성공 시 OTP 삭제 (재사용 방지)
    await set(otpRef, null);
    return { valid: true };
}

/**
 * 안전한 PassKey 생성 (Base64 대신 완전 랜덤)
 * @returns {string} 64자 hex 문자열
 */
export function generateSecurePassKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
