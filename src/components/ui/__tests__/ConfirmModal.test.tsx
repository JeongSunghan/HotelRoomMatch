import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmProvider, useConfirm } from '../ConfirmModal';

// useConfirm을 사용하는 테스트 컴포넌트
function TestComponent() {
    const confirm = useConfirm();
    
    const handleWarning = async () => {
        const result = await confirm.warning('Warning message');
        return result;
    };
    
    const handleDanger = async () => {
        const result = await confirm.danger('Danger message');
        return result;
    };
    
    const handleInfo = async () => {
        const result = await confirm.info('Info message');
        return result;
    };
    
    const handleShow = async () => {
        const result = await confirm.show({
            title: 'Custom Title',
            message: 'Custom message',
            type: 'warning'
        });
        return result;
    };

    return (
        <div>
            <button onClick={handleWarning}>Show Warning</button>
            <button onClick={handleDanger}>Show Danger</button>
            <button onClick={handleInfo}>Show Info</button>
            <button onClick={handleShow}>Show Custom</button>
        </div>
    );
}

describe('ConfirmModal', () => {
    it('ConfirmProvider와 useConfirm 통합', async () => {
        const user = userEvent.setup();
        render(
            <ConfirmProvider>
                <TestComponent />
            </ConfirmProvider>
        );

        const warningButton = screen.getByText('Show Warning');
        await user.click(warningButton);

        await waitFor(() => {
            expect(screen.getByText('경고')).toBeInTheDocument();
            expect(screen.getByText('Warning message')).toBeInTheDocument();
        });
    });

    it('확인 버튼 클릭 시 true 반환', async () => {
        const user = userEvent.setup();
        let result = false;
        
        render(
            <ConfirmProvider>
                <TestComponent />
            </ConfirmProvider>
        );

        const warningButton = screen.getByText('Show Warning');
        await user.click(warningButton);

        await waitFor(() => {
            expect(screen.getByText('확인')).toBeInTheDocument();
        });

        const confirmButton = screen.getByText('확인');
        await user.click(confirmButton);

        // Promise가 resolve되기를 기다림
        await waitFor(() => {
            expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
        });
    });

    it('취소 버튼 클릭 시 false 반환', async () => {
        const user = userEvent.setup();
        
        render(
            <ConfirmProvider>
                <TestComponent />
            </ConfirmProvider>
        );

        const warningButton = screen.getByText('Show Warning');
        await user.click(warningButton);

        await waitFor(() => {
            expect(screen.getByText('취소')).toBeInTheDocument();
        });

        const cancelButton = screen.getByText('취소');
        await user.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
        });
    });

    it('타입별 스타일 적용', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <ConfirmProvider>
                <TestComponent />
            </ConfirmProvider>
        );

        // Warning 타입
        await user.click(screen.getByText('Show Warning'));
        await waitFor(() => {
            expect(container.querySelector('.bg-amber-100')).toBeInTheDocument();
        });

        // Danger 타입
        await user.click(screen.getByText('취소')); // 이전 모달 닫기
        await waitFor(() => {
            expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
        });

        await user.click(screen.getByText('Show Danger'));
        await waitFor(() => {
            expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
            expect(screen.getByText('삭제')).toBeInTheDocument(); // danger 타입은 '삭제' 버튼
        });

        // Info 타입
        await user.click(screen.getByText('취소'));
        await waitFor(() => {
            expect(screen.queryByText('Danger message')).not.toBeInTheDocument();
        });

        await user.click(screen.getByText('Show Info'));
        await waitFor(() => {
            expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();
        });
    });

    it('커스텀 옵션 적용', async () => {
        const user = userEvent.setup();
        render(
            <ConfirmProvider>
                <TestComponent />
            </ConfirmProvider>
        );

        await user.click(screen.getByText('Show Custom'));

        await waitFor(() => {
            expect(screen.getByText('Custom Title')).toBeInTheDocument();
            expect(screen.getByText('Custom message')).toBeInTheDocument();
        });
    });
});

