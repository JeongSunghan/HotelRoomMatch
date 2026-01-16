import { Component } from 'react';

/**
 * 에러 바운더리 컴포넌트
 * 하위 컴포넌트에서 발생하는 에러를 포착하고 Fallback UI를 표시합니다.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // 에러 핸들러를 통해 로깅 및 리포팅
        import('../utils/errorHandler').then(({ analyzeError, ERROR_SEVERITY }) => {
            const errorData = analyzeError(error, {
                location: 'ErrorBoundary',
                componentStack: errorInfo.componentStack,
                errorInfo
            });

            // 개발 환경에서만 상세 로그
            if (import.meta.env.DEV) {
                console.error('ErrorBoundary caught an error:', error, errorInfo);
            }

            // Critical 에러는 리포팅 서비스에 전송 (향후 Sentry 등)
            if (errorData.severity === ERROR_SEVERITY.CRITICAL) {
                // TODO: Sentry.captureException(error, { contexts: { react: errorInfo } });
                console.log('📊 Critical error reported to service');
            }
        });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-800 mb-2">
                            오류가 발생했습니다
                        </h1>
                        <p className="text-gray-600 mb-6">
                            예상치 못한 문제가 발생했습니다.<br />
                            페이지를 새로고침하거나 관리자에게 문의해주세요.
                        </p>
                        <button
                            onClick={this.handleReload}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            페이지 새로고침
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-4 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500">
                                    개발자 정보
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto text-red-600">
                                    {this.state.error.toString()}
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
