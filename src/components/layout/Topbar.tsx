'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Avatar } from '../ui/Avatar';
import { NotificationPanel } from '../notifications/NotificationPanel';
import logotype from '../../assets/logotype.png';

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  {
    path: '/dashboard',
    label: 'Inicio',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/search',
    label: 'Buscar Rutas',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    path: '/publish',
    label: 'Publicar',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    path: '/bookings',
    label: 'Mis Viajes',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    path: '/chat',
    label: 'Chat',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [showMobileNav,  setShowMobileNav]  = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  const {
    unreadCount,
    notifications,
    isLoading: notifLoading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  // Cargar notificaciones al abrir el panel
  useEffect(() => {
    if (showNotifPanel) fetchNotifications();
  }, [showNotifPanel, fetchNotifications]);

  // Cerrar paneles al hacer clic fuera
  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifPanel(false);
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setShowUserMenu(false);
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
    <header className="sticky top-0 z-30 bg-secondary border-b border-white/10 px-4 lg:px-8 py-0 flex items-center justify-between shadow-lg h-14">

      {/* ── Logo + Nav ── */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="group flex-shrink-0">
          <img src={logotype.src} alt="UN Wheels" className="h-9 group-hover:opacity-90 transition-opacity" />
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive(item.path)
                  ? 'bg-primary/20 text-primary-light'
                  : 'text-white/60 hover:bg-white/8 hover:text-white/90'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Acciones derecha ── */}
      <div className="flex items-center gap-1.5">

        {/* Campana */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            aria-label="Notificaciones"
            onClick={() => {
              setShowNotifPanel((p) => !p);
              setShowUserMenu(false);
              setShowMobileNav(false);
            }}
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg
              text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center
                min-w-[17px] h-[17px] px-1 rounded-full bg-primary text-white text-[9px] font-bold leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifPanel && (
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              isLoading={notifLoading}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onDelete={deleteNotification}
              onClose={() => setShowNotifPanel(false)}
            />
          )}
        </div>

        {/* Botón menú mobile */}
        <button
          type="button"
          aria-label="Abrir navegación"
          onClick={() => {
            setShowMobileNav((p) => !p);
            setShowUserMenu(false);
          }}
          className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg
            text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer"
        >
          {showMobileNav ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Avatar + menú usuario */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => {
              setShowUserMenu((p) => !p);
              setShowMobileNav(false);
            }}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg
              hover:bg-white/10 transition-all duration-150 cursor-pointer"
          >
            <Avatar src={user?.profilePicture} alt={user?.fullName || 'User'} size="sm" />
            <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-panel border border-gray-100 py-1.5 animate-fade-in z-50">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Mi perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Nav mobile ── */}
      {showMobileNav && (
        <div className="lg:hidden absolute left-3 right-3 top-[calc(100%+6px)] z-40 animate-fade-in">
          <div className="rounded-2xl border border-white/10 bg-secondary shadow-2xl p-2">
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={`mob-${item.path}`}
                  href={item.path}
                  onClick={() => setShowMobileNav(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary/20 text-primary-light'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
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
