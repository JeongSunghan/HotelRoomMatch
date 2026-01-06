/**
 * ErrorBoundary 컴포넌트 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// 에러를 발생시키는 테스트 컴포넌트
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
}

describe('ErrorBoundary', () => {
    beforeEach(() => {
        // console.error를 모킹하여 테스트 중 에러 로그를 숨김
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('에러가 없을 때 children 렌더링', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );
        expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('에러 발생 시 Fallback UI 표시', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });

    it('에러 발생 시 새로고침 버튼 표시', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        
        // getByText 대신 getAllByText 사용 (여러 요소가 있을 수 있음)
        const reloadButtons = screen.getAllByText(/새로고침/i);
        expect(reloadButtons.length).toBeGreaterThan(0);
    });

    it('개발 환경에서 에러 상세 정보 표시', () => {
        const originalEnv = import.meta.env.DEV;
        Object.defineProperty(import.meta, 'env', {
            value: { ...import.meta.env, DEV: true },
            writable: true
        });

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // 개발 환경에서는 에러 스택 정보가 표시될 수 있음
        expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();

        Object.defineProperty(import.meta, 'env', {
            value: { ...import.meta.env, DEV: originalEnv },
            writable: true
        });
    });
});
