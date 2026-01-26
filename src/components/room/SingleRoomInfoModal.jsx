/**
 * 1인실 안내 모달
 * 1인실은 별도 신청 후 관리자가 직접 추가함을 안내
 */
export default function SingleRoomInfoModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/50"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🏨</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                    1인실 안내
                </h2>
                <p className="text-gray-600 mb-6">
                    1인실은 <strong>사전 신청자(allowedUsers의 1인실 여부=Y)</strong>만 선택할 수 있습니다.
                </p>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors"
                >
                    확인
                </button>
            </div>
        </div>
    );
}
