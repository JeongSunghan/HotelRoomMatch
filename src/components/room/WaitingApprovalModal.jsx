export default function WaitingApprovalModal({ onCancel }) {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="relative bg-white rounded-xl p-8 w-full max-w-sm text-center shadow-2xl animate-pulse-slow">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <span className="text-3xl animate-bounce">⏳</span>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-2">승인 대기 중...</h2>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    룸메이트가 요청을 확인하고 있습니다.<br />
                    잠시만 기다려주세요.
                </p>

                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 text-sm underline px-4 py-2"
                >
                    요청 취소하기
                </button>
            </div>
        </div>
    );
}
