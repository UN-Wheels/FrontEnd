import { io, Socket } from 'socket.io-client';
import { api } from './api';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'RESERVATION_REQUESTED'
  | 'RESERVATION_ACCEPTED'
  | 'RESERVATION_REJECTED'
  | 'ROUTE_DELETED'
  | 'CHAT_MESSAGE';

export interface AppNotification {
  _id: string;
  recipientEmail: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface NotificationsPage {
  notifications: AppNotification[];
  total: number;
  unread: number;
}

// ─── Socket.IO ───────────────────────────────────────────────────────────────
// El WebSocket de notificaciones pasa por el API Gateway (igual que el resto).
// Gateway escucha en /api/notifications/socket.io y lo proxea al
// notifications-service eliminando el prefijo /api/notifications.
// El namespace /notifications es negociado dentro del protocolo Socket.IO.

function getGatewayUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:8080';
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
}

type NotificationCb = (n: AppNotification) => void;
type UnreadCb = (count: number) => void;

class NotificationsSocketService {
  private socket: Socket | null = null;
  private notificationCbs = new Set<NotificationCb>();
  private unreadCbs = new Set<UnreadCb>();
  private authFailed = false;

  connect(userEmail: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join', { email: userEmail });
      return;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.authFailed = false;

    // Conecta al namespace /notifications en el gateway.
    // El gateway proxea /api/notifications/socket.io → /socket.io en el servicio.
    this.socket = io(`${getGatewayUrl()}/notifications`, {
      withCredentials: true,
      path: '/api/notifications/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.authFailed = false;
      this.socket?.emit('join', { email: userEmail });
    });

    this.socket.on('disconnect', (reason) => {
      // Si el servidor fuerza el disconnect y no fue por auth, reconectar.
      // Si fue auth failure, no reconectar para evitar el loop infinito.
      if (reason === 'io server disconnect' && !this.authFailed) {
        setTimeout(() => this.socket?.connect(), 3000);
      }
    });

    this.socket.on('error', (err: { message: string }) => {
      if (err.message === 'Autenticacion fallida') {
        this.authFailed = true;
      }
    });

    this.socket.on('notification', (n: AppNotification) => {
      this.notificationCbs.forEach((cb) => cb(n));
    });

    this.socket.on('unread_count', ({ count }: { count: number }) => {
      this.unreadCbs.forEach((cb) => cb(count));
    });

    this.socket.on('connect_error', (err) =>
      console.warn('[Notifications] Socket error:', err.message),
    );
  }

  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.notificationCbs.clear();
    this.unreadCbs.clear();
  }

  onNotification(cb: NotificationCb): () => void {
    this.notificationCbs.add(cb);
    return () => this.notificationCbs.delete(cb);
  }

  onUnreadCount(cb: UnreadCb): () => void {
    this.unreadCbs.add(cb);
    return () => this.unreadCbs.delete(cb);
  }
}

export const notificationsSocket = new NotificationsSocketService();

// ─── REST API (a través del gateway) ─────────────────────────────────────────

export const notificationsApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<NotificationsPage>(`/notifications?page=${page}&limit=${limit}`),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread'),

  markRead: (id: string) =>
    api.patch<AppNotification>(`/notifications/${id}/read`, {}),

  markAllRead: () =>
    api.patch<void>('/notifications/read-all', {}),

  deleteOne: (id: string) =>
    api.delete<void>(`/notifications/${id}`),
};
