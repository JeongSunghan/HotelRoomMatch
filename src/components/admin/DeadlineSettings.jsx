import { useState, useEffect } from 'react';
import { subscribeToSettings, setDeadline } from '../../firebase/index';

/**
 * 마감 시간 설정 컴포넌트 (대시보드에 표시)
 */
export default function DeadlineSettings() {
    const [settings, setSettings] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [deadlineTime, setDeadlineTime] = useState('');
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToSettings((data) => {
            setSettings(data);
            setEnabled(data.deadlineEnabled || false);
            setDeadlineTime(data.deadlineTime ? formatDateTimeLocal(data.deadlineTime) : '');
            setMessage(data.deadlineMessage || '');
        });
        return () => unsubscribe();
    }, []);

    // ISO 문자열을 datetime-local 형식으로 변환
    const formatDateTimeLocal = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
    };

    // datetime-local을 ISO 문자열로 변환
    const formatToISO = (localDateTime) => {
        if (!localDateTime) return null;
        return new Date(localDateTime).toISOString();
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await setDeadline(enabled, enabled ? formatToISO(deadlineTime) : null, message);
            setIsEditing(false);
        } catch (error) {
            alert('저장 실패: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getDeadlineStatus = () => {
        if (!settings?.deadlineEnabled || !settings?.deadlineTime) {
            return { status: 'off', label: '비활성화', color: 'bg-gray-100 text-gray-600' };
        }

        const deadline = new Date(settings.deadlineTime);
        const now = new Date();

        if (now > deadline) {
            return { status: 'passed', label: '마감됨', color: 'bg-red-100 text-red-700' };
        }

        const remaining = deadline.getTime() - now.getTime();
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        return {
            status: 'active',
            label: hours > 0 ? `${hours}시간 ${minutes}분 남음` : `${minutes}분 남음`,
            color: 'bg-green-100 text-green-700'
        };
    };

    const formatDeadlineDisplay = () => {
        if (!settings?.deadlineTime) return '-';
        return new Date(settings.deadlineTime).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!settings) return null;

    const deadlineStatus = getDeadlineStatus();

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">⏰ 배정 마감 설정</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${deadlineStatus.color}`}>
                    {deadlineStatus.label}
                </span>
            </div>

            {!isEditing ? (
                <div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">상태</span>
                            <span className="font-medium">{settings.deadlineEnabled ? '활성화' : '비활성화'}</span>
                        </div>
                        {settings.deadlineEnabled && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">마감 시간</span>
                                    <span className="font-medium">{formatDeadlineDisplay()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">마감 메시지</span>
                                    <span className="font-medium text-right max-w-[200px] truncate">{settings.deadlineMessage}</span>
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        설정 변경
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-sm font-medium text-gray-700">
                            마감 기능 활성화
                        </span>
                    </div>

                    {enabled && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">마감 시간</label>
                                <input
                                    type="datetime-local"
                                    value={deadlineTime}
                                    onChange={(e) => setDeadlineTime(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">마감 시 메시지</label>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="마감 시 사용자에게 표시할 메시지"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </>
                    )}

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
