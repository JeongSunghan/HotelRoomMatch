import { useState, useEffect, useRef } from 'react';
import { verifyUser, getUser, markUserAsRegistered } from '../../firebase/index';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { database, ref, update } from '../../firebase/config'; // DB 직접 접근 필요
import { STORAGE_KEYS, SESSION_EXPIRY_MS } from '../../utils/constants';
import emailjs from '@emailjs/browser';

export default function RegistrationModal({ onClose }) {
    const [step, setStep] = useState('input'); // input | verify
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6자리
    const [generatedOtp, setGeneratedOtp] = useState(null); // 서버(클라이언트) 생성 OTP
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(180); // 3분 타이머

    // OTP 입력창 Refs
    const otpRefs = useRef([]);

    // 타이머 로직
    useEffect(() => {
        let timer;
        if (step === 'verify' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft]);

    // OTP 입력 핸들러
    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // 다음 칸 자동 이동
        if (value && index < 5) {
            otpRefs.current[index + 1].focus();
        }
    };

    // OTP 붙여넣기 지원
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        if (pastedData.every(char => !isNaN(char))) {
            const newOtp = [...otp];
            pastedData.forEach((char, index) => {
                if (index < 6) newOtp[index] = char;
            });
            setOtp(newOtp);
            // 마지막으로 이동
            const focusIndex = Math.min(pastedData.length, 5);
            otpRefs.current[focusIndex].focus();
        }
    };

    // OTP 발송 핸들러
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // 1. 사전등록 확인
            const result = await verifyUser(email);
            if (!result.valid) {
                setError(result.message);
                setIsSubmitting(false);
                return;
            }

            // 2. OTP 생성 및 전송
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(code); // 검증용 저장 (실제론 DB나 암호화 권장되나 클라이언트 검증 요청됨)

            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

            if (!serviceId || !templateId || !publicKey) {
                // 키 설정 안됐을 때 (개발용 fallback)
                console.warn('EmailJS keys missing. Dev mode OTP:', code);
                alert(`[Dev Mode] EmailJS 키가 없습니다. \n콘솔이나 이 창을 기억하세요. OTP: ${code}`);
            } else {
                await emailjs.send(serviceId, templateId, {
                    to_email: email,
                    otp_code: code,
                    message: '인증번호를 입력하여 로그인을 완료해주세요.'
                }, publicKey);
            }

            setStep('verify');
            setTimeLeft(180); // 3분 리셋

        } catch (err) {
            console.error(err);
            setError('메일 발송 실패. 이메일 주소를 확인하거나 관리자에게 문의하세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // OTP 검증 및 로그인 핸들러
    const handleVerifyOTP = async () => {
        const inputCode = otp.join('');
        if (inputCode.length !== 6) {
            setError('인증번호 6자리를 모두 입력해주세요.');
            return;
        }

        if (inputCode !== generatedOtp) {
            setError('인증번호가 일치하지 않습니다.');
            return;
        }

        if (timeLeft <= 0) {
            setError('인증 시간이 만료되었습니다. 다시 요청해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Firebase Anonymous Auth (Rules 통과용)
            const auth = getAuth();
            const authResult = await signInAnonymously(auth);

            // 2. PassKey 생성 (Base64 Encoding)
            // format: email:timestamp:random
            const rawKey = `${email}:${Date.now()}:${Math.random().toString(36).substring(2)}`;
            const passKey = btoa(rawKey);
            const expiryDate = Date.now() + SESSION_EXPIRY_MS; // 30일

            // 3. 사용자 정보 구성
            const allowedCheck = await verifyUser(email); // 재확인 및 정보 획득
            const userData = allowedCheck.user;

            let sessionId = userData.registeredSessionId;
            let isNew = !sessionId;

            // 기존 세션이 없다면 생성
            if (!sessionId) {
                // 기존 useUser hook과 맞추기 위해 'session_' prefix 사용 권장하지만
                // 여기선 randomUUID 사용하고 나중에 prefix 붙임
                sessionId = 'session_' + crypto.randomUUID();
            }

            // 4. DB에 PassKey 저장 (자동 로그인용)
            // users/{sessionId} 경로에 저장해야 함.
            const userRef = ref(database, `users/${sessionId}`);
            await update(userRef, {
                email: email,
                passKey: passKey,
                passKeyExpires: expiryDate,
                lastLoginAt: Date.now()
            });

            // 5. 로컬 스토리지 저장 (세션 복구용)
            const sessionUser = {
                sessionId: sessionId,
                name: userData.name,
                email: email,
                company: userData.company,
                passKey: passKey,
                passKeyExpires: expiryDate,
                locked: !!userData.registered, // 기존 등록 여부
                selectedRoom: null, // 이후 로직에서 복구됨
                registeredAt: Date.now()
            };

            // 만약 기존 등록 유저라면 프로필 복구 시도 (클라이언트 측 병합)
            if (userData.registered) {
                const { getUser } = await import('../../firebase/index');
                const existingProfile = await getUser(sessionId);
                if (existingProfile) {
                    Object.assign(sessionUser, existingProfile);
                }
            }

            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sessionUser));

            // 6. DB 등록 마킹 (신규인 경우)
            if (!userData.registered) {
                await markUserAsRegistered(email, sessionId, authResult.user.uid);
            }

            // 7. 완료 -> 리로드 (App.jsx에서 세션 감지)
            window.location.reload();

        } catch (err) {
            console.error(err);
            setError('인증 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" onClick={onClose} />
            <div className="relative modal-card rounded-xl p-6 w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {step === 'input' ? '이메일 인증' : '인증번호 입력'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {step === 'input'
                            ? '사전 등록된 이메일 주소를 입력해주세요.'
                            : `${email} 로 발송된 6자리를 입력해주세요.`}
                    </p>
                </div>

                {/* Step 1: Input Email */}
                {step === 'input' && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
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
                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-3 btn-secondary rounded-lg">취소</button>
                            <button
                                type="submit"
                                disabled={!email || isSubmitting}
                                className="flex-1 py-3 btn-primary rounded-lg disabled:opacity-50"
                            >
                                {isSubmitting ? '전송 중...' : '인증번호 받기'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 2: Verify OTP */}
                {step === 'verify' && (
                    <div className="space-y-6">
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={el => otpRefs.current[idx] = el}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    onPaste={handlePaste}
                                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                />
                            ))}
                        </div>

                        <div className="text-center">
                            <span className="text-red-500 font-medium">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                            <span className="text-gray-400 text-sm ml-2">남음</span>
                        </div>

                        {error && <p className="text-red-500 text-center text-sm">{error}</p>}

                        <button
                            onClick={handleVerifyOTP}
                            className="w-full py-3 btn-primary rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '인증 중...' : '인증 완료'}
                        </button>

                        <div className="text-center">
                            <button onClick={() => setStep('input')} className="text-sm text-gray-500 underline">
                                이메일 재입력 / 다시 받기
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
