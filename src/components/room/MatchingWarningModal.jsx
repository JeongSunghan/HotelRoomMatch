export default function MatchingWarningModal({ warnings, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" onClick={onCancel} />

            <div className="relative modal-card rounded-xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                {/* 헤더 */}
                <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">매칭 경고</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        룸메이트와의 성향 차이가 발견되었습니다.
                    </p>
                </div>

                {/* 경고 목록 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 space-y-2">
                    {warnings.map((msg, index) => (
                        <div key={index} className="flex items-start gap-2 text-amber-900 font-medium text-sm">
                            <span className="mt-0.5 text-amber-600">•</span>
                            <span>{msg}</span>
                        </div>
                    ))}
                </div>

                {/* 안내 문구 (사용자 요청 강조 사항) */}
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 leading-relaxed text-center font-medium">
                        * 조건이 맞지 않아 <b>상대방(룸메이트)의 승인</b>이 필요합니다.<br />
                        <span className="text-red-500 font-bold block mt-1">
                            * 요청을 전송하면 상대방이 수락/거절을 결정합니다.<br />
                            (거절 시 다시 방을 선택해야 합니다)
                        </span>
                    </p>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 btn-secondary rounded-lg font-medium"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-md transition-colors"
                    >
                        승인 요청 보내기
                    </button>
                </div>
            </div>
        </div>
    );
}
