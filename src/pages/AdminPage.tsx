import { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { useRooms } from '../hooks/useRooms';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminLoginModal from '../components/auth/AdminLoginModal';

/**
 * 관리자 전용 페이지 (/admin)
 * - 일반 유저 페이지(/)와 분리
 * - 관리자 로그인 후에만 기능 사용 가능
 */
export default function AdminPage() {
    const {
        isAdmin,
        loginAdmin,
        logoutAdmin
    } = useUser();

    const {
        roomGuests,
        removeGuestFromRoom,
        addGuestToRoom,
        getStats,
        isFirebaseConnected
    } = useRooms();

    const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
    const [loginLoading, setLoginLoading] = useState<boolean>(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    // 관리자가 아니면 로그인 모달 표시
    useEffect(() => {
        if (!isAdmin) {
            setShowLoginModal(true);
        }
    }, [isAdmin]);

    const handleLogin = async (email: string, password: string): Promise<void> => {
        setLoginLoading(true);
        setLoginError(null);
        try {
            await loginAdmin(email, password);
            setShowLoginModal(false);
        } catch (error: unknown) {
            const firebaseError = error as { code?: string; message?: string };
            if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
                setLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');
            } else if (firebaseError.code === 'auth/invalid-email') {
                setLoginError('올바른 이메일 형식이 아닙니다.');
            } else {
                setLoginError('로그인에 실패했습니다.');
            }
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Firebase 연결 상태 경고 (연결 안됨) */}
            {!isFirebaseConnected && (
                <div className="bg-amber-100 p-2 text-center">
                    <p className="text-amber-700 text-sm font-bold">
                        ⚠️ Firebase 미연결 - 관리 기능 사용 불가
                    </p>
                </div>
            )}

            {/* 메인 콘텐츠 */}
            {isAdmin ? (
                <AdminDashboard
                    roomGuests={roomGuests}
                    onRemoveGuest={removeGuestFromRoom}
                    onAddGuest={addGuestToRoom}
                    onLogout={logoutAdmin}
                    getStats={getStats}
                />
            ) : (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="text-center p-8">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">관리자 전용 페이지</h2>
                        <p className="text-gray-500 mb-6">이 페이지에 접근하려면 관리자 로그인이 필요합니다.</p>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg"
                        >
                            관리자 로그인
                        </button>
                    </div>
                </div>
            )}

            {/* 로그인 모달 */}
            {showLoginModal && !isAdmin && (
                <AdminLoginModal
                    onLogin={handleLogin}
                    onClose={() => setShowLoginModal(false)}
                    isLoading={loginLoading}
                    error={loginError}
                />
            )}
        </div>
    );
}

