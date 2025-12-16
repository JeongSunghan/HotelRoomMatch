import { useState } from 'react';
import { roomData } from '../data/roomData';
import { getGenderLabel } from '../utils/genderUtils';

export default function MyRoomModal({
    user,
    roomGuests,
    onRequestChange,
    onClose
}) {
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestType, setRequestType] = useState('change'); // 'change' or 'cancel'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [requestReason, setRequestReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!user?.selectedRoom) return null;

    const room = roomData[user.selectedRoom];
    const guests = roomGuests[user.selectedRoom] || [];
    const roommate = guests.find(g => g.sessionId !== user.sessionId);

    const handleSubmitRequest = async () => {
        if (!phoneNumber.trim()) {
            alert('연락처를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onRequestChange({
                type: requestType,
                userName: user.name,
                userCompany: user.company,
                currentRoom: user.selectedRoom,
                phoneNumber: phoneNumber.trim(),
                reason: requestReason.trim(),
                sessionId: user.sessionId
            });
            const message = requestType === 'cancel'
                ? '배정 취소 요청이 전송되었습니다. 담당자가 연락드릴 예정입니다.'
                : '방 수정 요청이 전송되었습니다. 담당자가 연락드릴 예정입니다.';
            alert(message);
            onClose();
        } catch (error) {
            alert('요청 전송에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" onClick={onClose} />

            <div className="relative modal-card rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-800">내 객실 정보</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                        ✕
                    </button>
                </div>

                {/* 방 정보 카드 */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl font-bold gradient-text">{user.selectedRoom}호</span>
                        <span className={`
                            px-3 py-1 rounded-full text-sm font-medium
                            ${room?.capacity === 2 ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}
                        `}>
                            {room?.capacity === 2 ? '2인실' : '1인실'}
                        </span>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">층</span>
                            <span className="text-gray-800 font-medium">{room?.floor}층</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">객실 타입</span>
                            <span className="text-gray-800 font-medium">{room?.roomType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">구역</span>
                            <span className={`font-medium ${room?.gender === 'M' ? 'text-blue-600' : 'text-pink-600'}`}>
                                {getGenderLabel(room?.gender)} 전용
                            </span>
                        </div>
                    </div>
                </div>

                {/* 투숙객 정보 */}
                <div className="mb-5">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">투숙객</h3>
                    <div className="space-y-2">
                        {/* 본인 */}
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm">
                                ✓
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">
                                    {user.name}
                                    {user.company && <span className="text-gray-500 text-sm ml-1">({user.company})</span>}
                                </p>
                                <p className="text-xs text-emerald-600">본인</p>
                            </div>
                        </div>

                        {/* 룸메이트 */}
                        {roommate ? (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                                    👤
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">
                                        {roommate.name}
                                        {roommate.company && <span className="text-gray-500 text-sm ml-1">({roommate.company})</span>}
                                    </p>
                                    <p className="text-xs text-blue-600">룸메이트</p>
                                </div>
                            </div>
                        ) : room?.capacity === 2 && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm">
                                    ?
                                </div>
                                <p className="text-gray-500 text-sm">룸메이트 대기 중...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 방 수정/취소 요청 */}
                {!showRequestForm ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setRequestType('change'); setShowRequestForm(true); }}
                            className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            🔄 방 변경
                        </button>
                        <button
                            onClick={() => { setRequestType('cancel'); setShowRequestForm(true); }}
                            className="flex-1 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                        >
                            ❌ 배정 취소
                        </button>
                    </div>
                ) : (
                    <div className={`border rounded-lg p-4 ${requestType === 'cancel' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                        <h4 className={`font-medium mb-3 ${requestType === 'cancel' ? 'text-red-800' : 'text-amber-800'}`}>
                            {requestType === 'cancel' ? '배정 취소 요청' : '방 변경 요청'}
                        </h4>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-amber-700 mb-1">
                                    연락처 (필수) *
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="010-1234-5678 또는 회사 유선번호"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-amber-700 mb-1">
                                    수정 사유 (선택)
                                </label>
                                <textarea
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    placeholder="수정이 필요한 이유를 간략히 작성해주세요"
                                    className="input-field min-h-[80px] resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => setShowRequestForm(false)}
                                className="flex-1 py-2 btn-secondary rounded-lg text-sm"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmitRequest}
                                disabled={isSubmitting || !phoneNumber.trim()}
                                className={`flex-1 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${requestType === 'cancel'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-amber-500 hover:bg-amber-600'
                                    }`}
                            >
                                {isSubmitting ? '전송 중...' : (requestType === 'cancel' ? '취소 요청' : '변경 요청')}
                            </button>
                        </div>

                        <p className={`text-xs mt-3 ${requestType === 'cancel' ? 'text-red-600' : 'text-amber-600'}`}>
                            * 담당자가 확인 후 연락드릴 예정입니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
