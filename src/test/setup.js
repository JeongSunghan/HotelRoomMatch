/**
 * Vitest 테스트 환경 설정 파일
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Firebase 모킹 (기본)
vi.mock('../firebase/config', () => ({
    database: null,
    auth: null,
    app: null,
    ref: vi.fn(),
    onValue: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
    runTransaction: vi.fn(),
    push: vi.fn(),
    remove: vi.fn(),
    isFirebaseInitialized: vi.fn(() => false)
}));

// localStorage 모킹
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
global.localStorage = localStorageMock;

// window 객체 확장
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

