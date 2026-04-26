'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardTitle, Button, Badge, Loading, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useRouteById, useRouteSlots, useOsrmRoute, useRequestReservation } from '../../hooks/queries';
import { shortAddr, fmtDate, fmtDateLong } from '../../lib/format';
import { vehiclesService, Vehicle } from '../../services/vehiclesService';
import { chatService } from '../../services/chatService';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <div style={{ height: '100%' }} className="bg-gray-100 animate-pulse rounded-xl" />,
});

export function RouteDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const { data: route,   isLoading: loadingRoute,  isError } = useRouteById(id);
  const { data: allSlots = [], isLoading: loadingSlots } = useRouteSlots(id);
  const slots = allSlots.filter(s => s.availableSeats > 0);

  const { data: routeCoords = [] } = useOsrmRoute(route?.origin, route?.destination);

  // Vehicle fallback when the driver is the current user
  const [ownVehicle, setOwnVehicle] = useState<Vehicle | null>(null);
  useEffect(() => {
    if (!route?.vehicle?.id || route.vehicle?.plate || !user || route.driverId !== user.email) return;
    vehiclesService.getMyVehicles()
      .then(vs => setOwnVehicle(vs.find(v => String(v.id) === String(route.vehicle!.id)) ?? null))
      .catch(() => {});
  }, [route, user]);

  // Chat
  const [startingChat, setStartingChat] = useState(false);
  const [chatError,    setChatError]    = useState('');

  // Booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate,     setSelectedDate]     = useState('');
  const [bookingError,     setBookingError]     = useState('');
  const [bookingSuccess,   setBookingSuccess]   = useState(false);

  const reserveMutation = useRequestReservation();

  const selectedSlot = slots.find(s => s.date.split('T')[0] === selectedDate) ?? null;

  const handleStartChat = async () => {
    if (!route || !user) return;
    setStartingChat(true);
    setChatError('');
    try {
      const result = await chatService.createConversation(route.id, route.driverId, user.email);
      router.push(`/chat/${result.conversation._id}`);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'No se pudo iniciar el chat');
    } finally {
      setStartingChat(false);
    }
  };

  const handleOpenModal = () => {
    setSelectedDate('');
    setBookingError('');
    setBookingSuccess(false);
    setShowBookingModal(true);
  };

  const handleBooking = async () => {
    if (!route || !selectedDate) return;
    setBookingError('');
    try {
      const travelDate = new Date(selectedDate + 'T00:00:00.000Z').toISOString();
      await reserveMutation.mutateAsync({ routeId: route.id, travelDate });
      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
        router.push('/bookings');
      }, 2000);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Error al solicitar la reserva');
    }
  };

  const todayStr   = new Date().toISOString().split('T')[0];
  const slotDates  = slots.map(s => s.date.split('T')[0]).sort();
  const minDate    = slotDates[0] ?? todayStr;
  const maxDate    = slotDates[slotDates.length - 1] ?? '';

  if (loadingRoute || loadingSlots) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading size="lg" message="Cargando detalles de la ruta..." />
      </div>
    );
  }

  if (isError || !route) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">Ruta no encontrada</h2>
        <p className="text-gray-200 mt-2">La ruta que buscas no existe o ha sido eliminada.</p>
        <Button variant="primary" className="mt-4" onClick={() => router.push('/search')}>
          Volver a buscar
        </Button>
      </div>
    );
  }

  const mapCenter: [number, number] = [
    (route.origin.lat + route.destination.lat) / 2,
    (route.origin.lng + route.destination.lng) / 2,
  ];

  const driverName    = route.driver?.name ?? route.driver?.email ?? 'Conductor';
  const driverEmail   = route.driver?.email ?? '';
  const initials      = route.driver?.name
    ? route.driver.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : driverEmail[0]?.toUpperCase() ?? '?';
  const displayVehicle = route.vehicle?.plate ? route.vehicle : ownVehicle ?? undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Atrás
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
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
                  {new Date(route.departureTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
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

          <Card>
            <CardTitle>Recorrido</CardTitle>
            <div className="mt-4 rounded-xl overflow-hidden" style={{ height: 300 }}>
              <LeafletMap
                center={mapCenter}
                origin={route.origin}
                destination={route.destination}
                routeCoords={routeCoords}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardTitle>Conductor</CardTitle>
            <div className="mt-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary font-bold text-xl">
                {initials}
              </div>
              <h3 className="text-base font-semibold text-gray-900 mt-3">{driverName}</h3>
              {driverEmail && <p className="text-sm text-gray-500 mt-0.5">{driverEmail}</p>}
              {displayVehicle && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10z M13 8h4l3 3v5h-2" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-700">{displayVehicle.plate}</span>
                  <span className="text-xs text-gray-400">· {displayVehicle.vehicle_type}</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <Button variant="primary" className="w-full" onClick={handleOpenModal} disabled={slots.length === 0}>
                {slots.length === 0 ? 'Sin cupos disponibles' : 'Solicitar Cupo'}
              </Button>

              {user && route.driverId !== user.email && (
                <div>
                  <Button
                    variant="outline" className="w-full"
                    onClick={handleStartChat} isLoading={startingChat} disabled={startingChat}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {startingChat ? 'Iniciando chat…' : 'Chatear con el conductor'}
                  </Button>
                  {chatError && <p className="text-xs text-red-600 mt-1 text-center">{chatError}</p>}
                </div>
              )}
            </div>
          </Card>

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
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 capitalize leading-tight">
                            {fmtDate(slot.date)}
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

      {/* Booking Modal */}
      <Modal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} title="Solicitar Reserva">
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
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Ruta</p>
              <p className="font-medium text-gray-900">
                {shortAddr(route.origin.address)} → {shortAddr(route.destination.address)}
              </p>
              <p className="text-sm text-gray-500 mt-2">Hora de salida</p>
              <p className="font-medium text-gray-900">{fmtDateLong(route.departureTime)}</p>
            </div>

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
              <p className="text-xs text-gray-400 mt-1">Solo puedes seleccionar fechas con cupos disponibles.</p>
            </div>

            {selectedDate && (
              selectedSlot ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-800">
                    <strong>{selectedSlot.availableSeats}</strong> cupo{selectedSlot.availableSeats !== 1 ? 's' : ''} disponible{selectedSlot.availableSeats !== 1 ? 's' : ''}.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-sm text-red-700">No hay cupos disponibles para esta fecha.</p>
                </div>
              )
            )}

            <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center">
              <span className="text-gray-600">Precio por cupo</span>
              <span className="font-semibold text-gray-900 text-lg">${route.price.toLocaleString()}</span>
            </div>

            {bookingError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {bookingError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowBookingModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary" className="flex-1"
                onClick={handleBooking}
                isLoading={reserveMutation.isPending}
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
