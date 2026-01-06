import { Component, type ReactNode, type ErrorInfo } from 'react';
import { getErrorMessage } from '../../utils/errorMessages';
import ErrorDisplay from './ErrorDisplay';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * 에러 바운더리 컴포넌트
 * 하위 컴포넌트에서 발생하는 에러를 포착하고 Fallback UI를 표시합니다.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // 구조화된 에러 로깅
        const errorData = {
            error: error.toString(),
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString()
        };
        console.error('[ErrorBoundary] 에러 발생:', errorData);
        
        // 개발 환경에서만 상세 정보 출력
        if (import.meta.env.DEV) {
            console.error('원본 에러:', error);
            console.error('컴포넌트 스택:', errorInfo.componentStack);
        }
    }

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            const errorMsg = this.state.error 
                ? getErrorMessage(this.state.error)
                : {
                    message: '오류가 발생했습니다',
                    recovery: '페이지를 새로고침하거나 관리자에게 문의해주세요.',
                    type: 'error' as const
                };

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full">
                        <ErrorDisplay error={errorMsg} />
                        
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[44px]"
                                aria-label="페이지 새로고침"
                            >
                                🔄 페이지 새로고침
                            </button>
                            
                            <button
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                }}
                                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                aria-label="다시 시도"
                            >
                                다시 시도
                            </button>
                        </div>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                    개발자 정보
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto text-red-600 dark:text-red-400 border border-gray-200 dark:border-gray-700">
                                    {this.state.error.toString()}
                                    {this.state.error.stack && (
                                        <>
                                            {'\n\n스택 트레이스:\n'}
                                            {this.state.error.stack}
                                        </>
                                    )}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}


