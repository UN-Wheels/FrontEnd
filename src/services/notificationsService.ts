import { io, Socket } from 'socket.io-client';
import { api } from './api';

export interface AppNotification {
  _id: string;
  recipientEmail: string;
  type: 'RESERVATION_REQUESTED' | 'RESERVATION_ACCEPTED' | 'RESERVATION_REJECTED' | 'ROUTE_DELETED';
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

// Socket.IO connects directly to the notifications service (not proxied through gateway)
// because NestJS gateway doesn't proxy WebSocket upgrades.
const NOTIFICATIONS_URL: string =
  (import.meta.env.VITE_NOTIFICATIONS_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:3002' : window.location.origin);

type NotificationCallback = (notification: AppNotification) => void;
type UnreadCallback = (count: number) => void;

class NotificationsSocketService {
  private socket: Socket | null = null;
  private notificationCallbacks = new Set<NotificationCallback>();
  private unreadCallbacks = new Set<UnreadCallback>();

  connect(userEmail: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join', { email: userEmail });
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(NOTIFICATIONS_URL, {
      withCredentials: true,
      namespace: '/notifications',
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.socket?.emit('join', { email: userEmail });
    });

    this.socket.on('notification', (notification: AppNotification) => {
      this.notificationCallbacks.forEach((cb) => cb(notification));
    });

    this.socket.on('unread_count', ({ count }: { count: number }) => {
      this.unreadCallbacks.forEach((cb) => cb(count));
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.notificationCallbacks.clear();
    this.unreadCallbacks.clear();
  }

  onNotification(cb: NotificationCallback): () => void {
    this.notificationCallbacks.add(cb);
    return () => this.notificationCallbacks.delete(cb);
  }

  onUnreadCount(cb: UnreadCallback): () => void {
    this.unreadCallbacks.add(cb);
    return () => this.unreadCallbacks.delete(cb);
  }
}

export const notificationsSocket = new NotificationsSocketService();

// REST API methods (go through the API gateway)
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
