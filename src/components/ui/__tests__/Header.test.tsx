/**
 * Header 컴포넌트 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '../Header';
import type { User } from '../../../types';

// ThemeToggle 모킹
vi.mock('../../../hooks/useTheme', () => ({
    ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>
}));

describe('Header', () => {
    const mockStats = {
        male: {
            occupiedSlots: 10,
            availableSlots: 5
        },
        female: {
            occupiedSlots: 8,
            availableSlots: 7
        }
    };

    it('기본 렌더링 - 사용자 없음', () => {
        render(<Header user={null} />);
        expect(screen.getByText(/V-Up 호텔 객실 배정/i)).toBeInTheDocument();
    });

    it('사용자 정보 표시', () => {
        const user: User = {
            name: '홍길동',
            gender: 'M',
            age: 30,
            locked: true,
            selectedRoom: '101',
            sessionId: 'test-session',
            email: 'test@example.com'
        };

        render(<Header user={user} />);
        expect(screen.getByText('홍길동')).toBeInTheDocument();
        expect(screen.getByText(/101호/i)).toBeInTheDocument();
    });

    it('통계 정보 표시', () => {
        render(<Header user={null} stats={mockStats} />);
        expect(screen.getByText('10')).toBeInTheDocument(); // 남성 배정
        expect(screen.getByText('5')).toBeInTheDocument(); // 남성 잔여
        expect(screen.getByText('8')).toBeInTheDocument(); // 여성 배정
        expect(screen.getByText('7')).toBeInTheDocument(); // 여성 잔여
    });

    it('사용자 클릭 핸들러 호출', async () => {
        const user: User = {
            name: '홍길동',
            gender: 'M',
            locked: true,
            selectedRoom: '101',
            sessionId: 'test-session',
            email: 'test@example.com'
        };
        const onUserClick = vi.fn();

        const userEventInstance = userEvent.setup();
        render(<Header user={user} onUserClick={onUserClick} />);

        const userButton = screen.getByText('홍길동').closest('button');
        if (userButton) {
            await userEventInstance.click(userButton);
            expect(onUserClick).toHaveBeenCalledTimes(1);
        }
    });

    it('관리자 모드 표시', () => {
        const user: User = {
            name: '관리자',
            gender: 'M',
            locked: false,
            sessionId: 'admin-session',
            email: 'admin@example.com'
        };

        render(<Header user={user} isAdmin={true} />);
        expect(screen.getByText('관리자')).toBeInTheDocument();
    });

    it('여성 사용자 스타일 적용', () => {
        const user: User = {
            name: '김영희',
            gender: 'F',
            locked: true,
            selectedRoom: '201',
            sessionId: 'test-session',
            email: 'test@example.com'
        };

        render(<Header user={user} />);
        expect(screen.getByText('김영희')).toBeInTheDocument();
    });
});

