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

        // 이메일 링크 로그인 처리
        const handleEmailLinkSignIn = async () => {
            // 동적 import로 순환 참조 방지 및 필요한 시점에 로드
            const { isSignInWithEmailLink, signInWithEmailLink, getAuth } = await import('firebase/auth');
            const { verifyUser, markUserAsRegistered } = await import('../firebase/index');

            const auth = getAuth();

            if (isSignInWithEmailLink(auth, window.location.href)) {
                let email = localStorage.getItem('emailForSignIn');

                // 이메일이 없으면 (다른 기기에서 연 경우) 사용자에게 물어봄
                if (!email) {
                    email = window.prompt('보안을 위해 이메일 확인이 필요합니다.\n링크를 전송받은 이메일 주소를 입력해주세요:');
                }

                if (email) {
                    try {
                        const result = await signInWithEmailLink(auth, email, window.location.href);

                        // 인증 성공 후 로컬 스토리지 정리
                        localStorage.removeItem('emailForSignIn');

                        // DB에서 유저 정보 가져오기 -> 세션 생성
                        const allowedCheck = await verifyUser(email);
                        if (allowedCheck.valid && allowedCheck.user) {
                            // 기존 세션 복구 또는 새 세션 생성
                            const userData = allowedCheck.user;

                            // 필수 정보 확인 (이름, 회사 등)
                            // 여기서 sessionId를 새로 생성하거나 기존 것을 쓸지 결정해야 함.
                            // 기존 registeredSessionId가 유효하다면 재활용? 
                            // -> 보안상 새로 발급하는 것이 좋으나, 방 배정 상태 유지하려면...
                            // -> 일단은 새 세션 ID 발급하고, 만약 이미 방에 배정된 상태라면(userData.registered) 그 정보를 유지해야 함.

                            const newUser = {
                                sessionId: userData.registeredSessionId || generateSessionId(), // 기존 세션 유지 시도
                                name: userData.name,
                                email: userData.email, // 이메일 저장
                                company: userData.company,
                                locked: !!userData.registered, // 이미 등록된 경우 잠금 상태일 수 있음 (확인 필요)
                                selectedRoom: null, // 일단 null, 방 상태 복구 로직 필요
                                registeredAt: Date.now()
                            };

                            // 이미 등록된 유저라면 추가 정보(성별, 나이 등)도 가져와야 함.
                            // 하지만 allowedUsers DB에는 민감정보(주민뒷자리 등)가 없을 수 있음.
                            // -> 하이브리드 방식에서는 로그인 시점에 다시 DB 동기화가 필요함.
                            // 일단 기본 정보만 세션에 저장.

                            localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
                            setUser(newUser);

                            // 인증 완료 표시
                            await markUserAsRegistered(email, newUser.sessionId, result.user.uid);

                            // URL 정리 (인증 코드 제거)
                            window.history.replaceState({}, document.title, window.location.pathname);
                        } else {
                            alert('사전 등록된 사용자 정보가 없습니다. 관리자에게 문의하세요.');
                        }
                    } catch (error) {
                        console.error('이메일 링크 로그인 실패:', error);
                        alert('로그인에 실패했습니다. 링크가 만료되었거나 이미 사용되었습니다.');
                    }
                }
            }
        };

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

            // 이메일 링크 로그인 체크 실행
            await handleEmailLinkSignIn();

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

    const updateUser = useCallback((newData) => {
        if (!user) return;

        const updatedUser = {
            ...user,
            ...newData
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
        updateUser,
        selectRoom,
        loginAdmin,
        logoutAdmin,
        logout,
        isMyRoom
    };
}
