import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Avatar, Loading, EmptyState, LocationPicker } from '../../components/ui';
import { mockService } from '../../services/mockData';
import { Route, Location } from '../../types';

export function SearchRoutesPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [originFilter,      setOriginFilter]      = useState<Location | null>(null);
  const [destinationFilter, setDestinationFilter] = useState<Location | null>(null);
  const [dateFilter,        setDateFilter]        = useState('');

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mockService.getRoutes({
        origin:      originFilter      ?? undefined,
        destination: destinationFilter ?? undefined,
        date:        dateFilter        || undefined,
      });
      setRoutes(data);
    } catch (err) {
      console.error('Error al obtener rutas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [originFilter, destinationFilter, dateFilter]);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchRoutes(); };

  const handleClearFilters = () => {
    setOriginFilter(null);
    setDestinationFilter(null);
    setDateFilter('');
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' });

  const hasFilters = !!(originFilter || destinationFilter || dateFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Buscar Rutas</h1>
        <p className="text-gray-200 mt-1">Encuentra el viaje perfecto hacia tu destino</p>
      </div>

      {/* ── Search filters ── */}
      <Card>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LocationPicker
              placeholder="Origen (seleccionar en mapa)"
              value={originFilter}
              onChange={setOriginFilter}
            />
            <LocationPicker
              placeholder="Destino (seleccionar en mapa)"
              value={destinationFilter}
              onChange={setDestinationFilter}
            />
            <Input
              name="date"
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" className="flex-1 md:flex-none">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar
            </Button>
            {hasFilters && (
              <button type="button" onClick={handleClearFilters}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Active filter pills */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 pt-1">
              {originFilter && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                  Desde: {originFilter.address.split(',')[0]}
                  <button type="button" onClick={() => setOriginFilter(null)} className="ml-1 hover:text-primary-dark">×</button>
                </span>
              )}
              {destinationFilter && (
                <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary text-xs font-medium px-3 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                  Hacia: {destinationFilter.address.split(',')[0]}
                  <button type="button" onClick={() => setDestinationFilter(null)} className="ml-1 hover:text-secondary-dark">×</button>
                </span>
              )}
            </div>
          )}
        </form>
      </Card>

      {/* ── Results ── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" message="Buscando rutas disponibles..." />
        </div>
      ) : routes.length === 0 ? (
        <EmptyState
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="No se encontraron rutas"
          description="Intenta seleccionando una zona diferente en el mapa o amplía tu búsqueda"
          action={{ label: 'Limpiar filtros', onClick: handleClearFilters }}
        />
      ) : (
        <>
          <p className="text-gray-200">
            Se encontraron <span className="font-semibold text-white">{routes.length}</span> ruta{routes.length !== 1 ? 's' : ''}
            {hasFilters && ' cerca de tu zona'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <Card key={route.id} hover onClick={() => navigate(`/routes/${route.id}`)} className="cursor-pointer">
                {/* Driver */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar src={route.driver.profilePicture} alt={route.driver.fullName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{route.driver.fullName}</p>
                  </div>
                </div>

                {/* Route */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <div className="w-0.5 h-8 bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Origen</p>
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">{route.origin.address}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-3">Destino</p>
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">{route.destination.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{formatTime(route.departureTime)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm capitalize">{formatDate(route.departureTime)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">${route.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{route.availableSeats} cupos libres</p>
                    </div>
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
