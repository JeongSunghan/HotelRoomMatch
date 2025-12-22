/**
 * 방 배정 취소 알림 모달
 * 관리자가 사용자를 방에서 삭제했을 때 표시
 */
export default function CancelledModal({ onRecoverAndReload }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                    방 배정이 취소되었습니다
                </h2>
                <p className="text-gray-600 mb-6">
                    관리자에 의해 방 배정이 취소되었습니다.<br />
                    사이트를 새로고침해주세요.
                </p>
                <button
                    onClick={onRecoverAndReload}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                >
                    🔄 상태 복구 및 새로고침
                </button>
            </div>
        </div>
    );
}
