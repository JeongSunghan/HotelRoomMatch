import { useEffect, useState } from 'react';
import { subscribeToSettings, setAgeLimit } from '../../firebase/index';

/**
 * 나이 제한 설정 (관리자용)
 * - settings.ageMin / settings.ageMax 를 RTDB에 저장
 * - null이면 제한 없음
 */
export default function AgeLimitSettings() {
    const [settings, setSettings] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToSettings((data) => {
            setSettings(data);
            setMinAge(Number.isFinite(Number(data.ageMin)) ? String(data.ageMin) : '');
            setMaxAge(Number.isFinite(Number(data.ageMax)) ? String(data.ageMax) : '');
        });
        return () => unsubscribe();
    }, []);

    const display = () => {
        const aMin = settings?.ageMin ?? null;
        const aMax = settings?.ageMax ?? null;
        if (aMin === null && aMax === null) return '제한 없음';
        if (aMin !== null && aMax === null) return `${aMin}세 이상`;
        if (aMin === null && aMax !== null) return `${aMax}세 이하`;
        return `${aMin}~${aMax}세`;
    };

    const handleSave = async () => {
        const parsedMin = minAge.trim() === '' ? null : Number(minAge);
        const parsedMax = maxAge.trim() === '' ? null : Number(maxAge);

        setIsSaving(true);
        try {
            await setAgeLimit(parsedMin, parsedMax);
            setIsEditing(false);
        } catch (e) {
            alert('저장 실패: ' + (e?.message || String(e)));
        } finally {
            setIsSaving(false);
        }
    };

    if (!settings) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">🎯 나이 제한 설정</h3>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                    {display()}
                </span>
            </div>

            {!isEditing ? (
                <div>
                    <p className="text-sm text-gray-600">
                        추가 정보 입력(주민번호 기반 나이 계산) 단계에서 나이가 범위를 벗어나면 등록이 차단됩니다.
                    </p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        설정 변경
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">최소 나이</label>
                            <input
                                type="number"
                                min="1"
                                max="150"
                                value={minAge}
                                onChange={(e) => setMinAge(e.target.value)}
                                placeholder="예: 20 (빈칸=제한없음)"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">최대 나이</label>
                            <input
                                type="number"
                                min="1"
                                max="150"
                                value={maxAge}
                                onChange={(e) => setMaxAge(e.target.value)}
                                placeholder="예: 65 (빈칸=제한없음)"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                            disabled={isSaving}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                            {isSaving ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

