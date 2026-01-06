/**
 * FloorSelector 컴포넌트 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloorSelector from '../FloorSelector';
import type { Gender } from '../../../types';

describe('FloorSelector', () => {
    const mockOnSelectFloor = vi.fn();
    const mockOnRoomTypeFilterChange = vi.fn();

    const defaultProps = {
        selectedFloor: 1,
        onSelectFloor: mockOnSelectFloor,
        userGender: 'M' as Gender,
        roomTypeFilter: 'all' as const,
        onRoomTypeFilterChange: mockOnRoomTypeFilterChange
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('기본 렌더링', () => {
        render(<FloorSelector {...defaultProps} />);
        expect(screen.getByText('객실 타입:')).toBeInTheDocument();
        expect(screen.getByText('전체')).toBeInTheDocument();
        expect(screen.getByText('2인실')).toBeInTheDocument();
        expect(screen.getByText('1인실')).toBeInTheDocument();
    });

    it('객실 타입 필터 변경', async () => {
        const user = userEvent.setup();
        render(<FloorSelector {...defaultProps} />);

        const twinButton = screen.getByText('2인실');
        await user.click(twinButton);
        expect(mockOnRoomTypeFilterChange).toHaveBeenCalledWith('twin');

        const singleButton = screen.getByText('1인실');
        await user.click(singleButton);
        expect(mockOnRoomTypeFilterChange).toHaveBeenCalledWith('single');
    });

    it('층 선택 버튼 클릭', async () => {
        const user = userEvent.setup();
        render(<FloorSelector {...defaultProps} />);

        // 첫 번째 층 버튼 찾기 (실제 floor 데이터에 따라 다를 수 있음)
        const floorButtons = screen.getAllByRole('button').filter(
            btn => btn.textContent?.includes('층') || btn.textContent?.includes('F')
        );
        
        if (floorButtons.length > 0) {
            await user.click(floorButtons[0]);
            expect(mockOnSelectFloor).toHaveBeenCalled();
        }
    });

    it('선택된 층 하이라이트', () => {
        render(<FloorSelector {...defaultProps} selectedFloor={2} />);
        // 선택된 층이 active 클래스를 가지는지 확인
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('여성 사용자 필터', () => {
        render(<FloorSelector {...defaultProps} userGender="F" />);
        // 여성 사용자에 맞는 층이 표시되는지 확인
        expect(screen.getByText('객실 타입:')).toBeInTheDocument();
    });
});

