import { useState } from 'react';
import { validateResidentId, getGenderLabel, getAgeFromResidentId } from '../../utils/genderUtils';

export default function AdditionalInfoModal({ user, onUpdate, onClose }) {
    const [residentIdFront, setResidentIdFront] = useState('');
    const [residentIdBack, setResidentIdBack] = useState('');
    const [snoring, setSnoring] = useState(null);
    const [ageTolerance, setAgeTolerance] = useState(5);
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

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const result = validateResidentId(residentIdFront, residentIdBack);
        if (!result.valid) {
            setError(result.error || '주민번호가 올바르지 않습니다.');
            return;
        }

        if (!snoring) {
            setError('코골이 여부를 선택해주세요.');
            return;
        }

        onUpdate({
            ...user,
            gender: detectedGender,
            age: detectedAge,
            snoring,
            ageTolerance
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" /> {/* 백드롭 클릭 막음 */}

            <div className="relative modal-card rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-5">
                    <h2 className="text-xl font-bold text-gray-800">추가 정보 입력</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        객실 배정을 위해 필요한 정보입니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 사용자 정보 확인 */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-blue-800">
                            <strong>{user.name}</strong> ({user.company || '소속 없음'})
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            로그인이 완료되었습니다.
                        </p>
                    </div>

                    {/* 주민번호 입력 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">주민등록번호</label>
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={residentIdFront}
                                onChange={(e) => handleFrontChange(e.target.value)}
                                placeholder="생년월일"
                                maxLength={6}
                                className="input-field flex-1 text-center"
                                autoFocus
                            />
                            <span className="px-3 text-gray-400 font-bold">-</span>
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
                        <p className="text-xs text-gray-400 mt-2">* 정보는 성별/나이 확인용으로만 사용되며 저장되지 않습니다.</p>
                    </div>

                    {/* 감지된 성별 표시 */}
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
                            </div>
                        </div>
                    )}

                    {/* 코골이 여부 */}
                    {detectedGender && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                코골이 여부 <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => setSnoring('no')} className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${snoring === 'no' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}>😴 없음</button>
                                <button type="button" onClick={() => setSnoring('sometimes')} className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${snoring === 'sometimes' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 hover:border-gray-300'}`}>😪 가끔</button>
                                <button type="button" onClick={() => setSnoring('yes')} className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${snoring === 'yes' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}>😤 자주</button>
                            </div>
                        </div>
                    )}

                    {/* 나이차 허용 */}
                    {detectedGender && snoring && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">룸메이트 나이차 허용 범위</label>
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">내 나이 {detectedAge}세 기준</span>
                                    <span className="text-lg font-bold text-blue-600">±{ageTolerance}세</span>
                                </div>
                                <input type="range" min="0" max="10" value={ageTolerance} onChange={(e) => setAgeTolerance(parseInt(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>동갑만</span><span>±5세</span><span>±10세</span></div>
                            </div>
                        </div>
                    )}

                    {error && <div className="p-4 bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-lg"><p className="text-red-700 text-sm">{error}</p></div>}

                    <button type="submit" disabled={!detectedGender} className="w-full py-4 btn-primary rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 mt-4">확인 및 입장</button>
                </form>
            </div>
        </div>
    );
}
