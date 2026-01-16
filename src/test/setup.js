/**
 * Vitest 테스트 환경 설정
 */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 각 테스트 후 DOM 정리
afterEach(() => {
    cleanup();
});

// Firebase mock (crypto API) - vi.stubGlobal 사용
vi.stubGlobal('crypto', {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 15),
    getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    },
    subtle: {
        digest: async (algorithm, data) => {
            // 간단한 해시 mock (실제로는 SHA-256이지만 테스트용)
            return new ArrayBuffer(32);
        }
    }
});

// localStorage mock
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('sessionStorage', localStorageMock);

// window.matchMedia mock
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
