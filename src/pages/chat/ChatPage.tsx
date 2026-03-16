import { useState, useEffect, useRef } from 'react';
import { Avatar, Button, Loading, EmptyState } from '../../components/ui';
import { mockService } from '../../services/mockData';
import { Conversation, Message } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const data = await mockService.getConversations();
        setConversations(data);
        if (data.length > 0) {
          setSelectedConversation(data[0]);
        }
      } catch (error) {
        console.error('Error al obtener conversaciones:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      try {
        const data = await mockService.getMessages(selectedConversation.id);
        setMessages(data);
      } catch (error) {
        console.error('Error al obtener mensajes:', error);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const otherParticipant = selectedConversation.participants.find(p => p.id !== user.id);
    if (!otherParticipant) return;

    setIsSending(true);
    try {
      const sentMessage = await mockService.sendMessage(
        selectedConversation.id,
        newMessage,
        user.id,
        otherParticipant.id
      );
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id) || conversation.participants[0];
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loading size="lg" message="Cargando chats..." />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          title="No tienes mensajes aún"
          description="Reserva un viaje para comenzar a chatear. Podrás hablar con los conductores una vez que tengas una reserva confirmada."
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-180px)] flex rounded-xl overflow-hidden bg-white shadow-soft animate-fade-in">
      {/* Lista de conversaciones */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-100 bg-white">
          <h2 className="font-semibold text-gray-900">Mensajes</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            const isSelected = selectedConversation?.id === conversation.id;

            return (
              <button
                key={conversation.id}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left ${
                  isSelected ? 'bg-primary/5 border-l-4 border-primary' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="relative">
                  <Avatar
                    src={otherUser.profilePicture}
                    alt={otherUser.fullName}
                    size="md"
                  />
                  {conversation.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 truncate">{otherUser.fullName}</p>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {formatTime(conversation.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage.senderId === user?.id ? 'Tú: ' : ''}
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Área del Chat */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Cabecera del chat */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white">
            <Avatar
              src={getOtherParticipant(selectedConversation).profilePicture}
              alt={getOtherParticipant(selectedConversation).fullName}
              size="md"
            />
            <div>
              <p className="font-semibold text-gray-900">
                {getOtherParticipant(selectedConversation).fullName}
              </p>
              <p className="text-sm text-gray-500">
                {getOtherParticipant(selectedConversation).university}
              </p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === user?.id;
              const showDate =
                index === 0 ||
                formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-white/70' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Entrada de mensaje */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Adjuntar archivo"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button
                type="submit"
                variant="primary"
                className="rounded-full w-10 h-10 p-0"
                disabled={!newMessage.trim() || isSending}
              >
                {isSending ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Selecciona una conversación para empezar a chatear</p>
        </div>
      )}
    </div>
  );
}
