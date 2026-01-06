interface CancelledModalProps {
    onRecoverAndReload: () => void;
}

/**
 * 방 배정 취소 알림 모달
 * 관리자가 사용자를 방에서 삭제했을 때 표시
 */
export default function CancelledModal({ onRecoverAndReload }: CancelledModalProps) {
    // ESC 키로 닫기 (접근성)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Escape') {
            onRecoverAndReload();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelled-modal-title"
            aria-describedby="cancelled-modal-description"
            onKeyDown={handleKeyDown}
        >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full text-center shadow-2xl">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl sm:text-3xl" aria-hidden="true">⚠️</span>
                </div>
                <h2 id="cancelled-modal-title" className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                    방 배정이 취소되었습니다
                </h2>
                <p id="cancelled-modal-description" className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
                    관리자에 의해 방 배정이 취소되었습니다.<br />
                    사이트를 새로고침해주세요.
                </p>
                <button
                    onClick={onRecoverAndReload}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[44px]"
                    aria-label="상태 복구 및 새로고침"
                >
                    🔄 상태 복구 및 새로고침
                </button>
            </div>
        </div>
    );
}


