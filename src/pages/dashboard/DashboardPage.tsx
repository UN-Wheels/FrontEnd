import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Button, Avatar, StarRating, Badge } from '../../components/ui';
import { mockRoutes, mockBookings, mockTripHistory } from '../../services/mockData';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const upcomingTrips = mockBookings.filter(b => b.status === 'CONFIRMED').slice(0, 3);
  const recentRoutes = mockRoutes.slice(0, 3);
  const stats = {
    totalTrips: mockTripHistory.length,
    savedMoney: mockTripHistory.length * 5000,
    co2Saved: mockTripHistory.length * 2.5,
    rating: user?.averageRating || 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado de bienvenida */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola de nuevo, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">Esto es lo que está pasando con tus viajes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/search')}>
            Buscar Viaje
          </Button>
          <Button variant="primary" onClick={() => navigate('/publish')}>
            Publicar Ruta
          </Button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary-dark text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Total de Viajes</p>
              <p className="text-3xl font-bold mt-1">{stats.totalTrips}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Dinero Ahorrado</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${stats.savedMoney.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">CO2 Ahorrado</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.co2Saved} kg</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tu Calificación</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold text-gray-900">{stats.rating.toFixed(1)}</span>
                <StarRating rating={stats.rating} size="sm" />
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos viajes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Próximos Viajes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
              Ver todos
            </Button>
          </div>
          
          {upcomingTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No tienes viajes programados</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/search')}>
                Encontrar un viaje
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTrips.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/routes/${booking.route.id}`)}
                >
                  <Avatar
                    src={booking.route.driver.profilePicture}
                    alt={booking.route.driver.fullName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {booking.route.origin} → {booking.route.destination}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {new Date(booking.route.departureTime).toLocaleDateString('es-CO', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge variant="success">Confirmado</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Rutas disponibles */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Rutas Disponibles</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
              Ver todas
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentRoutes.map((route) => (
              <div
                key={route.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => navigate(`/routes/${route.id}`)}
              >
                <Avatar
                  src={route.driver.profilePicture}
                  alt={route.driver.fullName}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {route.origin} → {route.destination}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{route.driver.fullName}</span>
                    <span>•</span>
                    <StarRating rating={route.driver.averageRating} size="sm" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${route.price.toLocaleString('es-CO')}</p>
                  <p className="text-sm text-gray-500">{route.availableSeats} cupos</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardTitle>Acciones Rápidas</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <button
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => navigate('/search')}
          >
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Buscar</span>
          </button>

          <button
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => navigate('/publish')}
          >
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Publicar</span>
          </button>

          <button
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => navigate('/chat')}
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Chat</span>
          </button>

          <button
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => navigate('/profile')}
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Perfil</span>
          </button>
        </div>
      </Card>
    </div>
  );
}