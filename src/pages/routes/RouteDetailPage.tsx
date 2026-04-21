import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardTitle, Button, Badge, Loading, Modal } from '../../components/ui';
import { routesService, reservationsService, ApiRoute, RouteSlot } from '../../services/routesService';
import { vehiclesService, Vehicle } from '../../services/vehiclesService';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

const originIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#45acab;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destinationIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#1f3f69;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const shortAddr = (addr: string) => addr.split(',')[0].trim();

export function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [route, setRoute]               = useState<ApiRoute | null>(null);
  const [slots, setSlots]               = useState<RouteSlot[]>([]);
  const [ownVehicle, setOwnVehicle]     = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState('');
  const [routeCoords, setRouteCoords]   = useState<[number, number][]>([]);

  // Chat state
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState('');

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate]         = useState('');
  const [selectedSlot, setSelectedSlot]         = useState<RouteSlot | null>(null);
  const [isBooking, setIsBooking]               = useState(false);
  const [bookingSuccess, setBookingSuccess]     = useState(false);
  const [bookingError, setBookingError]         = useState('');

  // Load route + slots
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [routeData, slotsData] = await Promise.all([
          routesService.getRouteById(id),
          routesService.getRouteSlots(id),
        ]);
        setRoute(routeData);
        setSlots(slotsData.filter(s => s.availableSeats > 0));
      } catch (err) {
        console.error('Error al cargar la ruta:', err);
        setError('No se pudo cargar la ruta.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  // Load own vehicle once both route and user are available
  useEffect(() => {
    if (!route?.vehicleId || !user || route.driverId !== user.email) return;
    vehiclesService.getMyVehicles()
      .then(vs => setOwnVehicle(vs.find(v => String(v.id) === route.vehicleId) ?? null))
      .catch(() => {});
  }, [route, user]);

  // Fetch road geometry via OSRM.
  // router.project-osrm.org es el servidor demo público — tiene rate limiting
  // agresivo y suele estar caído. Se intenta con dos servidores alternativos
  // antes de caer en la línea recta de fallback.
  useEffect(() => {
    if (!route) return;

    const { origin, destination } = route;
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const query  = `?overview=full&geometries=geojson`;

    const servers = [
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coords}${query}`,
      `https://router.project-osrm.org/route/v1/driving/${coords}${query}`,
    ];

    const parseCoords = (data: any): [number, number][] =>
      data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      );

    const fallback = (): [number, number][] => [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ];

    // Intenta cada servidor en orden; usa el primero que responda correctamente
    const tryNext = async (index: number): Promise<void> => {
      if (index >= servers.length) {
        console.warn('[OSRM] Todos los servidores fallaron — mostrando línea recta');
        setRouteCoords(fallback());
        return;
      }
      try {
        const res = await fetch(servers[index]);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.routes?.[0]?.geometry?.coordinates?.length) {
          throw new Error('Respuesta vacía o sin geometría');
        }
        setRouteCoords(parseCoords(data));
      } catch (err) {
        console.warn(`[OSRM] Servidor ${index + 1} falló:`, err);
        tryNext(index + 1);
      }
    };

    tryNext(0);
  }, [route]);

  // Keep selectedSlot in sync with selectedDate
  useEffect(() => {
    if (!selectedDate) {
      setSelectedSlot(null);
      return;
    }
    const slot = slots.find(s => s.date.split('T')[0] === selectedDate) ?? null;
    setSelectedSlot(slot);
  }, [selectedDate, slots]);

  const handleStartChat = async () => {
    if (!route || !user) return;
    setStartingChat(true);
    setChatError('');
    try {
      const result = await chatService.createConversation(
        route.id,
        route.driverId,  // email del conductor
        user.email,      // email del pasajero (usuario actual)
      );
      navigate(`/chat/${result.conversation._id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar el chat';
      setChatError(msg);
    } finally {
      setStartingChat(false);
    }
  };

  const handleOpenModal = () => {
    setSelectedDate('');
    setSelectedSlot(null);
    setBookingError('');
    setBookingSuccess(false);
    setShowBookingModal(true);
  };

  const handleBooking = async () => {
    if (!route || !selectedDate) return;
    setIsBooking(true);
    setBookingError('');
    try {
      // Normalize to start of day UTC
      const travelDate = new Date(selectedDate + 'T00:00:00.000Z').toISOString();
      await reservationsService.requestReservation(route.id, travelDate);
      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
        navigate('/bookings');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al solicitar la reserva';
      setBookingError(msg);
    } finally {
      setIsBooking(false);
    }
  };

  const formatDateLong = (iso: string) =>
    new Date(iso).toLocaleString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDateShort = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const todayStr = new Date().toISOString().split('T')[0];
  // Min and max selectable dates based on available slots
  const slotDates = slots.map(s => s.date.split('T')[0]).sort();
  const minDate = slotDates[0] ?? todayStr;
  const maxDate = slotDates[slotDates.length - 1] ?? '';

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading size="lg" message="Cargando detalles de la ruta..." />
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">
          {error || 'Ruta no encontrada'}
        </h2>
        <p className="text-gray-200 mt-2">La ruta que buscas no existe o ha sido eliminada.</p>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/search')}>
          Volver a buscar
        </Button>
      </div>
    );
  }

  const mapCenter: [number, number] = [
    (route.origin.lat + route.destination.lat) / 2,
    (route.origin.lng + route.destination.lng) / 2,
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Atrás
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Route info */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <Badge variant="success">Disponible</Badge>
              <p className="text-sm text-gray-500">
                Publicado el {new Date(route.createdAt).toLocaleDateString('es-CO')}
              </p>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="flex flex-col items-center pt-1">
                <div className="w-4 h-4 rounded-full bg-primary border-4 border-primary/20" />
                <div className="w-0.5 h-16 bg-gradient-to-b from-primary to-secondary" />
                <div className="w-4 h-4 rounded-full bg-secondary border-4 border-secondary/20" />
              </div>
              <div className="flex-1">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Origen</p>
                  <p className="text-xl font-semibold text-gray-900">{shortAddr(route.origin.address)}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{route.origin.address}</p>
                </div>
                <div className="mt-8">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Destino</p>
                  <p className="text-xl font-semibold text-gray-900">{shortAddr(route.destination.address)}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{route.destination.address}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Hora de salida</p>
                <p className="font-medium text-gray-900">
                  {new Date(route.departureTime).toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Días disponibles</p>
                <p className="font-medium text-gray-900">{slots.length} días</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Precio por cupo</p>
                <p className="font-bold text-primary text-lg">${route.price.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Map */}
          <Card>
            <CardTitle>Recorrido</CardTitle>
            <div className="mt-4 rounded-xl overflow-hidden" style={{ height: 300 }}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {routeCoords.length > 0 && (
                  <Polyline
                    positions={routeCoords}
                    pathOptions={{ color: '#45acab', weight: 4, opacity: 0.85 }}
                  />
                )}
                <Marker position={[route.origin.lat, route.origin.lng]} icon={originIcon}>
                  <Popup>
                    <strong>Origen</strong>
                    <br />
                    {route.origin.address}
                  </Popup>
                </Marker>
                <Marker
                  position={[route.destination.lat, route.destination.lng]}
                  icon={destinationIcon}
                >
                  <Popup>
                    <strong>Destino</strong>
                    <br />
                    {route.destination.address}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </Card>

        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Driver info */}
          <Card>
            <CardTitle>Conductor</CardTitle>
            {(() => {
              // driverId stores the user's email (JWT sub field), not numeric id
              const isOwnRoute = user && route.driverId === user.email;
              return (
                <div className="mt-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  {isOwnRoute ? (
                    <>
                      <h3 className="text-base font-semibold text-gray-900 mt-3">{user.fullName}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-semibold text-gray-900 mt-3">Conductor</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Universidad Nacional de Colombia</p>
                    </>
                  )}
                  {ownVehicle && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10z M13 8h4l3 3v5h-2" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-700">{ownVehicle.plate}</span>
                      <span className="text-xs text-gray-400">· {ownVehicle.vehicle_type}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-6 space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleOpenModal}
                disabled={slots.length === 0}
              >
                {slots.length === 0 ? 'Sin cupos disponibles' : 'Solicitar Cupo'}
              </Button>
              {/* Botón chat — solo si no es propia ruta */}
              {user && route.driverId !== user.email && (
                <div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleStartChat}
                    isLoading={startingChat}
                    disabled={startingChat}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {startingChat ? 'Iniciando chat…' : 'Chatear con el conductor'}
                  </Button>
                  {chatError && (
                    <p className="text-xs text-red-600 mt-1 text-center">{chatError}</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Available slots */}
          {slots.length > 0 && (
            <Card>
              <CardTitle>Días con Cupos</CardTitle>
              <div className="mt-3 space-y-3">
                {slots.map(slot => (
                  <div
                    key={slot.date}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedDate(slot.date.split('T')[0]);
                      setBookingError('');
                      setBookingSuccess(false);
                      setShowBookingModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 capitalize leading-tight">
                            {formatDateShort(slot.date)}
                          </p>
                          <p className="text-xs text-gray-400">Disponible</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary leading-tight">
                          {slot.availableSeats}
                          <span className="text-xs font-normal text-gray-400">/{slot.totalSeats}</span>
                        </p>
                        <p className="text-xs text-gray-400">cupos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Booking Modal ── */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Solicitar Reserva"
      >
        {bookingSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">¡Solicitud Enviada!</h3>
            <p className="text-gray-600 mt-2">El conductor revisará tu solicitud pronto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Route summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Ruta</p>
              <p className="font-medium text-gray-900">
                {shortAddr(route.origin.address)} → {shortAddr(route.destination.address)}
              </p>
              <p className="text-sm text-gray-500 mt-2">Hora de salida</p>
              <p className="font-medium text-gray-900">{formatDateLong(route.departureTime)}</p>
            </div>

            {/* Date picker */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Elige la fecha de viaje
              </label>
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                max={maxDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-xs text-gray-400 mt-1">
                Solo puedes seleccionar fechas con cupos disponibles.
              </p>
            </div>

            {/* Slot availability feedback */}
            {selectedDate && (
              selectedSlot ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-800">
                    <strong>{selectedSlot.availableSeats}</strong> cupo
                    {selectedSlot.availableSeats !== 1 ? 's' : ''} disponible
                    {selectedSlot.availableSeats !== 1 ? 's' : ''} para esta fecha.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-sm text-red-700">
                    No hay cupos disponibles para esta fecha. Elige otro día.
                  </p>
                </div>
              )
            )}

            {/* Price */}
            <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center">
              <span className="text-gray-600">Precio por cupo</span>
              <span className="font-semibold text-gray-900 text-lg">
                ${route.price.toLocaleString()}
              </span>
            </div>

            {/* Error */}
            {bookingError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {bookingError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowBookingModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleBooking}
                isLoading={isBooking}
                disabled={!selectedDate || !selectedSlot}
              >
                Confirmar Solicitud
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
