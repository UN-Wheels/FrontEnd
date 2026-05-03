'use client';
import { AppNotification } from '../../services/notificationsService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getNotifUrl(n: AppNotification): string {
  if (n.type === 'CHAT_MESSAGE') {
    const convId = n.data?.conversationId;
    return typeof convId === 'string' && convId ? `/chat/${convId}` : '/chat';
  }
  return '/bookings';
}

export function getRelativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

// ─── Icono por tipo ───────────────────────────────────────────────────────────

const TYPE_META: Record<string, { ringBg: string; iconColor: string; iconKey: string }> = {
  RESERVATION_REQUESTED: { ringBg: 'bg-blue-100',    iconColor: 'text-blue-600',    iconKey: 'bell'    },
  RESERVATION_ACCEPTED:  { ringBg: 'bg-green-100',   iconColor: 'text-green-600',   iconKey: 'check'   },
  RESERVATION_REJECTED:  { ringBg: 'bg-red-100',     iconColor: 'text-red-500',     iconKey: 'xCircle' },
  ROUTE_DELETED:         { ringBg: 'bg-amber-100',   iconColor: 'text-amber-600',   iconKey: 'warning' },
  CHAT_MESSAGE:          { ringBg: 'bg-primary-100', iconColor: 'text-primary',     iconKey: 'chat'    },
};

function TypeIcon({ iconKey, className }: { iconKey: string; className: string }) {
  const p = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 2 };
  switch (iconKey) {
    case 'check':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path {...p} d="M5 13l4 4L19 7" /></svg>;
    case 'xCircle':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path {...p} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'warning':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path {...p} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    case 'chat':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path {...p} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
    default:
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path {...p} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
  }
}

export function NotifTypeIcon({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' }) {
  const meta = TYPE_META[type] ?? { ringBg: 'bg-gray-100', iconColor: 'text-gray-500', iconKey: 'bell' };
  const dim     = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const iconDim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <span className={`${dim} ${meta.ringBg} ${meta.iconColor} rounded-full flex items-center justify-center flex-shrink-0`}>
      <TypeIcon iconKey={meta.iconKey} className={iconDim} />
    </span>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  notification: AppNotification;
  onNavigate: (url: string) => void;
  onMarkRead: (id: string) => void;
  onDelete:   (id: string) => void;
}

export function NotificationItem({ notification: n, onNavigate, onMarkRead, onDelete }: Props) {
  const handleClick = () => {
    if (!n.read) onMarkRead(n._id);
    onNavigate(getNotifUrl(n));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={`group relative flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0
        cursor-pointer transition-colors duration-150 outline-none
        focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
        ${!n.read ? 'bg-primary-50/60 hover:bg-primary-50' : 'bg-white hover:bg-gray-50'}`}
    >
      {/* Borde izquierdo de no leído */}
      {!n.read && (
        <span className="absolute left-0 inset-y-0 w-[3px] rounded-r-full bg-primary" />
      )}

      <NotifTypeIcon type={n.type} />

      <div className="flex-1 min-w-0 pr-5">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[13px] leading-snug truncate ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
            {n.title}
          </p>
          <span className="text-[10px] text-gray-400 flex-shrink-0 tabular-nums">
            {getRelativeTime(n.createdAt)}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate leading-relaxed">{n.body}</p>
      </div>

      {/* Botón eliminar — siempre visible en móvil, hover en desktop */}
      <button
        aria-label="Eliminar notificación"
        className="absolute right-2.5 top-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity
          p-1 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-400 cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onDelete(n._id); }}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
