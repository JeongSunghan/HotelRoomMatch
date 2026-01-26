import { useState, useEffect, useCallback, useRef } from 'react';
import { getGenderFromResidentId } from '../utils/genderUtils';
import { STORAGE_KEYS, SESSION_EXPIRY_MS } from '../utils/constants';
import { sanitizeUserData, isValidSessionId } from '../utils/sanitize';
import { subscribeToAuthState, adminSignIn, adminSignOut, isFirebaseInitialized, checkGuestInRoom } from '../firebase/index';
import debug from '../utils/debug';

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
                            const userData = allowedCheck.user;
                            let sessionUser = null;

                            // 이미 등록된 유저라면 기존 프로필 복구 시도
                            if (allowedCheck.alreadyRegistered && userData.registeredSessionId) {
                                const { getUser } = await import('../firebase/index');
                                const existingProfile = await getUser(userData.registeredSessionId);

                                if (existingProfile) {
                                    console.log('기존 사용자 프로필 복구 완료');
                                    sessionUser = {
                                        ...existingProfile,
                                        sessionId: userData.registeredSessionId
                                    };
                                }
                            }

                            // 신규이거나 복구 실패 시 새로 생성
                            if (!sessionUser) {
                                sessionUser = {
                                    sessionId: userData.registeredSessionId || generateSessionId(),
                                    name: userData.name,
                                    email: userData.email, // 이메일 저장
                                    company: userData.company,
                                    singleRoom: userData.singleRoom || 'N',
                                    // 이미 등록된 상태였는데 복구 실패했다면 일단 locked 풀어줌 (재입력 유도)
                                    locked: false,
                                    selectedRoom: null,
                                    registeredAt: Date.now()
                                };
                            }

                            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
                            setUser(sessionUser);

                            // 인증 완료 표시 (신규일 때만)
                            if (!allowedCheck.alreadyRegistered) {
                                await markUserAsRegistered(email, sessionUser.sessionId, result.user.uid);
                            }

                            // URL 정리 (인증 코드 제거)
                            window.history.replaceState({}, document.title, window.location.pathname);
                        } else {
                            alert(allowedCheck.message || '로그인 불가');
                        }
                    } catch (error) {
                        const { handleError } = await import('../utils/errorHandler');
                        handleError(error, {
                            context: 'emailLinkSignIn',
                            showToast: false
                        });
                        alert('로그인에 실패했습니다. 링크가 만료되었거나 이미 사용되었습니다.');
                    }
                }
            }
        };

        // 저장된 사용자 정보 로드 및 세션 유효성 확인
        const loadAndValidateUser = async () => {
            const savedUser = localStorage.getItem(STORAGE_KEY);
            debug.log('Session Load: savedUser exists?', !!savedUser);
            if (savedUser) {
                try {
                    const parsed = JSON.parse(savedUser);
                    debug.log('Session Load: parsed sessionId:', parsed.sessionId);

                    // 세션 ID 형식 검증 (보안 강화)
                    if (parsed.sessionId && !isValidSessionId(parsed.sessionId)) {
                        debug.log('세션 ID 형식 유효성 검사 실패 -> 로그아웃 처리');
                        localStorage.removeItem(STORAGE_KEY);
                        setUser(null);
                        setIsLoading(false);
                        return;
                    }

                    // 세션 만료 체크 (24시간)
                    if (parsed.registeredAt) {
                        const sessionAge = Date.now() - parsed.registeredAt;
                        if (sessionAge > SESSION_EXPIRY_MS) {
                            debug.log('세션 만료됨 (30일 경과) -> 로그아웃 처리');
                            localStorage.removeItem(STORAGE_KEY);
                            setUser(null);
                            setIsLoading(false);
                            return;
                        }
                    }

                    // Firebase 연결 상태일 때만 유효성 검사 수행
                    if (isFirebaseInitialized() && parsed.sessionId) {
                        // 0. Firebase Auth 복원 (페이지 새로고침 시 인증 상태 유지)
                        const { getAuth, signInAnonymously } = await import('firebase/auth');
                        const auth = getAuth();
                        if (!auth.currentUser) {
                            try {
                                await signInAnonymously(auth);
                                debug.log('Firebase Auth 익명 인증 복원 완료');
                            } catch (authError) {
                                const { handleError } = await import('../utils/errorHandler');
                                handleError(authError, {
                                    context: 'firebaseAuthRestore',
                                    showToast: false
                                });
                            }
                        }

                        // 1. 방에 유저가 존재하는지 확인 (users 조회)
                        const { getUser } = await import('../firebase/index');
                        const dbUser = await getUser(parsed.sessionId);

                        if (!dbUser) {
                            debug.log('세션 유효성 검사 실패: 유저 없음 -> 로그아웃 처리');
                            localStorage.removeItem(STORAGE_KEY);
                            setUser(null);
                            setIsLoading(false);
                            return;
                        }

                        // 2. PassKey 검증 (보안 강화)
                        if (parsed.passKey) {
                            if (dbUser.passKey !== parsed.passKey) {
                                debug.log('PassKey 불일치 -> 로그아웃 처리');
                                localStorage.removeItem(STORAGE_KEY);
                                setUser(null);
                                setIsLoading(false);
                                return;
                            }

                            // PassKey 만료 체크 (30일)
                            if (parsed.passKeyExpires && Date.now() > parsed.passKeyExpires) {
                                debug.log('PassKey 만료됨 -> 로그아웃 처리');
                                localStorage.removeItem(STORAGE_KEY);
                                setUser(null);
                                setIsLoading(false);
                                return;
                            }

                            // 3. 최신 데이터 동기화 (DB -> Local)
                            if (dbUser) {
                                Object.assign(parsed, dbUser);
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                            }
                        } else {
                            // 구버전 세션 호환성을 위해 PassKey 없어도 방에 있으면 일단 인정?
                            // -> 아니요, 보안 정책 변경으로 재인증 유도 권장. 
                            // -> 일단 유지하되, 추후 강제 로그아웃 고려.
                            // 여기선 'checkGuestInRoom' 로직을 user 조회로 대체했으므로 OK.
                            // 3. 최신 데이터 동기화 (DB -> Local)
                            // 배정 취소 등으로 DB 상태가 변경되었을 수 있으므로 동기화 필수
                            if (dbUser) {
                                Object.assign(parsed, dbUser);
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                            }
                        }
                    }

                    setUser(parsed);
                } catch (e) {
                    const { handleError } = await import('../utils/errorHandler');
                    handleError(e, {
                        context: 'sessionRestore',
                        showToast: false
                    });
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

    // 관리자 변경사항 실시간 동기화
    useEffect(() => {
        if (!user?.sessionId) return;

        const setupRealtimeSync = async () => {
            const { subscribeToUserSession } = await import('../firebase/index');

            const unsubscribe = subscribeToUserSession(user.sessionId, (dbUser) => {
                if (!dbUser) {
                    // 유저가 삭제됨 (관리자에 의해)
                    debug.log('유저 데이터가 삭제됨 - 로그아웃 처리');
                    localStorage.removeItem(STORAGE_KEY);
                    setUser(null);
                    return;
                }

                // 로컬 상태와 DB 상태 비교하여 변경사항 있으면 동기화
                const hasChanges =
                    dbUser.name !== user.name ||
                    dbUser.gender !== user.gender ||
                    dbUser.age !== user.age ||
                    dbUser.snoring !== user.snoring ||
                    dbUser.company !== user.company ||
                    dbUser.selectedRoom !== user.selectedRoom ||
                    dbUser.locked !== user.locked;

                if (hasChanges) {
                    debug.log('관리자 변경사항 감지 - 동기화');
                    const updatedUser = { ...user, ...dbUser };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
                    setUser(updatedUser);
                }
            });

            return unsubscribe;
        };

        let unsubscribe = null;
        setupRealtimeSync().then(unsub => {
            unsubscribe = unsub;
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.sessionId]);

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
            singleRoom: userData.singleRoom || 'N', // 1인실 권한 추가
            // residentIdFront는 보안상 저장하지 않음
            registeredAt: Date.now(),
            selectedRoom: null,
            locked: false
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);

        return newUser;
    }, []);

    const selectRoom = useCallback(async (roomNumber) => {
        if (!user) return;

        // Async import check
        const { updateUser: dbUpdateUser } = await import('../firebase/index');

        const updatedUser = {
            ...user,
            selectedRoom: roomNumber,
            selectedAt: Date.now(),
            locked: true
        };

        // DB 동기화 먼저 (Race condition 방지)
        if (user.sessionId) {
            await dbUpdateUser(user.sessionId, {
                selectedRoom: roomNumber,
                selectedAt: Date.now(),
                locked: true
            });
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);

        return updatedUser;
    }, [user]);

    const updateUser = useCallback(async (newData) => {
        if (!user) return;

        // Async import check
        const { updateUser: dbUpdateUser } = await import('../firebase/index');

        const updatedUser = {
            ...user,
            ...newData
        };

        // DB 동기화 먼저 (Race condition 방지)
        if (user.sessionId) {
            await dbUpdateUser(user.sessionId, newData);
        }

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
