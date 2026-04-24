import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import logotype from '../../assets/logotype.png';
import { useNotifications } from '../../hooks/useNotifications';

// Definimos los items de navegación aquí para que la Topbar sea autónoma
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
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { unreadCount, notifications, fetchNotifications, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    if (!showNotifications) return;
    fetchNotifications();
  }, [showNotifications, fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    setShowMobileNav(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="relative bg-[#151b3d] border-b border-white/10 px-4 lg:px-8 py-2 flex items-center justify-between sticky top-0 z-30 shadow-lg">
      {/* Lado Izquierdo: Logo y Navegación Principal */}
      <div className="flex items-center gap-8">
        {/* Logo de UN Wheels */}
        <Link to="/dashboard" className="group">
          <img src={logotype} alt="UN Wheels" className="h-12 group-hover:opacity-90 transition-opacity" />
        </Link>

        {/* Navegación Horizontal (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-gray-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Lado Derecho: Notificaciones y Usuario */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-100 hover:bg-white/10 transition-colors"
            aria-label="Notificaciones"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowUserMenu(false);
              setShowMobileNav(false);
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 animate-fade-in z-50 max-h-96 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">Notificaciones</span>
                {unreadCount > 0 && (
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => markAllRead()}
                  >
                    Marcar todo leído
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No tienes notificaciones</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                      onClick={() => { if (!n.read) markRead(n._id); }}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />}
                        <div className={!n.read ? '' : 'pl-4'}>
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
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


        {/* Menú de Usuario */}
        <div className="relative">
          <button
            className="flex items-center gap-2 p-1 rounded-full hover:bg-[#45acab] transition-colors"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowMobileNav(false);
            }}
          >
            <Avatar src={user?.profilePicture} alt={user?.fullName || 'User'} size="sm"  />
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
                  to="/profile"
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
                <NavLink
                  key={`mobile-${item.path}`}
                  to={item.path}
                  onClick={() => setShowMobileNav(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-gray-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}