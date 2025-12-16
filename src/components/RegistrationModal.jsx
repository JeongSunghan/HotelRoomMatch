import { useState } from 'react';
import { validateResidentId, getGenderLabel, getAgeFromResidentId } from '../utils/genderUtils';

export default function RegistrationModal({ onRegister, onClose }) {
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [residentIdFront, setResidentIdFront] = useState('');
    const [residentIdBack, setResidentIdBack] = useState('');
    const [snoring, setSnoring] = useState(null); // null, 'yes', 'no', 'sometimes'
    const [error, setError] = useState('');
    const [detectedGender, setDetectedGender] = useState(null);
    const [detectedAge, setDetectedAge] = useState(null);

    // 주민번호 뒷자리 입력 시 성별/나이 감지
    const handleBackDigitChange = (value) => {
        const digit = value.slice(0, 1);
        setResidentIdBack(digit);

        if (digit && residentIdFront.length === 6) {
            const result = validateResidentId(residentIdFront, digit);
            if (result.valid) {
                setDetectedGender(result.gender);
                setDetectedAge(getAgeFromResidentId(residentIdFront, digit));
                setError('');
            } else {
                setDetectedGender(null);
                setDetectedAge(null);
            }
        } else {
            setDetectedGender(null);
            setDetectedAge(null);
        }
    };

    // 앞자리 입력 시에도 나이 재계산
    const handleFrontChange = (value) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 6);
        setResidentIdFront(cleaned);

        if (cleaned.length === 6 && residentIdBack) {
            const result = validateResidentId(cleaned, residentIdBack);
            if (result.valid) {
                setDetectedGender(result.gender);
                setDetectedAge(getAgeFromResidentId(cleaned, residentIdBack));
            }
        }
    };

    // 등록 처리
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('이름을 입력해주세요.');
            return;
        }

        if (name.trim().length < 2) {
            setError('이름은 2자 이상 입력해주세요.');
            return;
        }

        if (!company.trim()) {
            setError('소속(회사명)을 입력해주세요.');
            return;
        }

        const result = validateResidentId(residentIdFront, residentIdBack);
        if (!result.valid) {
            setError(result.error || '주민번호가 올바르지 않습니다.');
            return;
        }

        if (!snoring) {
            setError('코골이 여부를 선택해주세요.');
            return;
        }

        try {
            onRegister({
                name: name.trim(),
                company: company.trim(),
                residentIdFront,
                residentIdBack,
                age: detectedAge,
                snoring // 'yes', 'no', 'sometimes'
            });
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" onClick={onClose} />

            <div className="relative modal-card rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="text-center mb-5">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">객실 배정 등록</h2>
                    <p className="text-gray-500 text-sm mt-1">정보를 입력해주세요</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 이름 입력 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="홍길동"
                            className="input-field"
                            autoFocus
                        />
                    </div>

                    {/* 소속(회사명) 입력 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">소속 (회사명)</label>
                        <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="회사명을 입력하세요"
                            className="input-field"
                        />
                    </div>

                    {/* 주민번호 입력 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">주민등록번호</label>
                        <div className="flex items-center">
                            {/* 앞자리 6자리 */}
                            <input
                                type="text"
                                value={residentIdFront}
                                onChange={(e) => handleFrontChange(e.target.value)}
                                placeholder="생년월일"
                                maxLength={6}
                                className="input-field flex-1 text-center"
                            />
                            <span className="px-3 text-gray-400 font-bold">-</span>
                            {/* 뒷자리 (첫 번째 숫자 + 마스킹) */}
                            <div className="flex items-center flex-1 input-field px-0 overflow-hidden">
                                <input
                                    type="text"
                                    value={residentIdBack}
                                    onChange={(e) => handleBackDigitChange(e.target.value.replace(/\D/g, ''))}
                                    placeholder="●"
                                    maxLength={1}
                                    className="w-10 text-center bg-transparent border-none focus:outline-none focus:ring-0"
                                />
                                <span className="text-gray-300 tracking-widest pr-3">●●●●●●</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">* 생년월일 6자리 + 뒷자리 첫 번째 숫자만 입력</p>
                    </div>

                    {/* 감지된 성별/나이 표시 */}
                    {detectedGender && (
                        <div className={`
                            flex items-center gap-3 p-4 rounded-lg border-l-4
                            ${detectedGender === 'M' ? 'bg-blue-50 border-blue-500' : 'bg-pink-50 border-pink-500'}
                        `}>
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center text-xl text-white font-bold
                                ${detectedGender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}
                            `}>
                                {detectedGender === 'M' ? '♂' : '♀'}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">
                                    {getGenderLabel(detectedGender)}
                                    {detectedAge && <span className="ml-2 text-gray-500">({detectedAge}세)</span>}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {detectedGender === 'M' ? '남성 전용 객실' : '여성 전용 객실'}을 선택할 수 있습니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 코골이 여부 선택 */}
                    {detectedGender && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                코골이 여부 <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSnoring('no')}
                                    className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${snoring === 'no'
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    😴 없음
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSnoring('sometimes')}
                                    className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${snoring === 'sometimes'
                                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    😪 가끔
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSnoring('yes')}
                                    className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${snoring === 'yes'
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    😤 자주
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">룸메이트 매칭 시 참고됩니다.</p>
                        </div>
                    )}

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* 안내 메시지 */}
                    <div className="warning-box">
                        <p className="text-amber-700 text-sm font-medium mb-1">⚠️ 주의사항</p>
                        <ul className="text-xs text-amber-600 space-y-1">
                            <li>• 등록 후 정보 수정이 <strong>불가능</strong>합니다.</li>
                            <li>• 객실 선택은 <strong>1회만</strong> 가능합니다.</li>
                            <li>• 신중하게 선택해주세요.</li>
                        </ul>
                    </div>

                    {/* 버튼 */}
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
                            disabled={!detectedGender}
                            className="flex-1 px-6 py-3 btn-primary rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            등록하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
