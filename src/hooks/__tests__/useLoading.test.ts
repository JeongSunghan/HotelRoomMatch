/**
 * useLoading 훅 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoading } from '../useLoading';

describe('useLoading', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('초기 상태 설정', () => {
        const { result } = renderHook(() => useLoading(false));
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('초기 로딩 상태 true', () => {
        const { result } = renderHook(() => useLoading(true));
        expect(result.current.isLoading).toBe(true);
    });

    it('startLoading 호출 시 로딩 시작', () => {
        const { result } = renderHook(() => useLoading(false));

        act(() => {
            result.current.startLoading();
        });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('stopLoading 호출 시 로딩 종료', () => {
        const { result } = renderHook(() => useLoading(true));

        act(() => {
            result.current.stopLoading();
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('setLoadingError 호출 시 에러 설정 및 로딩 종료', () => {
        const { result } = renderHook(() => useLoading(true));

        act(() => {
            result.current.setLoadingError('테스트 에러');
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('테스트 에러');
    });

    it('setLoadingError - Error 객체 처리', () => {
        const { result } = renderHook(() => useLoading(true));
        const error = new Error('에러 메시지');

        act(() => {
            result.current.setLoadingError(error);
        });

        expect(result.current.error).toBe('에러 메시지');
    });

    it('withLoading - 성공 케이스', async () => {
        const { result } = renderHook(() => useLoading(false));
        const asyncFn = vi.fn().mockResolvedValue('성공');

        await act(async () => {
            const value = await result.current.withLoading(asyncFn);
            expect(value).toBe('성공');
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('withLoading - 실패 케이스', async () => {
        const { result } = renderHook(() => useLoading(false));
        const error = new Error('비동기 에러');
        const asyncFn = vi.fn().mockRejectedValue(error);

        await act(async () => {
            try {
                await result.current.withLoading(asyncFn);
            } catch (e) {
                expect(e).toBe(error);
            }
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('비동기 에러');
    });

    it('withLoading - 로딩 상태 전환', async () => {
        const { result } = renderHook(() => useLoading(false));
        const asyncFn = vi.fn().mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve('완료'), 100))
        );

        act(() => {
            result.current.withLoading(asyncFn);
        });

        // 로딩 시작 확인
        expect(result.current.isLoading).toBe(true);

        // 비동기 완료 대기
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 150));
        });

        expect(result.current.isLoading).toBe(false);
    });
});

