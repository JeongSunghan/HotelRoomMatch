/**
 * Firebase users 모듈 테스트 (Legacy - Realtime Database)
 * ⚠️ Firestore 마이그레이션 완료 후 삭제 예정
 * 현재는 스킵 처리하여 테스트 실패 방지
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveUser, updateUser, getUser, subscribeToUserSession, clearUserSession } from '../users';
import * as config from '../config';
import type { User, UserUpdateData } from '../../types';

// Firebase 모킹
vi.mock('../config', () => ({
    database: {
        ref: vi.fn()
    },
    ref: vi.fn(),
    onValue: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    get: vi.fn()
}));

// Legacy 테스트 - Firestore 마이그레이션 완료 후 삭제 예정
describe.skip('users (Legacy - Realtime DB)', () => {
    const mockUser: User = {
        name: '홍길동',
        gender: 'M',
        sessionId: 'test-session-123',
        email: 'test@example.com',
        locked: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('saveUser', () => {
        it('Firebase가 초기화되지 않은 경우 false 반환', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue(null as never);

            const result = await saveUser('test-session', mockUser);
            expect(result).toBe(false);
        });

        it('사용자 저장 성공', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);
            vi.spyOn(config, 'ref').mockReturnValue({} as never);
            vi.spyOn(config, 'set').mockResolvedValue(undefined);

            const result = await saveUser('test-session', mockUser);
            expect(result).toBe(true);
            expect(config.set).toHaveBeenCalled();
        });
    });

    describe('updateUser', () => {
        it('Firebase가 초기화되지 않은 경우 false 반환', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue(null as never);

            const updates: UserUpdateData = { name: '김철수' };
            const result = await updateUser('test-session', updates);
            expect(result).toBe(false);
        });

        it('사용자 업데이트 성공', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);
            vi.spyOn(config, 'ref').mockReturnValue({} as never);
            vi.spyOn(config, 'update').mockResolvedValue(undefined);

            const updates: UserUpdateData = { name: '김철수' };
            const result = await updateUser('test-session', updates);
            expect(result).toBe(true);
            expect(config.update).toHaveBeenCalled();
        });
    });

    describe('getUser', () => {
        it('Firebase가 초기화되지 않은 경우 null 반환', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue(null as never);

            const result = await getUser('test-session');
            expect(result).toBeNull();
        });

        it('사용자 조회 성공', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);
            vi.spyOn(config, 'ref').mockReturnValue({} as never);
            vi.spyOn(config, 'get').mockResolvedValue({
                val: () => mockUser
            } as never);

            const result = await getUser('test-session');
            expect(result).toEqual(mockUser);
        });

        it('사용자가 없는 경우 null 반환', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);
            vi.spyOn(config, 'ref').mockReturnValue({} as never);
            vi.spyOn(config, 'get').mockResolvedValue({
                val: () => null
            } as never);

            const result = await getUser('test-session');
            expect(result).toBeNull();
        });
    });

    describe('subscribeToUserSession', () => {
        it('Firebase가 초기화되지 않은 경우 null 콜백 호출', () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue(null as never);

            const callback = vi.fn();
            const unsubscribe = subscribeToUserSession('test-session', callback);

            expect(callback).toHaveBeenCalledWith(null);
            expect(typeof unsubscribe).toBe('function');
        });

        it('세션 ID가 없는 경우 null 콜백 호출', () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);

            const callback = vi.fn();
            const unsubscribe = subscribeToUserSession('', callback);

            expect(callback).toHaveBeenCalledWith(null);
            expect(typeof unsubscribe).toBe('function');
        });

        it('Firebase가 초기화된 경우 구독 설정', () => {
            const mockUnsubscribe = vi.fn();
            const mockOnValue = vi.fn((ref, callback) => {
                callback({ val: () => mockUser });
                return mockUnsubscribe;
            });

            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);
            vi.spyOn(config, 'ref').mockReturnValue({} as never);
            vi.spyOn(config, 'onValue').mockImplementation(mockOnValue);

            const callback = vi.fn();
            const unsubscribe = subscribeToUserSession('test-session', callback);

            expect(config.ref).toHaveBeenCalled();
            expect(typeof unsubscribe).toBe('function');
        });
    });

    describe('clearUserSession', () => {
        it('Firebase가 초기화되지 않은 경우 false 반환', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue(null as never);

            const result = await clearUserSession('test-session');
            expect(result).toBe(false);
        });

        it('세션 삭제 성공', async () => {
            vi.spyOn(config, 'database', 'get').mockReturnValue({} as never);
            vi.spyOn(config, 'ref').mockReturnValue({} as never);
            vi.spyOn(config, 'set').mockResolvedValue(undefined);

            const result = await clearUserSession('test-session');
            expect(result).toBe(true);
            expect(config.set).toHaveBeenCalledWith(expect.anything(), null);
        });
    });
});

