/**
 * Toast 컴포넌트 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast, ToastContainer, ToastProvider, useToast } from '../Toast';

describe('Toast', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('기본 렌더링', () => {
        const onClose = vi.fn();
        render(<Toast message="Test message" onClose={onClose} />);
        expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('다양한 타입 표시', () => {
        const onClose = vi.fn();
        const { rerender } = render(<Toast message="Success" type="success" onClose={onClose} />);
        expect(screen.getByText('Success')).toBeInTheDocument();

        rerender(<Toast message="Error" type="error" onClose={onClose} />);
        expect(screen.getByText('Error')).toBeInTheDocument();

        rerender(<Toast message="Warning" type="warning" onClose={onClose} />);
        expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onClose 호출', async () => {
        const onClose = vi.fn();
        const { unmount } = render(<Toast message="Test" onClose={onClose} duration={0} />);
        
        const closeButton = screen.getByRole('button');
        closeButton.click();
        
        // 클릭 이벤트만 처리 (duration=0이므로 자동 닫기 없음)
        expect(onClose).toHaveBeenCalledTimes(1);
        
        unmount();
    });

    it('duration 후 자동 닫기', () => {
        const onClose = vi.fn();
        render(<Toast message="Test" onClose={onClose} duration={1000} />);
        
        expect(onClose).not.toHaveBeenCalled();
        
        // 타이머를 1000ms 진행
        vi.advanceTimersByTime(1000);
        
        // 타이머가 실행되었는지 확인 (실제로는 useEffect 내부에서 실행됨)
        // Fake timers를 사용하므로 즉시 실행되어야 함
        expect(onClose).toHaveBeenCalled();
    });

    it('duration이 0이면 자동 닫기 안 함', async () => {
        const onClose = vi.fn();
        render(<Toast message="Test" onClose={onClose} duration={0} />);
        
        vi.advanceTimersByTime(5000);
        
        expect(onClose).not.toHaveBeenCalled();
    });
});

describe('ToastContainer', () => {
    it('toasts가 비어있으면 null 반환', () => {
        const { container } = render(<ToastContainer toasts={[]} removeToast={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    it('여러 toast 표시', () => {
        const toasts = [
            { id: 1, message: 'Toast 1', type: 'info' as const, duration: 3000 },
            { id: 2, message: 'Toast 2', type: 'success' as const, duration: 3000 }
        ];
        render(<ToastContainer toasts={toasts} removeToast={vi.fn()} />);
        
        expect(screen.getByText('Toast 1')).toBeInTheDocument();
        expect(screen.getByText('Toast 2')).toBeInTheDocument();
    });
});

describe('ToastProvider', () => {
    it('ToastProvider로 감싸진 컴포넌트에서 useToast 사용', () => {
        function TestComponent() {
            const toast = useToast();
            return (
                <button onClick={() => toast.success('Success!')}>
                    Show Toast
                </button>
            );
        }

        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        expect(screen.getByText('Show Toast')).toBeInTheDocument();
    });

    it('useToast가 Provider 밖에서 사용되면 에러', () => {
        // 에러를 캡처하기 위해 console.error 모킹
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        function TestComponent() {
            useToast();
            return <div>Test</div>;
        }

        expect(() => {
            render(<TestComponent />);
        }).toThrow('useToast must be used within a ToastProvider');

        consoleError.mockRestore();
    });

    it('toast.success 호출', async () => {
        const user = userEvent.setup();
        function TestComponent() {
            const toast = useToast();
            return (
                <button onClick={() => toast.success('Success message')}>
                    Show Success
                </button>
            );
        }

        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        await user.click(screen.getByText('Show Success'));
        expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('toast.error 호출', async () => {
        const user = userEvent.setup();
        function TestComponent() {
            const toast = useToast();
            return (
                <button onClick={() => toast.error('Error message')}>
                    Show Error
                </button>
            );
        }

        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        await user.click(screen.getByText('Show Error'));
        expect(screen.getByText('Error message')).toBeInTheDocument();
    });
});
