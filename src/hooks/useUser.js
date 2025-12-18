import { useState, useEffect, useCallback, useRef } from 'react';
import { getGenderFromResidentId } from '../utils/genderUtils';
import { STORAGE_KEYS, SESSION_EXPIRY_MS } from '../utils/constants';
import { sanitizeUserData, isValidSessionId } from '../utils/sanitize';
import { subscribeToAuthState, adminSignIn, adminSignOut, isFirebaseInitialized, checkGuestInRoom } from '../firebase/index';

const STORAGE_KEY = STORAGE_KEYS.USER;

// 보안 강화된 세션 ID 생성
function generateSessionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return 'session_' + crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'session_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function useUser() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminUser, setAdminUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Firebase Auth 상태 구독 (Admin)
    useEffect(() => {
        const unsubscribe = subscribeToAuthState((firebaseUser) => {
            if (firebaseUser) {
                setIsAdmin(true);
                setAdminUser(firebaseUser);
            } else {
                setIsAdmin(false);
                setAdminUser(null);
            }
        });

        // 저장된 사용자 정보 로드 및 세션 유효성 확인
        const loadAndValidateUser = async () => {
            const savedUser = localStorage.getItem(STORAGE_KEY);
            if (savedUser) {
                try {
                    const parsed = JSON.parse(savedUser);

                    // 세션 ID 형식 검증 (보안 강화)
                    if (parsed.sessionId && !isValidSessionId(parsed.sessionId)) {
                        console.log('세션 ID 형식 유효성 검사 실패 -> 로그아웃 처리');
                        localStorage.removeItem(STORAGE_KEY);
                        setUser(null);
                        setIsLoading(false);
                        return;
                    }

                    // 세션 만료 체크 (24시간)
                    if (parsed.registeredAt) {
                        const sessionAge = Date.now() - parsed.registeredAt;
                        if (sessionAge > SESSION_EXPIRY_MS) {
                            console.log('세션 만료됨 (확인 24시간 경과) -> 로그아웃 처리');
                            localStorage.removeItem(STORAGE_KEY);
                            setUser(null);
                            setIsLoading(false);
                            return;
                        }
                    }

                    // Firebase 연결 상태일 때만 유효성 검사 수행
                    if (isFirebaseInitialized() && parsed.locked && parsed.sessionId && parsed.selectedRoom) {
                        // 실제 방에 유저가 존재하는지 확인 (users 컬렉션 대신 rooms 조회)
                        const exists = await checkGuestInRoom(parsed.selectedRoom, parsed.sessionId);

                        if (!exists) {
                            // 방에서 삭제된 경우 (관리자 취소 등)
                            // 단, 일시적 네트워크 오류일 수 있으므로 신중해야 함.
                            // 하지만 checkGuestInRoom은 DB를 직접 조회하므로 데이터가 확실함.
                            console.log('세션 유효성 검사 실패: 방에 유저 없음 -> 로그아웃 처리');
                            localStorage.removeItem(STORAGE_KEY);
                            setUser(null);
                            setIsLoading(false);
                            return;
                        }
                    }

                    setUser(parsed);
                } catch (e) {
                    console.error('세션 복구 오류:', e);
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
            setIsLoading(false);
        };

        loadAndValidateUser();

        return () => {
            unsubscribe();
        };
    }, []);

    const registerUser = useCallback((userData) => {
        // 입력값 정리 (XSS 방지)
        const sanitized = sanitizeUserData(userData);
        const { name, company, residentIdBack, age, snoring } = sanitized;

        const gender = getGenderFromResidentId(residentIdBack);
        if (!gender) {
            throw new Error('유효하지 않은 주민번호입니다.');
        }

        const newUser = {
            sessionId: generateSessionId(),
            name,
            company,
            gender,
            age: age || null,
            snoring: snoring || 'no',
            // residentIdFront는 보안상 저장하지 않음
            registeredAt: Date.now(),
            selectedRoom: null,
            locked: false
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);

        return newUser;
    }, []);

    const selectRoom = useCallback((roomNumber) => {
        if (!user) return;

        const updatedUser = {
            ...user,
            selectedRoom: roomNumber,
            selectedAt: Date.now(),
            locked: true
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);

        return updatedUser;
    }, [user]);

    const loginAdmin = useCallback(async (email, password) => {
        const firebaseUser = await adminSignIn(email, password);
        setIsAdmin(true);
        setAdminUser(firebaseUser);
        return firebaseUser;
    }, []);

    const logoutAdmin = useCallback(async () => {
        await adminSignOut();
        setIsAdmin(false);
        setAdminUser(null);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
    }, []);

    const canSelect = user && !user.locked;

    const isMyRoom = useCallback((roomNumber) => {
        return user?.selectedRoom === roomNumber;
    }, [user]);

    return {
        user,
        isAdmin,
        adminUser,
        isLoading,
        isRegistered: !!user,
        canSelect,
        registerUser,
        selectRoom,
        loginAdmin,
        logoutAdmin,
        logout,
        isMyRoom
    };
}
