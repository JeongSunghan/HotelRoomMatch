/**
 * 로딩 스피너 컴포넌트
 */
interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export default function LoadingSpinner({
    size = 'md',
    text = '로딩 중...',
    fullScreen = false,
    className = ''
}: LoadingSpinnerProps) {
    const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
        sm: 'w-6 h-6 border-2',
        md: 'w-10 h-10 border-3',
        lg: 'w-16 h-16 border-4'
    };

    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-2 sm:gap-3 ${className}`} role="status" aria-live="polite" aria-label={text}>
            <div
                className={`
                    ${sizeClasses[size] || sizeClasses.md}
                    border-blue-500 border-t-transparent 
                    rounded-full animate-spin
                `}
                aria-hidden="true"
            />
            {text && <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="로딩 중">
                {spinner}
            </div>
        );
    }

    return spinner;
}


