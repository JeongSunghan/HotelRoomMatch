/**
 * LoadingSpinner 컴포넌트 테스트
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
    it('기본 렌더링', () => {
        render(<LoadingSpinner />);
        expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });

    it('커스텀 텍스트 표시', () => {
        render(<LoadingSpinner text="데이터 로딩 중..." />);
        expect(screen.getByText('데이터 로딩 중...')).toBeInTheDocument();
    });

    it('size prop 적용', () => {
        const { container } = render(<LoadingSpinner size="sm" />);
        const spinner = container.querySelector('.w-6.h-6');
        expect(spinner).toBeInTheDocument();
    });

    it('fullScreen prop 적용', () => {
        const { container } = render(<LoadingSpinner fullScreen />);
        const fullScreenDiv = container.querySelector('.fixed.inset-0');
        expect(fullScreenDiv).toBeInTheDocument();
    });

    it('fullScreen이 false일 때 일반 렌더링', () => {
        const { container } = render(<LoadingSpinner fullScreen={false} />);
        const fullScreenDiv = container.querySelector('.fixed.inset-0');
        expect(fullScreenDiv).not.toBeInTheDocument();
    });

    it('className prop 적용', () => {
        const { container } = render(<LoadingSpinner className="custom-class" />);
        const spinner = container.querySelector('.custom-class');
        expect(spinner).toBeInTheDocument();
    });

    it('다양한 size 옵션 테스트', () => {
        const { container: containerSm } = render(<LoadingSpinner size="sm" />);
        expect(containerSm.querySelector('.w-6')).toBeInTheDocument();

        const { container: containerMd } = render(<LoadingSpinner size="md" />);
        expect(containerMd.querySelector('.w-10')).toBeInTheDocument();

        const { container: containerLg } = render(<LoadingSpinner size="lg" />);
        expect(containerLg.querySelector('.w-16')).toBeInTheDocument();
    });
});
