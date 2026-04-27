'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { AppNotification } from '../../services/notificationsService';
import { Avatar } from '../ui/Avatar';
import logotype from '../../assets/logotype.png';

function getNotifUrl(n: AppNotification): string {
  if (n.type === 'CHAT_MESSAGE') {
    const convId = n.data?.conversationId;
    return typeof convId === 'string' && convId ? `/chat/${convId}` : '/chat';
  }
  return '/bookings';
}

function NotifIcon({ type }: { type: string }) {
  const base = 'w-4 h-4 flex-shrink-0';
  switch (type) {
    case 'RESERVATION_REQUESTED':
      return (
        <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-blue-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </span>
      );
    case 'RESERVATION_ACCEPTED':
      return (
        <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-green-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      );
    case 'RESERVATION_REJECTED':
      return (
        <span className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-red-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      );
    case 'ROUTE_DELETED':
      return (
        <span className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-yellow-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </span>
      );
    case 'CHAT_MESSAGE':
      return (
        <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-primary`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </span>
      );
    default:
      return (
        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg className={`${base} text-gray-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </span>
      );
  }
}

const navItems = [
  {
    path: '/dashboard',
    label: 'Inicio',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/search',
    label: 'Buscar Rutas',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    path: '/publish',
    label: 'Publicar Rutas',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    path: '/bookings',
    label: 'Mis Viajes',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    path: '/chat',
    label: 'Chat',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const {
    unreadCount,
    notifications,
    isLoading: notifLoading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  // Cargar lista cuando se abre el panel
  useEffect(() => {
    if (showNotifPanel) fetchNotifications();
  }, [showNotifPanel, fetchNotifications]);

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    }
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    setShowMobileNav(false);
    logout();
    router.push('/login');
  };

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  return (
    <header className="relative bg-[#151b3d] border-b border-white/10 px-4 lg:px-8 py-2 flex items-center justify-between sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="group">
          <img src={logotype.src} alt="UN Wheels" className="h-12 group-hover:opacity-90 transition-opacity" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-primary/15 text-primary'
                  : 'text-gray-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* ── Campana de notificaciones ── */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-100 hover:bg-white/10 transition-colors"
            onClick={() => {
              setShowNotifPanel((p) => !p);
              setShowUserMenu(false);
              setShowMobileNav(false);
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifPanel && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden animate-fade-in">

              {/* Flecha indicadora */}
              <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45 z-10" />

              {/* Header del panel */}
              <div className="relative flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white z-20">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    Marcar todo leído
                  </button>
                )}
              </div>

              {/* Lista */}
              <div className="overflow-y-auto max-h-80 divide-y divide-gray-50">
                {notifLoading ? (
                  /* Estado de carga con spinner */
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <svg className="w-6 h-6 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-400">Cargando notificaciones…</p>
                  </div>
                ) : notifications.length === 0 ? (
                  /* Estado vacío con ícono */
                  <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">Sin notificaciones</p>
                      <p className="text-xs text-gray-400 mt-0.5">Te avisaremos cuando haya novedades</p>
                    </div>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`group flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-gray-50 ${!n.read ? 'bg-blue-50/60' : 'bg-white'}`}
                    >
                      {/* Zona clicable principal → navega */}
                      <button
                        className="flex items-start gap-2.5 flex-1 min-w-0 text-left"
                        onClick={() => {
                          if (!n.read) markRead(n._id);
                          router.push(getNotifUrl(n));
                          setShowNotifPanel(false);
                        }}
                      >
                        <NotifIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleDateString('es-CO', {
                              day: 'numeric', month: 'short',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {!n.read && (
                          <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </button>

                      {/* Botón eliminar — visible al hover */}
                      <button
                        aria-label="Eliminar notificación"
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer — solo cuando hay notificaciones — eliminar si no se va a hacer pagina de notificaciones  */}
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50">
                  <button
                      onClick={() => setShowNotifPanel(false)}
                      className="w-full text-xs text-center text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium"
                  >
                  Ver todas las notificaciones
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-100 hover:bg-white/10 transition-colors"
          aria-label="Abrir navegación"
          onClick={() => {
            setShowMobileNav((prev) => !prev);
            setShowUserMenu(false);
          }}
        >
          {showMobileNav ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <div className="relative">
          <button
            className="flex items-center gap-2 p-1 rounded-full hover:bg-[#45acab] transition-colors"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowMobileNav(false);
            }}
          >
            <Avatar src={user?.profilePicture} alt={user?.fullName || 'User'} size="sm" />
            <svg className="w-4 h-4 text-gray-200 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  Perfil
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showMobileNav && (
        <div className="lg:hidden absolute left-4 right-4 top-full mt-2 z-40 animate-fade-in">
          <div className="rounded-2xl border border-white/10 bg-[#151b3d] shadow-2xl p-2">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={`mobile-${item.path}`}
                  href={item.path}
                  onClick={() => setShowMobileNav(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary/15 text-primary'
                      : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
