/**
 * 에러 표시 컴포넌트
 * 사용자 친화적인 에러 메시지와 복구 가이드를 표시합니다.
 */
import type { ErrorMessage } from '../../utils/errorMessages';

interface ErrorDisplayProps {
    /** 에러 메시지 객체 */
    error: ErrorMessage;
    /** 추가 클래스명 */
    className?: string;
    /** 닫기 버튼 표시 여부 */
    showClose?: boolean;
    /** 닫기 핸들러 */
    onClose?: () => void;
    /** 인라인 스타일 (작은 에러 메시지) */
    inline?: boolean;
}

export default function ErrorDisplay({
    error,
    className = '',
    showClose = false,
    onClose,
    inline = false
}: ErrorDisplayProps) {
    const { message, recovery, type = 'error' } = error;

    // 타입별 스타일
    const typeStyles = {
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
    };

    const iconStyles = {
        error: '🔴',
        warning: '⚠️',
        info: 'ℹ️'
    };

    if (inline) {
        return (
            <div className={`flex items-start gap-2 text-sm ${typeStyles[type]} rounded-lg p-2 ${className}`} role="alert">
                <span className="text-base" aria-hidden="true">{iconStyles[type]}</span>
                <div className="flex-1">
                    <p className="font-medium">{message}</p>
                    {recovery && (
                        <p className="text-xs mt-1 opacity-80">{recovery}</p>
                    )}
                </div>
                {showClose && onClose && (
                    <button
                        onClick={onClose}
                        className="text-current opacity-60 hover:opacity-100 transition-opacity"
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            className={`
                border rounded-xl p-4 sm:p-6
                ${typeStyles[type]}
                ${className}
            `}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <div className="text-2xl sm:text-3xl flex-shrink-0" aria-hidden="true">
                    {iconStyles[type]}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{message}</h3>
                    {recovery && (
                        <div className="mt-3 pt-3 border-t border-current/20">
                            <p className="text-sm opacity-90 leading-relaxed">{recovery}</p>
                        </div>
                    )}
                </div>
                {showClose && onClose && (
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded p-1"
                        aria-label="닫기"
                    >
                        <span className="text-xl">✕</span>
                    </button>
                )}
            </div>
        </div>
    );
}

