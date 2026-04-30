'use client';
import { useRouter } from 'next/navigation';
import { AppNotification } from '../../services/notificationsService';
import { NotificationItem } from './NotificationItem';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="h-3 bg-gray-100 rounded-full animate-pulse w-3/4" />
        <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-full" />
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
      <span className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </span>
      <p className="text-sm font-medium text-gray-500">Sin notificaciones</p>
      <p className="text-xs text-gray-400 text-center">Aquí aparecerán tus reservas, rutas y mensajes nuevos</p>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface Props {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkRead:    (id: string) => void;
  onMarkAllRead: () => void;
  onDelete:      (id: string) => void;
  onClose:       () => void;
}

export function NotificationPanel({
  notifications,
  unreadCount,
  isLoading,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClose,
}: Props) {
  const router = useRouter();

  const handleNavigate = (url: string) => {
    router.push(url);
    onClose();
  };

  return (
    <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-[340px]
      rounded-2xl bg-white shadow-panel border border-gray-100/80
      z-50 flex flex-col overflow-hidden animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full
              bg-primary text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
          >
            Marcar todo leído
          </button>
        )}
      </div>

      {/* ── Lista ── */}
      <div className="overflow-y-auto max-h-[360px]">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onNavigate={handleNavigate}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {/* ── Footer ── */}
      {!isLoading && (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
          <button
            onClick={() => { router.push('/notifications'); onClose(); }}
            className="w-full text-[11px] font-medium text-primary hover:text-primary-dark hover:underline transition-colors text-center cursor-pointer"
          >
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
}
