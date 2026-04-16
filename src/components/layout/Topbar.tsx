import { useState } from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { mockNotifications } from '../../services/mockData';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-[#151b3d] border-b border-white/10 px-4 lg:px-8 py-2 flex items-center justify-between sticky top-0 z-30 shadow-lg">
      {/* Lado Izquierdo: Logo y Navegación Principal */}
      <div className="flex items-center gap-8">
        {/* Logo de UN Wheels */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
<<<<<<< HEAD
          <span className="text-xl font-bold text-white hidden sm:block"><span className="text-primary">UN</span> Wheels</span>
=======
          <span className="text-xl font-bold text-white hidden sm:block">UN Wheels</span>
>>>>>>> 6c3bc753c6657ba631ffbe3125905755928eabc9
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
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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


        {/* Notificaciones */}
        <div className="relative">
          <button
            className="p-2 rounded-lg hover:bg-[#45acab] transition-colors relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Notificaciones (Igual al anterior) */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? 'bg-primary/5' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Menú de Usuario */}
        <div className="relative">
          <button
            className="flex items-center gap-2 p-1 rounded-full hover:bg-[#45acab] transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
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
                <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
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
    </header>
  );
}