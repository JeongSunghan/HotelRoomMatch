import { useState, useEffect, useCallback, useRef } from 'react';
import { getGenderFromResidentId } from '../utils/genderUtils';
import { subscribeToAuthState, adminSignIn, adminSignOut, getUser as firebaseGetUser, isFirebaseInitialized, subscribeToUserSession } from '../firebase';

const STORAGE_KEY = 'vup58_user';

function generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function useUser() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminUser, setAdminUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const sessionUnsubscribeRef = useRef(null);

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

                    // Firebase에서 세션이 삭제되었는지 확인 (관리자가 삭제한 경우)
                    if (isFirebaseInitialized() && parsed.locked && parsed.sessionId) {
                        const firebaseSession = await firebaseGetUser(parsed.sessionId);
                        if (!firebaseSession) {
                            // 세션이 Firebase에서 삭제됨 → localStorage 초기화
                            localStorage.removeItem(STORAGE_KEY);
                            setUser(null);
                            setIsLoading(false);
                            return;
                        }

                        // 실시간 세션 구독 (관리자 삭제 즉시 감지)
                        sessionUnsubscribeRef.current = subscribeToUserSession(parsed.sessionId, (sessionData) => {
                            if (!sessionData) {
                                // 세션이 삭제됨 → 즉시 로그아웃
                                localStorage.removeItem(STORAGE_KEY);
                                setUser(null);
                            }
                        });
                    }

                    setUser(parsed);
                } catch (e) {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
            setIsLoading(false);
        };

        loadAndValidateUser();

        return () => {
            unsubscribe();
            if (sessionUnsubscribeRef.current) {
                sessionUnsubscribeRef.current();
            }
        };
    }, []);

    const registerUser = useCallback((userData) => {
        const { name, company, residentIdFront, residentIdBack, age, snoring } = userData;

        const gender = getGenderFromResidentId(residentIdBack);
        if (!gender) {
            throw new Error('유효하지 않은 주민번호입니다.');
        }

        const newUser = {
            sessionId: generateSessionId(),
            name: name.trim(),
            company: company?.trim() || '',
            gender,
            age: age || null,
            snoring: snoring || 'no',
            residentIdFront,
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
