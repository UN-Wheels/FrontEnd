import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Button, Avatar, Badge } from '../../components/ui';
import { mockRoutes, mockBookings } from '../../services/mockData';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const upcomingTrips = mockBookings.filter(b => b.status === 'CONFIRMED').slice(0, 3);
  const recentRoutes = mockRoutes.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado de bienvenida */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            ¡Hola de nuevo, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-gray-200 mt-1">Esto es lo que está pasando con tus viajes</p>
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
                      {booking.route.origin.address} → {booking.route.destination.address}
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
                    {route.origin.address} → {route.destination.address}
                  </p>
                  <p className="text-sm text-gray-500">{route.driver.fullName}</p>
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