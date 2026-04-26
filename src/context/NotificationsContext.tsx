'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import {
  notificationsSocket,
  notificationsApi,
  AppNotification,
} from '../services/notificationsService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNotifUrl(n: AppNotification): string {
  if (n.type === 'CHAT_MESSAGE') {
    const convId = n.data?.conversationId;
    return typeof convId === 'string' && convId ? `/chat/${convId}` : '/chat';
  }
  return '/bookings';
}

function getNotifIcon(type: string) {
  const base = 'w-5 h-5 flex-shrink-0';
  switch (type) {
    case 'RESERVATION_REQUESTED':
      return (
        <svg className={`${base} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case 'RESERVATION_ACCEPTED':
      return (
        <svg className={`${base} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'RESERVATION_REJECTED':
      return (
        <svg className={`${base} text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'ROUTE_DELETED':
      return (
        <svg className={`${base} text-yellow-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'CHAT_MESSAGE':
      return (
        <svg className={`${base} text-primary`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    default:
      return (
        <svg className={`${base} text-gray-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface NotificationsContextValue {
  unreadCount: number;
  notifications: AppNotification[];
  isLoading: boolean;
  /** Última notificación recibida por socket — útil para que otras vistas refresquen datos */
  lastNotification: AppNotification | null;
  fetchNotifications: (page?: number) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  /** Llama esto cuando el usuario abre/cierra una conversación de chat */
  setActiveConversationId: (id: string | null) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastNotification, setLastNotification] = useState<AppNotification | null>(null);

  // Ref mutable: no causa re-renders y siempre tiene el valor actual
  const activeConversationId = useRef<string | null>(null);

  const setActiveConversationId = useCallback((id: string | null) => {
    activeConversationId.current = id;
  }, []);

  // ── Conexión socket ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;

    notificationsSocket.connect(user.email);

    const offNotif = notificationsSocket.onNotification((n) => {
      setNotifications((prev) => {
        if (prev.some((x) => x._id === n._id)) return prev;
        return [n, ...prev];
      });

      // Exponer para que otros componentes reaccionen (BookingsPage, etc.)
      setLastNotification(n);

      // No mostrar toast si el usuario ya está viendo esa conversación
      const isChatInFocus =
        n.type === 'CHAT_MESSAGE' &&
        n.data?.conversationId === activeConversationId.current;

      if (!isChatInFocus) {
        setUnreadCount((c) => c + 1);

        const url = getNotifUrl(n);
        toast(n.title, {
          description: n.body,
          icon: getNotifIcon(n.type),
          duration: 6000,
          action: {
            label: 'Ver',
            onClick: () => router.push(url),
          },
        });
      }
    });

    const offUnread = notificationsSocket.onUnreadCount((count) => {
      setUnreadCount(count);
    });

    // Cargar conteo inicial por REST
    notificationsApi
      .getUnreadCount()
      .then(({ count }) => setUnreadCount(count))
      .catch(() => {});

    return () => {
      offNotif();
      offUnread();
      notificationsSocket.disconnect();
    };
  }, [isAuthenticated, user?.email]);

  // ── Acciones ───────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getAll(page);
      setNotifications(data.notifications);
      setUnreadCount(data.unread);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  const deleteNotification = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n._id === id);
      try {
        await notificationsApi.deleteOne(id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    },
    [notifications],
  );

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        notifications,
        isLoading,
        lastNotification,
        fetchNotifications,
        markRead,
        markAllRead,
        deleteNotification,
        setActiveConversationId,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}
