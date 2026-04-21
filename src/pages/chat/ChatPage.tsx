import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loading, EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import {
  chatService,
  RouteConversationSummary,
} from '../../services/chatService';
import {
  socketService,
  SocketMessageData,
  SocketMessageStatusData,
} from '../../services/socketService';
import { routesService } from '../../services/routesService';

// ─── Íconos inline ────────────────────────────────────────────────────────────

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const CheckIcon = ({ double = false }: { double?: boolean }) => (
  double ? (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 13l4 4L19 7M1 13l4 4" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
}



// ─── Tipos locales ─────────────────────────────────────────────────────────────

interface LocalMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ChatPage() {
  const { conversationId: paramId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // userId = email (mismo que usa el chat-service en JWT sub)
  const userId = user?.email ?? '';

  // ── Estado ────────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<RouteConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(paramId ?? null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [routeLabel, setRouteLabel] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevConvRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());

  // ── Cargar conversaciones ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await chatService.getUserConversations(userId);
      setConversations(data);
      // Fetchear nombres reales de los otros participantes
      const emails = [...new Set(data.map(c => c.otherUserId))];
      const results = await Promise.all(
        emails.map(async (email) => {
          try {
            const res = await fetch(`/api/auth/users/${encodeURIComponent(email)}`);
            if (!res.ok) return [email, null] as const;
            const u = await res.json();
            return [email, u.name ?? null] as const;
          } catch {
            return [email, null] as const;
          }
        })
      );
      setUserNames(new Map(results.filter(([, name]) => name !== null) as [string, string][]));
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
    }
  }, [userId]);

  useEffect(() => {
    const init = async () => {
      setLoadingConvs(true);
      await loadConversations();
      setLoadingConvs(false);
    };
    init();
  }, [loadConversations]);

  // Sync selectedId con URL param
  useEffect(() => {
    if (paramId) setSelectedId(paramId);
  }, [paramId]);

  // ── Socket.IO ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const socket = socketService.connect();
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setIsConnected(socket.connected);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [userId]);

  // Listener: nuevos mensajes
  useEffect(() => {
    const cleanup = socketService.onNewMessage((data: SocketMessageData) => {
      if (data.conversationId !== prevConvRef.current) {
        loadConversations();
        return;
      }

      setMessages((prev) => {
        const isDup = prev.some(
          (m) =>
            m.id === data.messageId ||
            (m.id.startsWith('temp-') &&
              m.content === data.content &&
              m.senderId === data.senderId),
        );
        if (isDup) {
          return prev.map((m) =>
            m.id.startsWith('temp-') &&
            m.content === data.content &&
            m.senderId === data.senderId
              ? { ...m, id: data.messageId, timestamp: data.createdAt, status: data.status }
              : m,
          );
        }
        const newMsg: LocalMessage = {
          id: data.messageId,
          senderId: data.senderId,
          content: data.content,
          timestamp: data.createdAt,
          status: data.status,
        };
        return [...prev, newMsg];
      });

      // Marcar como leído si es del otro
      if (data.senderId !== userId && prevConvRef.current) {
        socketService.markAsRead(prevConvRef.current);
      }

      loadConversations();
    });
    return cleanup;
  }, [userId, loadConversations]);

  // Listener: cambio de estado (read/delivered)
  useEffect(() => {
    const cleanup = socketService.onMessageStatus((data: SocketMessageStatusData) => {
      if (data.conversationId !== prevConvRef.current) return;
      if (data.bulkStatus === 'READ') {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === userId ? { ...m, status: 'READ' } : m,
          ),
        );
      } else if (data.bulkStatus === 'DELIVERED') {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === userId && m.status === 'SENT'
              ? { ...m, status: 'DELIVERED' }
              : m,
          ),
        );
      } else if (data.messageId && data.status) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, status: data.status as LocalMessage['status'] }
              : m,
          ),
        );
      }
    });
    return cleanup;
  }, [userId]);

  // Listener: notificaciones de otras conversaciones
  useEffect(() => {
    const cleanup = socketService.onNotification((data) => {
      if (data.type === 'chat_message') loadConversations();
    });
    return cleanup;
  }, [loadConversations]);

  // ── Cargar mensajes al seleccionar conversación ──────────────────────────
  useEffect(() => {
    if (!selectedId || !userId) {
      if (prevConvRef.current) {
        socketService.leaveConversation(prevConvRef.current);
        prevConvRef.current = null;
      }
      setMessages([]);
      setRouteLabel('');
      return;
    }

    if (prevConvRef.current === selectedId) return;
    if (isLoadingRef.current) return;

    const load = async () => {
      isLoadingRef.current = true;

      if (prevConvRef.current) {
        socketService.leaveConversation(prevConvRef.current);
      }
      prevConvRef.current = selectedId;

      setLoadingMsgs(true);
      setMessages([]);

      try {
        const paged = await chatService.getMessages(selectedId);
        // El repositorio ya devuelve items en orden ASC (cronológico)
        const items: LocalMessage[] = paged.items.map((m) => ({
          id: m._id,
          senderId: m.senderId,
          content: m.content,
          timestamp: m.createdAt,
          status: m.status,
        }));
        setMessages(items);

        // Unirse al room
        socketService.joinConversation(selectedId);

        // Marcar como leído si hay mensajes del otro sin leer
        const hasUnread = items.some(
          (m) => m.senderId !== userId && m.status !== 'READ',
        );
        if (hasUnread) {
          socketService.markAsRead(selectedId);
          chatService.markAsRead(selectedId).catch(() => {});
        }

        // Obtener info de la ruta para mostrar en header
        const conv = conversations.find((c) => c.conversationId === selectedId);
        if (conv?.routeId) {
          routesService
            .getRouteById(conv.routeId)
            .then((r) => {
              const orig = r.origin.address.split(',')[0];
              const dest = r.destination.address.split(',')[0];
              setRouteLabel(`${orig} → ${dest}`);
            })
            .catch(() => setRouteLabel(''));
        }
      } catch (err) {
        console.error('Error cargando mensajes:', err);
      } finally {
        setLoadingMsgs(false);
        isLoadingRef.current = false;
      }
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, userId]);

  // ── Scroll automático ────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const c = containerRef.current;
    if (!c) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    try {
      c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' });
    } catch {
      c.scrollTop = c.scrollHeight;
    }
  }, [messages]);

  // Al entrar/cambiar de conversación, asegúrate de arrancar en el último mensaje.
  useEffect(() => {
    if (!selectedId || loadingMsgs) return;
    const c = containerRef.current;
    if (!c) return;

    const raf = requestAnimationFrame(() => {
      c.scrollTop = c.scrollHeight;
    });

    return () => cancelAnimationFrame(raf);
  }, [selectedId, loadingMsgs]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (prevConvRef.current) {
        socketService.leaveConversation(prevConvRef.current);
      }
    };
  }, []);

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !selectedId || !userId || sending) return;
    if (content.length > 2000) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: LocalMessage = {
      id: tempId,
      senderId: userId,
      content,
      timestamp: new Date().toISOString(),
      status: 'SENT',
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setSending(true);

    try {
      if (socketService.isConnected()) {
        const ack = await socketService.sendMessage(selectedId, content);

        if (!ack.success || !ack.message) {
          throw new Error(ack.error || 'No se pudo enviar mensaje por socket');
        }

        // Reemplazar optimista por el mensaje confirmado; el evento message:new
        // puede llegar después y no duplicará por id.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: ack.message!.messageId,
                  timestamp: ack.message!.createdAt,
                  status: ack.message!.status,
                }
              : m,
          ),
        );
      } else {
        // Fallback HTTP cuando no hay conexión en tiempo real.
        const result = await chatService.sendMessage(selectedId, content);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: result.messageId,
                  timestamp: result.createdAt,
                  status: result.status as LocalMessage['status'],
                }
              : m,
          ),
        );
      }
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (err) {
      console.error('Error al enviar:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // ── Seleccionar conversación ──────────────────────────────────────────────
  const handleSelectConv = (id: string) => {
    navigate(`/chat/${id}`);
    setSelectedId(id);
  };

  const handleBack = () => {
    navigate('/chat');
    setSelectedId(null);
    setMessages([]);
    setRouteLabel('');
  };

  // ── Datos derivados ───────────────────────────────────────────────────────
  const filtered = conversations.filter((c) => {
    const name = userNames.get(c.otherUserId) ?? c.otherUserId.split('@')[0];
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.otherUserId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const selectedConv = conversations.find((c) => c.conversationId === selectedId) ?? null;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingConvs) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loading size="lg" message="Cargando mensajes..." />
      </div>
    );
  }

  if (!loadingConvs && conversations.length === 0) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <EmptyState
          icon={<ChatBubbleIcon />}
          title="Sin conversaciones"
          description="Contacta al conductor de una ruta para iniciar un chat."
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-6.5rem)] md:h-[calc(100vh-180px)] min-h-[420px] w-full flex rounded-none md:rounded-xl overflow-hidden bg-white shadow-soft animate-fade-in">
      {/* ── Panel izquierdo: lista de conversaciones ─────────────────────── */}
      <div
        className={`w-full md:w-[22rem] border-r border-gray-100 flex flex-col bg-gray-50 flex-shrink-0 ${
          selectedId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header lista */}
        <div className="px-3 sm:px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Mensajes</h2>
            {isConnected && (
              <span
                className="w-2 h-2 rounded-full bg-green-500"
                title="Conectado en tiempo real"
              />
            )}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar conversación..."
            className="w-full px-3 py-2 text-base md:text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => {
            const isSelected = conv.conversationId === selectedId;
            const name = userNames.get(conv.otherUserId) ?? conv.otherUserId.split('@')[0];
            const sub = conv.otherUserId;
            const time = conv.lastMessageAt ? formatTime(conv.lastMessageAt) : '';
            const avatarLetter = name[0]?.toUpperCase() ?? '?';

            return (
              <button
                key={conv.conversationId}
                onClick={() => handleSelectConv(conv.conversationId)}
                className={`w-full px-3 sm:px-4 py-3.5 sm:py-3 flex items-start gap-3 text-left transition-colors border-b border-gray-100 hover:bg-gray-100 ${
                  isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                  {avatarLetter}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 truncate text-sm">{name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                      {time && (
                        <span className="text-xs text-gray-400">{time}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{sub}</p>
                  {conv.lastMessageText && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {conv.lastMessageText}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Panel derecho: área de chat ──────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col ${
          selectedId ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedConv || selectedId ? (
          <>
            {/* Header del chat */}
            <div className="px-3 sm:px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3">
              <button
                onClick={handleBack}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                aria-label="Volver"
              >
                <ArrowLeftIcon />
              </button>

              {(() => {
                const headerName = selectedConv
                  ? (userNames.get(selectedConv.otherUserId) ?? selectedConv.otherUserId.split('@')[0])
                  : '?';
                return (
                  <>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {headerName[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{selectedConv ? headerName : 'Chat'}</p>
                      {routeLabel ? (
                        <p className="text-xs text-gray-500 truncate">{routeLabel}</p>
                      ) : selectedConv ? (
                        <p className="text-xs text-gray-400 truncate">{selectedConv.otherUserId}</p>
                      ) : null}
                    </div>
                  </>
                );
              })()}

              {isConnected && (
                <span
                  className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
                  title="En línea"
                />
              )}
            </div>

            {/* Mensajes */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-3 sm:py-4 space-y-2.5 sm:space-y-3 bg-gray-50 overscroll-contain"
            >
              {loadingMsgs ? (
                <div className="flex justify-center items-center h-full">
                  <Loading size="md" message="Cargando mensajes..." />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-sm text-gray-400">
                    Sin mensajes aún. ¡Empieza la conversación!
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isOwn = msg.senderId === userId;
                    const showDate =
                      idx === 0 ||
                      formatDate(messages[idx - 1].timestamp) !==
                        formatDate(msg.timestamp);

                    return (
                      <div key={msg.id} className="w-full">
                        {showDate && (
                          <div className="text-center my-3">
                            <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">
                              {formatDate(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`min-w-0 max-w-[calc(100%-1.75rem)] sm:max-w-[78%] lg:max-w-[70%] px-3 sm:px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'ml-auto bg-primary text-white rounded-br-md'
                                : 'mr-auto bg-white text-gray-900 rounded-bl-md shadow-sm'
                            }`}
                          >
                            <p className="text-[13px] sm:text-sm break-words whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <div
                              className={`flex items-center justify-end gap-1 mt-0.5 ${
                                isOwn ? 'text-white/70' : 'text-gray-400'
                              }`}
                            >
                              <span className="text-xs">
                                {formatTime(msg.timestamp)}
                              </span>
                              {isOwn && (
                                <span title={msg.status === 'READ' ? 'Leído' : 'Entregado'}>
                                  <CheckIcon double={msg.status !== 'SENT'} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input de mensaje */}
            <form
              onSubmit={handleSend}
              className="px-2.5 sm:px-4 pt-2.5 sm:pt-3 border-t border-gray-100 bg-white"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  maxLength={2000}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 text-base sm:text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  aria-label="Enviar"
                >
                  {sending ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Estado vacío - desktop */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ChatBubbleIcon />
            </div>
            <h3 className="font-semibold text-gray-900">Selecciona una conversación</h3>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              Elige un chat de la lista o contacta al conductor de una ruta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
