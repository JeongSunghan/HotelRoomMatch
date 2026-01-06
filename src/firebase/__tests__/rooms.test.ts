/**
 * Firebase rooms 모듈 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectRoom, subscribeToRooms, removeGuestFromRoom } from '../rooms';
import * as config from '../config';
import type { Guest, Gender } from '../../types';

// Firebase 모킹
vi.mock('../config', () => ({
    database: {
        ref: vi.fn()
    },
    ref: vi.fn(),
    onValue: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    runTransaction: vi.fn()
}));

describe('rooms', () => {
    const mockGuest: Guest = {
        name: '홍길동',
        gender: 'M',
        sessionId: 'test-session-123',
        email: 'test@example.com'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('subscribeToRooms', () => {
        it('Firebase가 초기화되지 않은 경우 빈 객체 반환', () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue(null as never);

            const callback = vi.fn();
            const unsubscribe = subscribeToRooms(callback);

            expect(callback).toHaveBeenCalledWith({});
            expect(typeof unsubscribe).toBe('function');
        });

        it('Firebase가 초기화된 경우 구독 설정', () => {
            const mockUnsubscribe = vi.fn();
            const mockOnValue = vi.fn((ref, callback) => {
                // 시뮬레이션: 즉시 데이터 전달
                callback({ val: () => ({ '101': { guests: [] } }) });
                return mockUnsubscribe;
            });

            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);
            vi.spyOn(config, 'ref').mockReturnValue({} as never);
            vi.spyOn(config, 'onValue').mockImplementation(mockOnValue);

            const callback = vi.fn();
            const unsubscribe = subscribeToRooms(callback);

            expect(config.ref).toHaveBeenCalled();
            expect(typeof unsubscribe).toBe('function');
        });
    });

    describe('selectRoom', () => {
        it('Firebase가 초기화되지 않은 경우 false 반환', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue(null as never);

            await expect(selectRoom('101', mockGuest)).resolves.toBe(false);
        });

        it('유효하지 않은 방 번호로 인한 에러', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);

            await expect(selectRoom('', mockGuest)).rejects.toThrow('유효하지 않은 방 번호');
        });

        it('유효하지 않은 세션 ID로 인한 에러', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);
            // 빈 문자열은 isValidSessionId에서 false를 반환하므로 에러 발생
            const invalidGuest = { ...mockGuest, sessionId: '' };

            await expect(selectRoom('101', invalidGuest)).rejects.toThrow();
        });

        it('성별이 맞지 않는 경우 에러', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);
            const femaleGuest = { ...mockGuest, gender: 'F' as Gender };

            // get 함수가 빈 rooms 객체 반환하도록 모킹 (다른 방에 배정되지 않았음을 의미)
            vi.spyOn(config, 'get').mockResolvedValue({
                val: () => ({})
            } as never);

            // ref 모킹
            vi.spyOn(config, 'ref').mockReturnValue({} as never);

            // 성별 검증은 selectRoom 함수 내부에서 수행되므로
            // roomGender 파라미터와 guestData.gender가 다르면 에러 발생
            // 방 번호 검증이 먼저 실행되므로 유효한 방 번호 사용
            await expect(selectRoom('101', femaleGuest, 2, 'M')).rejects.toThrow();
        });
    });

    describe('removeGuestFromRoom', () => {
        it('Firebase가 초기화되지 않은 경우 false 반환', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue(null as never);

            await expect(removeGuestFromRoom('101', 'test-session')).resolves.toBe(false);
        });

        it('게스트 제거 성공', async () => {
            const mockGuests = [
                { sessionId: 'test-session-1', name: '홍길동', gender: 'M' },
                { sessionId: 'test-session-2', name: '김철수', gender: 'M' }
            ];

            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);
            vi.spyOn(config, 'ref').mockReturnValue({} as never);
            vi.spyOn(config, 'get').mockResolvedValue({
                val: () => mockGuests
            } as never);
            vi.spyOn(config, 'set').mockResolvedValue(undefined);

            const result = await removeGuestFromRoom('101', 'test-session-1');
            expect(result).toBe(true);
            expect(config.set).toHaveBeenCalled();
        });
    });
});

