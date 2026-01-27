import { useState, useEffect, useCallback, createContext, useContext } from 'react';

/**
 * Toast 알림 컴포넌트
 */
export function Toast({ message, type = 'info', onClose, duration = 3000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const typeStyles = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500'
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    return (
        <div
            className={`
                ${typeStyles[type] || typeStyles.info}
                text-white px-4 py-3 rounded-lg shadow-lg
                flex items-center gap-3 min-w-[280px] max-w-md
                animate-slide-in-right
            `}
        >
            <span className="text-lg">{icons[type]}</span>
            <p className="flex-1">{message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
            >
                ✕
            </button>
        </div>
    );
}

/**
 * Toast 컨테이너 컴포넌트
 */
export function ToastContainer({ toasts, removeToast }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

// Toast Context
const ToastContext = createContext(null);

/**
 * Toast Provider 컴포넌트
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    // errorHandler(handleFirebaseError)에서 dispatch하는 CustomEvent('show-toast') 브리지
    // 왜: Firebase 모듈/유틸은 React Context를 직접 참조할 수 없어서, 이벤트 기반으로 UI에 전달한다.
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handler = (e) => {
            const detail = e?.detail || {};
            const message = typeof detail.message === 'string' ? detail.message : '';
            if (!message) return;

            const type = (detail.type === 'success' || detail.type === 'error' || detail.type === 'warning' || detail.type === 'info')
                ? detail.type
                : 'info';
            const duration = typeof detail.duration === 'number' ? detail.duration : 3500;

            addToast(message, type, duration);
        };

        window.addEventListener('show-toast', handler);
        return () => window.removeEventListener('show-toast', handler);
    }, [addToast]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        show: (message, type, duration) => addToast(message, type, duration),
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration)
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

/**
 * Toast 훅
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
