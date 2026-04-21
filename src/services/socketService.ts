import { io, Socket } from 'socket.io-client';

// ─── Tipos de eventos del chat-service (camelCase) ────────────────────────────

export interface SocketMessageData {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
}

export interface SocketNotificationData {
  type: string;
  conversationId: string;
  messageId: string;
  senderId: string;
  preview: string;
  createdAt: string;
}

export interface SocketMessageStatusData {
  conversationId: string;
  messageId?: string;
  status?: string;
  bulkStatus?: string;
  count?: number;
  userId?: string;
  deliveredAt?: string;
}

type MessageCallback = (data: SocketMessageData) => void;
type NotificationCallback = (data: SocketNotificationData) => void;
type StatusCallback = (data: SocketMessageStatusData) => void;

// ─── URL de Socket.IO ─────────────────────────────────────────────────────────
// En desarrollo, Vite proxea /socket.io → gateway vía vite.config.ts
// En producción, VITE_API_URL apunta al gateway directamente
const SOCKET_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || window.location.origin;

class SocketService {
  private socket: Socket | null = null;
  private messageCallbacks = new Set<MessageCallback>();
  private notificationCallbacks = new Set<NotificationCallback>();
  private statusCallbacks = new Set<StatusCallback>();

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () =>
      console.log('✅ Socket.IO conectado:', this.socket?.id),
    );
    this.socket.on('disconnect', (reason) =>
      console.log('❌ Socket.IO desconectado:', reason),
    );
    this.socket.on('connect_error', (err) =>
      console.error('Socket.IO error de conexión:', err.message),
    );
    this.socket.on('error', (err: { message: string }) =>
      console.error('Socket.IO error:', err.message),
    );

    // Nuevo mensaje en tiempo real (camelCase – chat-service)
    this.socket.on('message:new', (data: SocketMessageData) => {
      this.messageCallbacks.forEach((cb) => cb(data));
    });

    // Notificación de mensaje en otra conversación
    this.socket.on('notification:new', (data: SocketNotificationData) => {
      this.notificationCallbacks.forEach((cb) => cb(data));
    });

    // Cambio de estado (delivered / read)
    this.socket.on('message:status', (data: SocketMessageStatusData) => {
      this.statusCallbacks.forEach((cb) => cb(data));
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.messageCallbacks.clear();
    this.notificationCallbacks.clear();
    this.statusCallbacks.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ── Acciones del cliente ───────────────────────────────────────────────────

  joinConversation(conversationId: string): void {
    this.socket?.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('conversation:leave', { conversationId });
  }

  sendMessage(conversationId: string, content: string): void {
    this.socket?.emit('message:send', { conversationId, content });
  }

  markAsRead(conversationId: string): void {
    this.socket?.emit('message:read', { conversationId });
  }

  // ── Suscripciones (devuelven cleanup) ─────────────────────────────────────

  onNewMessage(cb: MessageCallback): () => void {
    this.messageCallbacks.add(cb);
    return () => this.messageCallbacks.delete(cb);
  }

  onNotification(cb: NotificationCallback): () => void {
    this.notificationCallbacks.add(cb);
    return () => this.notificationCallbacks.delete(cb);
  }

  onMessageStatus(cb: StatusCallback): () => void {
    this.statusCallbacks.add(cb);
    return () => this.statusCallbacks.delete(cb);
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
