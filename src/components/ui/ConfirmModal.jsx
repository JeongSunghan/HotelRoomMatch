import { useState, createContext, useContext, useCallback } from 'react';

const ConfirmContext = createContext(null);

/**
 * 확인 모달 Provider
 * window.confirm() 대신 사용하는 커스텀 확인 모달
 */
export function ConfirmProvider({ children }) {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '확인',
        cancelText: '취소',
        type: 'warning', // 'warning', 'danger', 'info'
        onConfirm: null,
        onCancel: null
    });

    const showConfirm = useCallback(({
        title = '확인',
        message = '',
        confirmText = '확인',
        cancelText = '취소',
        type = 'warning'
    }) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                type,
                onConfirm: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                }
            });
        });
    }, []);

    const confirm = {
        show: showConfirm,
        warning: (message, title = '경고') => showConfirm({ message, title, type: 'warning' }),
        danger: (message, title = '주의') => showConfirm({ message, title, type: 'danger', confirmText: '삭제' }),
        info: (message, title = '확인') => showConfirm({ message, title, type: 'info' })
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {confirmState.isOpen && (
                <ConfirmModal
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmText={confirmState.confirmText}
                    cancelText={confirmState.cancelText}
                    type={confirmState.type}
                    onConfirm={confirmState.onConfirm}
                    onCancel={confirmState.onCancel}
                />
            )}
        </ConfirmContext.Provider>
    );
}

/**
 * 확인 모달 컴포넌트
 */
function ConfirmModal({ title, message, confirmText, cancelText, type, onConfirm, onCancel }) {
    const typeStyles = {
        warning: {
            icon: '⚠️',
            bg: 'bg-amber-100',
            btn: 'bg-amber-500 hover:bg-amber-600'
        },
        danger: {
            icon: '🗑️',
            bg: 'bg-red-100',
            btn: 'bg-red-500 hover:bg-red-600'
        },
        info: {
            icon: 'ℹ️',
            bg: 'bg-blue-100',
            btn: 'bg-blue-500 hover:bg-blue-600'
        }
    };

    const style = typeStyles[type] || typeStyles.warning;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="text-center">
                    <div className={`w-14 h-14 ${style.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <span className="text-2xl">{style.icon}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
                    <p className="text-gray-600 text-sm whitespace-pre-line">{message}</p>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 ${style.btn} text-white rounded-lg font-medium transition-colors`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * useConfirm Hook
 */
export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
