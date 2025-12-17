/**
 * 로딩 스피너 컴포넌트
 */
export default function LoadingSpinner({
    size = 'md',
    text = '로딩 중...',
    fullScreen = false,
    className = ''
}) {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-10 h-10 border-3',
        lg: 'w-16 h-16 border-4'
    };

    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <div
                className={`
                    ${sizeClasses[size] || sizeClasses.md}
                    border-blue-500 border-t-transparent 
                    rounded-full animate-spin
                `}
            />
            {text && <p className="text-gray-400 text-sm">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    return spinner;
}
