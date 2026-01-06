/**
 * useOnlineStatus 훅 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('useOnlineStatus', () => {
    let originalOnLine: boolean;
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
    let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        originalOnLine = navigator.onLine;
        
        // navigator.onLine 모킹
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true
        });

        // addEventListener와 removeEventListener 스파이 생성
        addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: originalOnLine
        });
        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    it('초기 온라인 상태', () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true
        });

        const { result } = renderHook(() => useOnlineStatus());
        expect(result.current.isOnline).toBe(true);
        expect(result.current.wasOffline).toBe(false);
    });

    it('초기 오프라인 상태', () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false
        });

        const { result } = renderHook(() => useOnlineStatus());
        expect(result.current.isOnline).toBe(false);
        // wasOffline은 초기에는 false (아직 오프라인 이벤트를 받지 않았으므로)
        expect(result.current.wasOffline).toBe(false);
    });

    it('온라인 이벤트 리스너 등록', () => {
        const { result } = renderHook(() => useOnlineStatus());

        // 이벤트 리스너가 등록되었는지 확인
        expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('오프라인 이벤트 처리', () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true
        });

        const { result } = renderHook(() => useOnlineStatus());

        // 온라인 상태 확인
        expect(result.current.isOnline).toBe(true);

        // 오프라인 이벤트 핸들러 가져오기
        const offlineHandler = addEventListenerSpy.mock.calls.find(
            call => call[0] === 'offline'
        )?.[1] as (event: Event) => void;

        if (offlineHandler) {
            // 오프라인으로 전환
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                configurable: true,
                value: false
            });

            act(() => {
                offlineHandler(new Event('offline'));
            });

            expect(result.current.isOnline).toBe(false);
            expect(result.current.wasOffline).toBe(true);
        }
    });

    it('이벤트 리스너 정리', () => {
        const { unmount } = renderHook(() => useOnlineStatus());

        unmount();

        // 컴포넌트 언마운트 시 이벤트 리스너가 제거되었는지 확인
        expect(removeEventListenerSpy).toHaveBeenCalled();
    });
});

