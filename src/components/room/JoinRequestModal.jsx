export default function JoinRequestModal({ request, onAccept, onReject }) {
    if (!request) return null;

    const { fromUserName, warnings } = request;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

            <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl">👋</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">새로운 룸메이트 요청</h2>
                    <p className="text-gray-500 mt-1">
                        <span className="font-bold text-blue-600">{fromUserName}</span>님이 입실을 희망합니다.
                    </p>
                </div>

                {/* 경고 내역 (조건 불일치 사항) */}
                {warnings && warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
                        <p className="text-xs font-bold text-amber-700 mb-2">⚠️ 확인이 필요한 사항</p>
                        <div className="space-y-1">
                            {warnings.map((msg, index) => (
                                <div key={index} className="flex items-start gap-2 text-amber-900 text-sm">
                                    <span className="mt-0.5">•</span>
                                    <span>{msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onReject}
                        className="flex-1 py-3 btn-secondary rounded-lg font-medium text-red-600 hover:bg-red-50"
                    >
                        거절하기
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 py-3 btn-primary rounded-lg font-bold"
                    >
                        수락하기
                    </button>
                </div>
            </div>
        </div>
    );
}
