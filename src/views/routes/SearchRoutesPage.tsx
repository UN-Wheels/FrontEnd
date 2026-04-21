'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Loading, EmptyState } from '../../components/ui';
import { routesService, ApiRoute } from '../../services/routesService';

export function SearchRoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<ApiRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState('');

  // Fetch once on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await routesService.getAvailableRoutes();
        setRoutes(data);
      } catch (err) {
        console.error('Error al obtener rutas:', err);
        setError('No se pudieron cargar las rutas. Intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Buscar Rutas</h1>
        <p className="text-gray-200 mt-1">Encuentra el viaje perfecto hacia tu destino</p>
      </div>

      {/* ── Results ── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" message="Buscando rutas disponibles..." />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      ) : routes.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No se encontraron rutas"
          description="Aún no hay rutas disponibles. ¡Sé el primero en publicar una!"
          action={{ label: 'Publicar una ruta', onClick: () => router.push('/publish') }}
        />
      ) : (
        <>
          <p className="text-gray-200">
            Se encontraron{' '}
            <span className="font-semibold text-white">{routes.length}</span>{' '}
            ruta{routes.length !== 1 ? 's' : ''} disponibles
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map(route => (
              <Card
                key={route.id}
                hover
                onClick={() => router.push(`/routes/${route.id}`)}
                className="cursor-pointer"
              >
                {/* Route */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                      <div className="w-0.5 h-8 bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-secondary flex-shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Origen</p>
                      <p
                        className="font-medium text-gray-900 text-sm truncate"
                        title={route.origin.address}
                      >
                        {route.origin.address.split(',')[0].trim()}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-3">Destino</p>
                      <p
                        className="font-medium text-gray-900 text-sm truncate"
                        title={route.destination.address}
                      >
                        {route.destination.address.split(',')[0].trim()}
                      </p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      Activa
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{formatTime(route.departureTime)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm capitalize">{formatDate(route.departureTime)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        ${route.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">por cupo</p>
                    </div>
                  </div>

                  {/* Conductor */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                      {route.driver?.name
                        ? route.driver.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                        : (route.driver?.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-500 truncate">
                      {route.driver?.name ?? route.driver?.email?.split('@')[0] ?? 'Conductor'}
                    </span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4" size="sm">
                  Ver Detalles
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
