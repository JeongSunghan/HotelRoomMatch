/**
 * RoomCard 컴포넌트 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoomCard from '../RoomCard';
import type { RoomInfo, RoomStatus, Guest } from '../../../types';

describe('RoomCard', () => {
    const mockRoomInfo: RoomInfo = {
        floor: 1,
        roomType: '스탠다드',
        capacity: 2,
        gender: 'M'
    };

    const mockOnClick = vi.fn();
    const mockOnSingleRoomClick = vi.fn();

    const createEmptyStatus = (): RoomStatus => ({
        status: 'empty',
        guests: [],
        guestCount: 0,
        capacity: 2,
        roomType: '스탠다드',
        roomGender: 'M',
        isLocked: false
    });

    it('기본 렌더링 - 빈 방', () => {
        const status = createEmptyStatus();
        render(
            <RoomCard
                roomNumber="101"
                roomInfo={mockRoomInfo}
                status={status}
                isMyRoom={false}
                canSelect={true}
                onClick={mockOnClick}
                isAdmin={false}
            />
        );

        expect(screen.getByText('101')).toBeInTheDocument();
        expect(screen.getByText(/빈 방/i)).toBeInTheDocument();
    });

    it('내 방 표시', () => {
        const status = createEmptyStatus();
        render(
            <RoomCard
                roomNumber="101"
                roomInfo={mockRoomInfo}
                status={status}
                isMyRoom={true}
                canSelect={false}
                onClick={mockOnClick}
                isAdmin={false}
            />
        );

        expect(screen.getByText(/내 방/i)).toBeInTheDocument();
    });

    it('투숙객 정보 표시', () => {
        const guest: Guest = {
            name: '홍길동',
            gender: 'M',
            sessionId: 'test-session',
            email: 'test@example.com'
        };

        const status: RoomStatus = {
            status: 'half',
            guests: [guest],
            guestCount: 1,
            capacity: 2,
            roomType: '스탠다드',
            roomGender: 'M',
            isLocked: false
        };

        render(
            <RoomCard
                roomNumber="101"
                roomInfo={mockRoomInfo}
                status={status}
                isMyRoom={false}
                canSelect={true}
                onClick={mockOnClick}
                isAdmin={false}
            />
        );

        expect(screen.getByText('홍길동')).toBeInTheDocument();
    });

    it('방 클릭 시 onClick 호출', async () => {
        const status = createEmptyStatus();
        const user = userEvent.setup();

        render(
            <RoomCard
                roomNumber="101"
                roomInfo={mockRoomInfo}
                status={status}
                isMyRoom={false}
                canSelect={true}
                onClick={mockOnClick}
                isAdmin={false}
            />
        );

        const card = screen.getByText('101').closest('.room-card');
        if (card) {
            await user.click(card);
            expect(mockOnClick).toHaveBeenCalledWith('101');
        }
    });

    it('1인실 클릭 시 onSingleRoomClick 호출', async () => {
        const status: RoomStatus = {
            status: 'empty',
            guests: [],
            guestCount: 0,
            capacity: 1,
            roomType: '1인실',
            roomGender: 'M',
            isLocked: true
        };

        const user = userEvent.setup();

        render(
            <RoomCard
                roomNumber="201"
                roomInfo={{ ...mockRoomInfo, capacity: 1 }}
                status={status}
                isMyRoom={false}
                canSelect={false}
                onClick={mockOnClick}
                onSingleRoomClick={mockOnSingleRoomClick}
                isAdmin={false}
            />
        );

        const card = screen.getByText('201').closest('.room-card');
        if (card) {
            await user.click(card);
            expect(mockOnSingleRoomClick).toHaveBeenCalledWith('201');
        }
    });

    it('하이라이트 표시', () => {
        const status = createEmptyStatus();
        render(
            <RoomCard
                roomNumber="101"
                roomInfo={mockRoomInfo}
                status={status}
                isMyRoom={false}
                canSelect={true}
                onClick={mockOnClick}
                isAdmin={false}
                isHighlighted={true}
            />
        );

        const card = screen.getByText('101').closest('.room-card');
        expect(card).toHaveClass('ring-4');
    });
});

