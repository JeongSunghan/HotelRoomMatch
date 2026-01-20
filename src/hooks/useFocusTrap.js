/**
 * 모달에서 포커스를 트래핑하는 커스텀 훅
 * Tab 키로 포커스를 순환시킴
 */
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive = true) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;

        // 포커스 가능한 요소 선택
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // 초기 포커스
        firstElement?.focus();

        // Tab 키 핸들러
        const handleTab = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        // Escape 키로 모달 닫기 (선택적)
        const handleEscape = (e) => {
            if (e.key === 'Escape' && typeof window !== 'undefined') {
                // 모달 닫기 이벤트 발생
                const event = new CustomEvent('modal-close');
                window.dispatchEvent(event);
            }
        };

        container.addEventListener('keydown', handleTab);
        document.addEventListener('keydown', handleEscape);

        return () => {
            container.removeEventListener('keydown', handleTab);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isActive]);

    return containerRef;
}
