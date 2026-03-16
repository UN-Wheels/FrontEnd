import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Avatar, StarRating, Loading, EmptyState } from '../../components/ui';
import { mockService } from '../../services/mockData';
import { Route } from '../../types';

export function SearchRoutesPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    date: '',
  });

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mockService.getRoutes(filters);
      setRoutes(data);
    } catch (error) {
      console.error('Error al obtener rutas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRoutes();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buscar Rutas</h1>
        <p className="text-gray-600 mt-1">Encuentra el viaje perfecto hacia tu destino</p>
      </div>

      {/* Filtros de búsqueda */}
      <Card>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            name="origin"
            placeholder="Desde (Origen)"
            value={filters.origin}
            onChange={handleFilterChange}
            className="bg-gray-50"
          />
          <Input
            name="destination"
            placeholder="Hacia (Destino)"
            value={filters.destination}
            onChange={handleFilterChange}
            className="bg-gray-50"
          />
          <Input
            name="date"
            type="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="bg-gray-50"
          />
          <Button type="submit" variant="primary" className="h-[42px]">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar
          </Button>
        </form>
      </Card>

      {/* Resultados */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" message="Buscando rutas disponibles..." />
        </div>
      ) : routes.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No se encontraron rutas"
          description="Intenta ajustando los filtros de búsqueda o vuelve a intentarlo más tarde"
          action={{
            label: 'Limpiar filtros',
            onClick: () => setFilters({ origin: '', destination: '', date: '' }),
          }}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Se encontraron <span className="font-semibold text-gray-900">{routes.length}</span> rutas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <Card
                key={route.id}
                hover
                onClick={() => navigate(`/routes/${route.id}`)}
                className="cursor-pointer"
              >
                {/* Info del conductor */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar
                    src={route.driver.profilePicture}
                    alt={route.driver.fullName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{route.driver.fullName}</p>
                    <div className="flex items-center gap-1">
                      <StarRating rating={route.driver.averageRating} size="sm" />
                      <span className="text-sm text-gray-500">({route.driver.totalTrips} viajes)</span>
                    </div>
                  </div>
                </div>

                {/* Detalles del trayecto */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <div className="w-0.5 h-8 bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Origen</p>
                      <p className="font-medium text-gray-900 line-clamp-1">{route.origin}</p>
                      <p className="text-sm text-gray-500 mt-3">Destino</p>
                      <p className="font-medium text-gray-900 line-clamp-1">{route.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4">
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
                        <span className="text-sm font-medium capitalize">{formatDate(route.departureTime)}</span>
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