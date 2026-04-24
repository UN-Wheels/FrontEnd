import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  notificationsSocket,
  notificationsApi,
  AppNotification,
} from '../services/notificationsService';

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Connect socket and fetch initial unread count when user is logged in
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;

    notificationsSocket.connect(user.email);

    const offNotification = notificationsSocket.onNotification((n) => {
      setNotifications((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    const offUnread = notificationsSocket.onUnreadCount((count) => {
      setUnreadCount(count);
    });

    // Fetch initial unread count from REST API
    notificationsApi.getUnreadCount()
      .then(({ count }) => setUnreadCount(count))
      .catch(() => {});

    return () => {
      offNotification();
      offUnread();
    };
  }, [isAuthenticated, user?.email]);

  const fetchNotifications = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getAll(page);
      setNotifications(data.notifications);
      setUnreadCount(data.unread);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const was = notifications.find((n) => n._id === id);
    await notificationsApi.deleteOne(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (was && !was.read) setUnreadCount((c) => Math.max(0, c - 1));
  }, [notifications]);

  return {
    unreadCount,
    notifications,
    isLoading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  };
}
