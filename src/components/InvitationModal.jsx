/**
 * 룸메이트 초대 수락/거절 모달
 */
export default function InvitationModal({
    invitation,
    onAccept,
    onReject,
    isLoading
}) {
    if (!invitation) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 modal-overlay" />

            <div className="relative modal-card rounded-xl p-6 w-full max-w-md text-center">
                {/* 아이콘 */}
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">👥</span>
                </div>

                {/* 제목 */}
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    룸메이트 초대
                </h2>

                {/* 초대 정보 */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <p className="text-purple-800 font-medium text-lg mb-1">
                        {invitation.roomNumber}호
                    </p>
                    <p className="text-purple-700">
                        <strong>{invitation.inviterName}</strong>
                        {invitation.inviterCompany && (
                            <span className="text-purple-500"> ({invitation.inviterCompany})</span>
                        )}
                        님이
                    </p>
                    <p className="text-purple-700">
                        룸메이트로 지정했습니다.
                    </p>
                </div>

                {/* 질문 */}
                <p className="text-gray-600 mb-6">
                    수락하시겠습니까?
                </p>

                {/* 버튼 */}
                <div className="flex gap-3">
                    <button
                        onClick={onReject}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 btn-secondary rounded-lg font-medium disabled:opacity-50"
                    >
                        거절
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {isLoading ? '처리 중...' : '수락'}
                    </button>
                </div>

                {/* 안내 */}
                <p className="text-xs text-gray-400 mt-4">
                    거절하시면 다른 객실을 선택할 수 있습니다.
                </p>
            </div>
        </div>
    );
}
