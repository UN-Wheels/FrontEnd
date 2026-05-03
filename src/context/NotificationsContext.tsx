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
import { NotifTypeIcon, getNotifUrl } from '../components/notifications/NotificationItem';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateBody(text: string, max = 58): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
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
          description: truncateBody(n.body),
          icon: <NotifTypeIcon type={n.type} size="sm" />,
          duration: 5000,
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
