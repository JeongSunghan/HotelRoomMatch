/**
 * 생년월일 입력 모달
 * 로그인 후 생년월일이 등록되지 않은 사용자가 입력하는 모달
 */

import { useState, ChangeEvent, FormEvent } from 'react';

interface BirthDateModalProps {
    userName: string;
    onSubmit: (birthDate: string, age: number) => Promise<void>;
    onCancel?: () => void;
}

/**
 * 생년월일로부터 나이 계산
 */
function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // 생일이 아직 지나지 않았으면 나이 -1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

/**
 * 생년월일 입력 모달
 */
export default function BirthDateModal({ userName, onSubmit, onCancel }: BirthDateModalProps) {
    const [birthDate, setBirthDate] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // 생년월일 입력 처리
    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');

        // 유효성 검증
        if (!birthDate) {
            setError('생년월일을 입력해주세요.');
            return;
        }

        const birth = new Date(birthDate);
        const today = new Date();

        // 미래 날짜 체크
        if (birth > today) {
            setError('미래 날짜는 입력할 수 없습니다.');
            return;
        }

        // 나이 범위 체크 (10세 ~ 120세)
        const age = calculateAge(birthDate);
        if (age < 10) {
            setError('10세 이상만 등록 가능합니다.');
            return;
        }
        if (age > 120) {
            setError('올바른 생년월일을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit(birthDate, age);
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || '생년월일 등록 중 오류가 발생했습니다.');
            setIsSubmitting(false);
        }
    };

    // 최대 날짜 (오늘)
    const maxDate = new Date().toISOString().split('T')[0];
    // 최소 날짜 (120년 전)
    const minDate = new Date(new Date().getFullYear() - 120, 0, 1).toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="absolute inset-0" onClick={onCancel} />
            <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                {/* 헤더 */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        생년월일 입력
                    </h2>
                    <p className="text-gray-600 text-sm">
                        안녕하세요, <span className="font-semibold text-blue-600">{userName}</span>님!
                        <br />
                        방 배정을 위해 생년월일을 입력해주세요.
                    </p>
                </div>

                {/* 입력 폼 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            생년월일
                        </label>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setBirthDate(e.target.value)}
                            min={minDate}
                            max={maxDate}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg"
                            autoFocus
                            required
                        />
                        {birthDate && (
                            <p className="text-sm text-gray-500 mt-2">
                                만 {calculateAge(birthDate)}세
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex gap-3 pt-2">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                disabled={isSubmitting}
                            >
                                나중에
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={!birthDate || isSubmitting}
                            className={`
                                ${onCancel ? 'flex-1' : 'w-full'}
                                py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 
                                disabled:cursor-not-allowed text-white rounded-lg font-medium 
                                transition-colors
                            `}
                        >
                            {isSubmitting ? '등록 중...' : '확인'}
                        </button>
                    </div>
                </form>

                {/* 안내 문구 */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        생년월일은 방 배정을 위해서만 사용되며,
                        <br />
                        등록 후 수정할 수 없습니다.
                    </p>
                </div>
            </div>
        </div>
    );
}

