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
  const [upcomingRoutesMap, setUpcomingRoutesMap] = useState<Map<string, ApiRoute>>(new Map());

  useEffect(() => {
    const load = async () => {
      try {
        const [routes, confirmed] = await Promise.all([
          routesService.getAvailableRoutes(),
          reservationsService.getMyConfirmedTrips(),
        ]);

        const upcoming = confirmed.slice(0, 3);
        setRecentRoutes(routes.slice(0, 3));
        setUpcomingTrips(upcoming);

        const uniqueRouteIds = [...new Set(upcoming.map((trip) => trip.routeId))];
        if (uniqueRouteIds.length > 0) {
          const fetched = await Promise.all(
            uniqueRouteIds.map((id) =>
              routesService
                .getRouteById(id)
                .then((route) => [id, route] as [string, ApiRoute])
                .catch(() => null),
            ),
          );

          const map = new Map<string, ApiRoute>();
          fetched.forEach((entry) => {
            if (entry) map.set(entry[0], entry[1]);
          });
          setUpcomingRoutesMap(map);
        } else {
          setUpcomingRoutesMap(new Map());
        }
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

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

const shortAddress = (value: string) => value.split(',')[0].trim();

const TRIP_STATUS_LABEL: Record<ApiReservation['status'], string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
};

const TRIP_STATUS_VARIANT: Record<
  ApiReservation['status'],
  'warning' | 'success' | 'danger' | 'default'
> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'default',
};

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
              {upcomingTrips.map((trip) => {
                const route = upcomingRoutesMap.get(trip.routeId);

                return (
                  <div
                    key={trip.id}
                    className="group flex items-start gap-3 p-3.5 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all"
                    onClick={() => navigate(`/routes/${trip.routeId}`)}
                  >
                    <div className="pt-0.5 flex flex-col items-center gap-1.5 flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <div className="w-px h-4 bg-gray-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {route ? (
                        <p className="font-semibold text-gray-900 truncate text-sm">
                          {shortAddress(route.origin.address)}
                          <span className="mx-1.5 text-gray-400">→</span>
                          {shortAddress(route.destination.address)}
                        </p>
                      ) : (
                        <p className="font-medium text-gray-700 truncate text-sm font-mono">
                          Ruta {trip.routeId.slice(0, 12)}…
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(trip.travelDate)}
                        {route && (
                          <>
                            <span className="mx-1">·</span>
                            {formatTime(route.departureTime)}
                            <span className="mx-1">·</span>
                            ${route.price.toLocaleString('es-CO')} por cupo
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={TRIP_STATUS_VARIANT[trip.status]}>
                        {TRIP_STATUS_LABEL[trip.status]}
                      </Badge>
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
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
