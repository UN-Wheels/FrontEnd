'use client';
import { useRouter } from 'next/navigation';
import { Loading } from '../../components/ui';
import { useNotifications } from '../../context/NotificationsContext';
import { AppNotification } from '../../services/notificationsService';

// ─── Helpers (misma lógica que Topbar) ───────────────────────────────────────

function getNotifUrl(n: AppNotification): string {
  if (n.type === 'CHAT_MESSAGE') {
    const convId = n.data?.conversationId;
    return typeof convId === 'string' && convId ? `/chat/${convId}` : '/chat';
  }
  return '/bookings';
}

const TYPE_LABEL: Record<string, string> = {
  RESERVATION_REQUESTED: 'Nueva solicitud de reserva',
  RESERVATION_ACCEPTED:  'Reserva aceptada',
  RESERVATION_REJECTED:  'Reserva rechazada',
  ROUTE_DELETED:         'Ruta cancelada',
  CHAT_MESSAGE:          'Mensaje de chat',
};

function NotifIcon({ type }: { type: string }) {
  const base = 'w-5 h-5 flex-shrink-0';
  switch (type) {
    case 'RESERVATION_REQUESTED':
      return (
        <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-blue-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </span>
      );
    case 'RESERVATION_ACCEPTED':
      return (
        <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-green-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      );
    case 'RESERVATION_REJECTED':
      return (
        <span className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      );
    case 'ROUTE_DELETED':
      return (
        <span className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-yellow-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </span>
      );
    case 'CHAT_MESSAGE':
      return (
        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-primary`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </span>
      );
    default:
      return (
        <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-gray-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </span>
      );
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n => n.read);

  const handleClick = (n: AppNotification) => {
    if (!n.read) markRead(n._id);
    router.push(getNotifUrl(n));
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading size="lg" message="Cargando notificaciones..." />
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (notifications.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          <p className="text-gray-200 mt-0.5">Estás al día con todo</p>
        </div>
        <div className="rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Sin notificaciones</h3>
          <p className="text-gray-300 text-sm max-w-xs">
            Te avisaremos aquí cuando haya novedades en tus rutas o reservas.
          </p>
        </div>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          <p className="text-gray-200 mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} sin leer`
              : 'Todo leído'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="text-sm text-blue-300 hover:text-blue-200 hover:underline transition-colors"
            >
              Marcar todo leído
            </button>
          )}
          <button
            onClick={() => fetchNotifications()}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-300 hover:bg-white/10 transition-colors"
            aria-label="Actualizar notificaciones"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sin leer */}
      {unread.length > 0 && (
        <section className="rounded-2xl border border-white/15 bg-[#0b1232]/65 backdrop-blur-sm p-4 md:p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Sin leer · {unread.length}
          </p>
          <div className="space-y-2">
            {unread.map(n => (
              <NotifRow
                key={n._id}
                n={n}
                onClick={() => handleClick(n)}
                onDelete={() => deleteNotification(n._id)}
                onMarkRead={() => markRead(n._id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Leídas */}
      {read.length > 0 && (
        <section className="rounded-2xl border border-white/15 bg-[#0b1232]/65 backdrop-blur-sm p-4 md:p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Anteriores · {read.length}
          </p>
          <div className="space-y-2">
            {read.map(n => (
              <NotifRow
                key={n._id}
                n={n}
                onClick={() => handleClick(n)}
                onDelete={() => deleteNotification(n._id)}
                onMarkRead={() => markRead(n._id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Fila de notificación ─────────────────────────────────────────────────────

function NotifRow({
  n,
  onClick,
  onDelete,
  onMarkRead,
}: {
  n: AppNotification;
  onClick: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
}) {
  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
        !n.read
          ? 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15'
          : 'border-white/10 bg-white/5 hover:bg-white/10'
      }`}
    >
      {/* Ícono — clicable */}
      <button className="mt-0.5" onClick={onClick}>
        <NotifIcon type={n.type} />
      </button>

      {/* Contenido — clicable */}
      <button className="flex-1 min-w-0 text-left" onClick={onClick}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-white' : 'text-gray-200'}`}>
              {n.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
          </div>
          {!n.read && (
            <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-blue-400" />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] text-gray-500">
            {new Date(n.createdAt).toLocaleDateString('es-CO', {
              day: 'numeric', month: 'short',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
          <span className="text-[10px] text-gray-600">
            {TYPE_LABEL[n.type] ?? n.type}
          </span>
        </div>
      </button>

      {/* Acciones — visibles al hover */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!n.read && (
          <button
            aria-label="Marcar como leída"
            onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-300 hover:bg-white/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        <button
          aria-label="Eliminar notificación"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
