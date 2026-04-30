'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Loading, EmptyState } from '../../components/ui';
import { LocationPicker } from '../../components/ui/LocationPicker';
import { searchService, SearchRoutesParams } from '../../services/searchService';
import { ApiRoute } from '../../services/routesService';
import { fmtTime, fmtDate } from '../../lib/format';
import { Location } from '../../types';

export function SearchRoutesPage() {
  const router = useRouter();

  // ── Resultados ──────────────────────────────────────────────────────────────
  const [routes,    setRoutes]    = useState<ApiRoute[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isError,   setIsError]   = useState(false);
  const [searched,  setSearched]  = useState(false);

  // ── Filtros ─────────────────────────────────────────────────────────────────
  const [originLoc,  setOriginLoc]  = useState<Location | null>(null);
  const [destLoc,    setDestLoc]    = useState<Location | null>(null);
  const [originName, setOriginName] = useState('');
  const [destName,   setDestName]   = useState('');
  const [date,       setDate]       = useState('');
  const [timeFrom,   setTimeFrom]   = useState('');
  const [timeTo,     setTimeTo]     = useState('');
  const [maxPrice,   setMaxPrice]   = useState('');
  const [radius,     setRadius]     = useState('500');

  // ── Búsqueda ─────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (targetPage = 1) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const params: SearchRoutesParams = { page: targetPage, limit: 20 };

      // Coordenadas tienen prioridad sobre texto libre
      if (originLoc) {
        params.origin_lat    = originLoc.lat;
        params.origin_lng    = originLoc.lng;
        params.origin_radius = Number(radius);
      } else if (originName.trim()) {
        params.origin_name = originName.trim();
      }

      if (destLoc) {
        params.dest_lat    = destLoc.lat;
        params.dest_lng    = destLoc.lng;
        params.dest_radius = Number(radius);
      } else if (destName.trim()) {
        params.dest_name = destName.trim();
      }

      if (date)     params.date      = date;
      if (timeFrom) params.time_from = timeFrom;
      if (timeTo)   params.time_to   = timeTo;
      if (maxPrice) params.max_price = Number(maxPrice);

      const res = await searchService.searchRoutes(params);
      setRoutes(res.routes);
      setTotal(res.total);
      setPage(res.page);
      setPages(res.pages);
      setSearched(true);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [originLoc, destLoc, originName, destName, date, timeFrom, timeTo, maxPrice, radius]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); doSearch(1); };

  const handleClear = () => {
    setOriginLoc(null); setDestLoc(null);
    setOriginName('');  setDestName('');
    setDate('');        setTimeFrom(''); setTimeTo(''); setMaxPrice('');
    setRadius('500');   setRoutes([]);   setSearched(false);
  };

  const hasFilters = !!(originLoc || destLoc || originName || destName ||
                        date || timeFrom || timeTo || maxPrice);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Buscar Rutas</h1>
        <p className="text-gray-200 mt-1">Encuentra el viaje perfecto hacia tu destino</p>
      </div>

      {/* ── Filtros ── */}
      <Card>
        <form onSubmit={handleSearch} className="space-y-4">

          {/* Origen / Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <LocationPicker
                label="Origen"
                placeholder="Seleccionar en el mapa…"
                value={originLoc}
                onChange={setOriginLoc}
                autoGeolocate
              />
              {!originLoc && (
                <Input
                  name="originName"
                  placeholder="…o escribe un barrio / lugar"
                  value={originName}
                  onChange={e => setOriginName(e.target.value)}
                  className="bg-gray-50 text-sm"
                />
              )}
            </div>

            <div className="space-y-2">
              <LocationPicker
                label="Destino"
                placeholder="Seleccionar en el mapa…"
                value={destLoc}
                onChange={setDestLoc}
                defaultCenter={[4.6356, -74.0843]}
              />
              {!destLoc && (
                <Input
                  name="destName"
                  placeholder="…o escribe un barrio / lugar"
                  value={destName}
                  onChange={e => setDestName(e.target.value)}
                  className="bg-gray-50 text-sm"
                />
              )}
            </div>
          </div>

          {/* Fecha / Hora / Precio */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              label="Fecha"
              type="date"
              name="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <Input
              label="Hora desde"
              type="time"
              name="timeFrom"
              value={timeFrom}
              onChange={e => setTimeFrom(e.target.value)}
            />
            <Input
              label="Hora hasta"
              type="time"
              name="timeTo"
              value={timeTo}
              onChange={e => setTimeTo(e.target.value)}
            />
            <Input
              label="Precio máx. (COP)"
              type="number"
              name="maxPrice"
              placeholder="Sin límite"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              min="0"
            />
          </div>

          {/* Radio — solo visible si hay coordenadas seleccionadas */}
          {(originLoc || destLoc) && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-400 flex-shrink-0">Radio:</span>
              {(['250', '500', '1000', '2000'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    radius === r
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  {Number(r) >= 1000 ? `${Number(r) / 1000} km` : `${r} m`}
                </button>
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" variant="primary" className="flex-1 md:flex-none" isLoading={isLoading}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar
            </Button>
            {hasFilters && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
          </div>
        </form>
      </Card>

      {/* ── Resultados ── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" message="Buscando rutas disponibles..." />
        </div>

      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">No se pudieron cargar las rutas. Intenta de nuevo.</p>
          <Button variant="outline" onClick={() => doSearch(1)}>Reintentar</Button>
        </div>

      ) : !searched ? (
        <div className="rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-white font-medium">Usa los filtros para buscar rutas</p>
          <p className="text-gray-400 text-sm mt-1">Por ubicación, fecha, hora o precio</p>
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
          description="Intenta ajustando los filtros o amplía el radio de búsqueda"
          action={{ label: 'Limpiar filtros', onClick: handleClear }}
        />

      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-200 text-sm">
              <span className="font-semibold text-white">{total}</span>{' '}
              ruta{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
              {pages > 1 && <span className="text-gray-400"> · página {page} de {pages}</span>}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map(route => (
              <Card
                key={route.id}
                hover
                onClick={() => router.push(`/routes/${route.id}`)}
                className="cursor-pointer"
              >
                <div className="space-y-3">
                  {/* Origen / Destino */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                      <div className="w-0.5 h-8 bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-secondary flex-shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Origen</p>
                      <p className="font-medium text-gray-900 text-sm truncate" title={route.origin.address}>
                        {route.origin.address.split(',')[0].trim()}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-3">Destino</p>
                      <p className="font-medium text-gray-900 text-sm truncate" title={route.destination.address}>
                        {route.destination.address.split(',')[0].trim()}
                      </p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      Activa
                    </span>
                  </div>

                  {/* Hora / Fecha / Precio */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{fmtTime(route.departureTime)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm capitalize">{fmtDate(route.departureTime)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">${route.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">por cupo</p>
                    </div>
                  </div>

                  {/* Conductor */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                      {(route.driver?.name
                        ? route.driver.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)
                        : (route.driverId?.[0] ?? '?')
                      ).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-500 truncate">
                      {route.driver?.name
                        ?? route.driver?.email?.split('@')[0]
                        ?? route.driverId?.split('@')[0]
                        ?? 'Conductor'}
                    </span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4" size="sm">
                  Ver Detalles
                </Button>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1}  onClick={() => doSearch(page - 1)}>
                ← Anterior
              </Button>
              <span className="text-sm text-gray-300 px-2">{page} / {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => doSearch(page + 1)}>
                Siguiente →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
