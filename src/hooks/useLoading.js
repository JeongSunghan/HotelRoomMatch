import { useState, useCallback } from 'react';

/**
 * 로딩 상태 관리 훅
 */
export function useLoading(initialState = false) {
    const [isLoading, setIsLoading] = useState(initialState);
    const [error, setError] = useState(null);

    const startLoading = useCallback(() => {
        setIsLoading(true);
        setError(null);
    }, []);

    const stopLoading = useCallback(() => {
        setIsLoading(false);
    }, []);

    const setLoadingError = useCallback((err) => {
        setError(err);
        setIsLoading(false);
    }, []);

    // 비동기 작업을 감싸는 헬퍼 함수
    const withLoading = useCallback(async (asyncFn) => {
        startLoading();
        try {
            const result = await asyncFn();
            stopLoading();
            return result;
        } catch (err) {
            setLoadingError(err.message || '오류가 발생했습니다.');
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
