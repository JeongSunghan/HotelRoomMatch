/**
 * 알림 시스템 Context
 * 전역 알림 상태 관리
 */
import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // 알림 추가
    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: `notif_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            read: false,
            ...notification
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // 최대 20개
        setUnreadCount(prev => prev + 1);

        return newNotification.id;
    }, []);

    // 알림 읽음 처리
    const markAsRead = useCallback((notificationId) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // 모든 알림 읽음 처리
    const markAllAsRead = useCallback(() => {
        setNotifications(prev =>
            prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
    }, []);

    // 알림 삭제
    const removeNotification = useCallback((notificationId) => {
        setNotifications(prev => {
            const notif = prev.find(n => n.id === notificationId);
            if (notif && !notif.read) {
                setUnreadCount(c => Math.max(0, c - 1));
            }
            return prev.filter(n => n.id !== notificationId);
        });
    }, []);

    // 모든 알림 삭제
    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within NotificationProvider');
    }
    return context;
}
