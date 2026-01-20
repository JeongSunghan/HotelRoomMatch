/**
 * 알림 센터 컴포넌트
 * 알림 목록 표시 및 읽음 처리
 */
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
    } = useNotifications();

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // 알림 아이콘 색상
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'invitation': return '🤝';
            case 'request': return '📩';
            case 'room': return '🏠';
            case 'warning': return '⚠️';
            default: return '🔔';
        }
    };

    // 시간 포맷
    const formatTime = (timestamp) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        return `${days}일 전`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 알림 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="알림"
            >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* 드롭다운 */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden slide-in-top">
                    {/* 헤더 */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h3 className="font-bold text-gray-800">알림</h3>
                        {notifications.length > 0 && (
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        모두 읽음
                                    </button>
                                )}
                                <button
                                    onClick={clearAll}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    전체 삭제
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 알림 목록 */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <span className="text-4xl mb-2 block">🔕</span>
                                <p className="text-sm">알림이 없습니다</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => {
                                        if (!notif.read) {
                                            markAsRead(notif.id);
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl flex-shrink-0">
                                            {getNotificationIcon(notif.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-gray-800 text-sm">
                                                    {notif.title}
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeNotification(notif.id);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-gray-400">
                                                    {formatTime(notif.timestamp)}
                                                </span>
                                                {!notif.read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
