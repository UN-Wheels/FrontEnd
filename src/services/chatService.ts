import { api } from './api';

// ─── Tipos del chat-service ────────────────────────────────────────────────────

export interface RouteConversationSummary {
  conversationId: string;
  routeId: string;
  otherUserId: string;
  otherUserRole: 'driver' | 'passenger';
  bookingId: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  updatedAt: string;
}

export interface RouteMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedMessages {
  items: RouteMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateConversationResult {
  conversation: {
    _id: string;
    routeId: string;
    driverId: string;
    passengerId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  created: boolean;
}

export interface SendMessageResult {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: string;
  createdAt: string;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

const BASE = '/chat/conversations';

export const chatService = {
  async createConversation(
    routeId: string,
    driverId: string,
    passengerId: string,
  ): Promise<CreateConversationResult> {
    return api.post<CreateConversationResult>(BASE, { routeId, driverId, passengerId });
  },

  async getUserConversations(userId: string): Promise<RouteConversationSummary[]> {
    return api.get<RouteConversationSummary[]>(`${BASE}/user/${userId}`);
  },

  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedMessages> {
    return api.get<PaginatedMessages>(`${BASE}/${conversationId}/messages`, {
      params: { page: String(page), limit: String(limit) },
    });
  },

  async sendMessage(conversationId: string, content: string): Promise<SendMessageResult> {
    return api.post<SendMessageResult>(`${BASE}/${conversationId}/messages`, { content });
  },

  async markAsRead(conversationId: string): Promise<void> {
    return api.patch<void>(`${BASE}/${conversationId}/read`);
  },
};
