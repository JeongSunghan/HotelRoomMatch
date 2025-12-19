import { useState } from 'react';
import { verifyUser } from '../../firebase/index';
// firebase auth 함수는 SDK에서 직접 가져옴
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';

export default function RegistrationModal({ onClose }) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState('');

    const handleSendLink = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // 1. 사전등록 명단 확인
            const result = await verifyUser(email);
            if (!result.valid) {
                setError(result.message);
                setIsSubmitting(false);
                return;
            }

            // 2. 인증 메일 발송 설정
            const actionCodeSettings = {
                // 인증 후 돌아올 URL (현재 페이지)
                // 로컬 테스트 시: http://localhost:5173
                // 배포 시: Firebase Hosting URL
                url: window.location.href,
                handleCodeInApp: true,
            };

            const auth = getAuth();
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);

            // 3. 이메일 저장 (링크 복귀 시 확인용)
            window.localStorage.setItem('emailForSignIn', email);

            setEmailSent(true);
        } catch (err) {
            console.error(err);
            setError('인증 메일 발송에 실패했습니다. 이메일 주소를 확인해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" onClick={onClose} />

            <div className="relative modal-card rounded-xl p-6 w-full max-w-md">
                {/* 헤더 */}
                <div className="text-center mb-5">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {emailSent ? '인증 메일 발송 완료!' : '이메일 인증'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {emailSent ? '메일함을 확인해주세요' : '사전 등록된 이메일을 입력해주세요'}
                    </p>
                </div>

                {!emailSent ? (
                    <form onSubmit={handleSendLink} className="space-y-4">
                        <div className="info-box mb-4">
                            <p className="text-blue-700 text-sm">
                                🔒 보안을 위해 이메일 링크 인증을 사용합니다.
                                <br />
                                비밀번호 없이 안전하게 로그인하세요.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">이메일 주소</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="input-field"
                                autoFocus
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-lg">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 btn-secondary rounded-lg font-medium"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={!email.trim() || isSubmitting}
                                className="flex-1 px-6 py-3 btn-primary rounded-lg font-medium disabled:opacity-50"
                            >
                                {isSubmitting ? '전송 중...' : '인증 메일 받기'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 text-center">
                            <p className="text-emerald-800 font-medium text-lg mb-2">📩 메일을 보냈습니다</p>
                            <p className="text-emerald-600 text-sm">
                                <strong>{email}</strong> 주소로<br />
                                로그인 링크가 포함된 메일을 발송했습니다.
                            </p>
                        </div>

                        <div className="text-center text-sm text-gray-500 space-y-2">
                            <p>1. 메일함을 열어주세요.</p>
                            <p>2. <strong>"UTC에서 요청한 vuphotelroom에 로그인"</strong> 메일을 찾아주세요.</p>
                            <p>3. 메일 내용을 확인하고 링크를 클릭하면<br />자동으로 로그인이 완료됩니다.</p>
                        </div>

                        <p className="text-xs text-center text-gray-400">
                            * 메일이 오지 않았다면 스팸함을 확인해보세요.
                        </p>

                        <button
                            onClick={onClose}
                            className="w-full py-3 btn-secondary rounded-lg font-medium"
                        >
                            닫기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
