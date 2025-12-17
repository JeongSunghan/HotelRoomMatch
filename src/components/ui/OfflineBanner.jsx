import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/**
 * 오프라인 알림 배너 컴포넌트
 */
export default function OfflineBanner() {
    const { isOnline } = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white py-2 px-4 text-center shadow-lg animate-slide-in-down">
            <p className="flex items-center justify-center gap-2">
                <span>📡</span>
                <span>인터넷 연결이 끊겼습니다. 일부 기능이 제한될 수 있습니다.</span>
            </p>
        </div>
    );
}
