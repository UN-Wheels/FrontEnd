import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Button, Badge } from '../../components/ui';
import { routesService, reservationsService, ApiRoute, ApiReservation } from '../../services/routesService';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentRoutes, setRecentRoutes] = useState<ApiRoute[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<ApiReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [routes, confirmed] = await Promise.all([
          routesService.getAvailableRoutes(),
          reservationsService.getMyConfirmedTrips(),
        ]);
        setRecentRoutes(routes.slice(0, 3));
        setUpcomingTrips(confirmed.slice(0, 3));
      } catch (err) {
        console.error('Error al cargar dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
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

          {isLoading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Cargando...</div>
          ) : upcomingTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No tienes viajes programados</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/search')}>
                Encontrar un viaje
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/routes/${trip.routeId}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm font-mono">
                      Ruta: {trip.routeId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(trip.travelDate)}
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

          {isLoading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Cargando...</div>
          ) : recentRoutes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay rutas disponibles ahora</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRoutes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/routes/${route.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {route.origin.address} → {route.destination.address}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(route.departureTime).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900">${route.price.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardTitle>Acciones Rápidas</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            {
              label: 'Buscar', path: '/search',
              bg: 'bg-primary/10', color: 'text-primary',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
            },
            {
              label: 'Publicar', path: '/publish',
              bg: 'bg-secondary/10', color: 'text-secondary',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
            },
            {
              label: 'Chat', path: '/chat',
              bg: 'bg-green-100', color: 'text-green-600',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
            },
            {
              label: 'Perfil', path: '/profile',
              bg: 'bg-purple-100', color: 'text-purple-600',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
            },
          ].map(({ label, path, bg, color, icon }) => (
            <button
              key={path}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => navigate(path)}
            >
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {icon}
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
