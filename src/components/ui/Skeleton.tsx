/**
 * 스켈레톤 로딩 컴포넌트
 * 로딩 중인 콘텐츠의 플레이스홀더를 제공합니다.
 */
interface SkeletonProps {
    /** 스켈레톤 타입 */
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    /** 너비 (CSS 값) */
    width?: string | number;
    /** 높이 (CSS 값) */
    height?: string | number;
    /** 추가 CSS 클래스 */
    className?: string;
    /** 애니메이션 효과 */
    animation?: 'pulse' | 'wave' | 'none';
}

export default function Skeleton({
    variant = 'rectangular',
    width,
    height,
    className = '',
    animation = 'pulse'
}: SkeletonProps) {
    const baseClasses = 'bg-gray-200 dark:bg-gray-700 rounded';
    
    const variantClasses: Record<string, string> = {
        text: 'h-4',
        circular: 'rounded-full',
        rectangular: 'rounded',
        card: 'rounded-lg p-4'
    };

    const animationClasses: Record<string, string> = {
        pulse: 'animate-pulse',
        wave: 'skeleton-wave',
        none: ''
    };

    const style: React.CSSProperties = {};
    if (width) {
        style.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height) {
        style.height = typeof height === 'number' ? `${height}px` : height;
    }

    return (
        <div
            className={`
                ${baseClasses}
                ${variantClasses[variant] || variantClasses.rectangular}
                ${animationClasses[animation] || animationClasses.pulse}
                ${className}
            `}
            style={style}
            aria-hidden="true"
            role="status"
            aria-label="로딩 중"
        />
    );
}

/**
 * 텍스트 스켈레톤
 */
export function SkeletonText({ 
    lines = 1, 
    className = '' 
}: { 
    lines?: number; 
    className?: string; 
}): JSX.Element {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, idx) => (
                <Skeleton
                    key={idx}
                    variant="text"
                    width={idx === lines - 1 ? '75%' : '100%'}
                    animation="pulse"
                />
            ))}
        </div>
    );
}

/**
 * 카드 스켈레톤
 */
export function SkeletonCard({ className = '' }: { className?: string }): JSX.Element {
    return (
        <div className={`space-y-3 ${className}`}>
            <Skeleton variant="rectangular" height={200} animation="pulse" />
            <Skeleton variant="text" width="60%" animation="pulse" />
            <SkeletonText lines={2} />
        </div>
    );
}

