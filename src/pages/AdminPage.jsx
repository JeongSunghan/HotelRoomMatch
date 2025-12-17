import { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { useRooms } from '../hooks/useRooms';
import AdminPanel from '../components/admin/AdminPanel';
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
        getStats,
        isFirebaseConnected
    } = useRooms();

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState(null);

    // 관리자가 아니면 로그인 모달 표시
    useEffect(() => {
        if (!isAdmin) {
            setShowLoginModal(true);
        }
    }, [isAdmin]);

    const handleLogin = async (email, password) => {
        setLoginLoading(true);
        setLoginError(null);
        try {
            await loginAdmin(email, password);
            setShowLoginModal(false);
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                setLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');
            } else if (error.code === 'auth/invalid-email') {
                setLoginError('올바른 이메일 형식이 아닙니다.');
            } else {
                setLoginError('로그인에 실패했습니다.');
            }
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* 헤더 */}
            <header className="header-navy py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">🔑 V-Up 관리자</h1>
                        <p className="text-blue-200 text-sm">객실 배정 관리 시스템</p>
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-4">
                            <span className="text-green-300 text-sm">✓ 로그인됨</span>
                            <button
                                onClick={logoutAdmin}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                            >
                                로그아웃
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Firebase 연결 상태 */}
            {!isFirebaseConnected && (
                <div className="max-w-7xl mx-auto px-6 pt-4">
                    <div className="warning-box text-center">
                        <p className="text-amber-700 text-sm">
                            ⚠️ Firebase 미연결 - 관리 기능 사용 불가
                        </p>
                    </div>
                </div>
            )}

            {/* 메인 콘텐츠 */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {isAdmin ? (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <AdminPanel
                            roomGuests={roomGuests}
                            onRemoveGuest={removeGuestFromRoom}
                            onClose={() => window.location.href = '/'}
                            getStats={getStats}
                        />
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">관리자 전용 페이지</h2>
                        <p className="text-gray-500 mb-6">이 페이지에 접근하려면 관리자 로그인이 필요합니다.</p>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            관리자 로그인
                        </button>
                    </div>
                )}
            </main>

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
