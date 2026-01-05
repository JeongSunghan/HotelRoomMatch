import { useState, useCallback } from 'react';

/**
 * 로딩 상태 관리 훅
 */
export function useLoading(initialState: boolean = false) {
    const [isLoading, setIsLoading] = useState<boolean>(initialState);
    const [error, setError] = useState<string | null>(null);

    const startLoading = useCallback(() => {
        setIsLoading(true);
        setError(null);
    }, []);

    const stopLoading = useCallback(() => {
        setIsLoading(false);
    }, []);

    const setLoadingError = useCallback((err: string | Error) => {
        const errorMessage = err instanceof Error ? err.message : err;
        setError(errorMessage);
        setIsLoading(false);
    }, []);

    // 비동기 작업을 감싸는 헬퍼 함수
    const withLoading = useCallback(async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
        startLoading();
        try {
            const result = await asyncFn();
            stopLoading();
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.';
            setLoadingError(errorMessage);
            throw err;
        }
    }, [startLoading, stopLoading, setLoadingError]);

    return {
        isLoading,
        error,
        startLoading,
        stopLoading,
        setLoadingError,
        withLoading
    };
}


