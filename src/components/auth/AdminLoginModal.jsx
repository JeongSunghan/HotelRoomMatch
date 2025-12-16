import { useState } from 'react';

export default function AdminLoginModal({ onLogin, onClose, isLoading, error }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email.trim() && password) {
            onLogin(email.trim(), password);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" onClick={onClose} />

            <div className="relative modal-card rounded-xl p-6 w-full max-w-sm">
                <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔐</span>
                </div>

                <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
                    관리자 로그인
                </h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            이메일
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            className="input-field"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="input-field"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 btn-secondary rounded-lg font-medium"
                            disabled={isLoading}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 btn-primary rounded-lg font-medium disabled:opacity-50"
                            disabled={isLoading || !email || !password}
                        >
                            {isLoading ? '로그인 중...' : '로그인'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
