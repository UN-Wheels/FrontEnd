import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardTitle, Button, Avatar, StarRating, Badge, Loading, Modal } from '../../components/ui';
import { mockService } from '../../services/mockData';
import { Route } from '../../types';

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

export function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await mockService.getRouteById(id);
        setRoute(data || null);
      } catch (error) {
        console.error('Error al cargar la ruta:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [id]);

  const handleBooking = async () => {
    if (!route) return;
    setIsBooking(true);
    try {
      await mockService.createBooking(route.id, seatsToBook);
      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
        navigate('/bookings');
      }, 2000);
    } catch (error) {
      console.error('Error al crear la reserva:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading size="lg" message="Cargando detalles de la ruta..." />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">Ruta no encontrada</h2>
        <p className="text-gray-200 mt-2">La ruta que buscas no existe o ha sido eliminada.</p>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/search')}>
          Volver a buscar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Botón volver */}
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
        {/* Contenido principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info de la ruta */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <Badge variant="success">Disponible</Badge>
              <p className="text-sm text-gray-500">
                Publicado el {new Date(route.createdAt).toLocaleDateString('es-CO')}
              </p>
            </div>

            {/* Trayecto */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex flex-col items-center pt-1">
                <div className="w-4 h-4 rounded-full bg-primary border-4 border-primary/20" />
                <div className="w-0.5 h-16 bg-gradient-to-b from-primary to-secondary" />
                <div className="w-4 h-4 rounded-full bg-secondary border-4 border-secondary/20" />
              </div>
              <div className="flex-1">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Origen</p>
                  <p className="text-xl font-semibold text-gray-900">{route.origin.address}</p>
                </div>
                <div className="mt-8">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Destino</p>
                  <p className="text-xl font-semibold text-gray-900">{route.destination.address}</p>
                </div>
              </div>
            </div>

            {/* Cuadrícula de detalles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Salida</p>
                <p className="font-medium text-gray-900">
                  {new Date(route.departureTime).toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-medium text-gray-900">
                  {new Date(route.departureTime).toLocaleDateString('es-CO', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cupos Libres</p>
                <p className="font-medium text-gray-900">{route.availableSeats} de {route.totalSeats}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Precio cupo</p>
                <p className="font-semibold text-primary text-lg">${route.price.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-3">Vista en mapa</p>
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <MapContainer
                  center={[
                    (route.origin.lat + route.destination.lat) / 2,
                    (route.origin.lng + route.destination.lng) / 2,
                  ]}
                  zoom={12}
                  style={{ height: '300px', width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Polyline
                    positions={[
                      [route.origin.lat, route.origin.lng],
                      [route.destination.lat, route.destination.lng],
                    ]}
                    pathOptions={{ color: '#45acab', weight: 4, opacity: 0.85 }}
                  />
                  <Marker position={[route.origin.lat, route.origin.lng]} icon={originIcon}>
                    <Popup>
                      <strong>Origen</strong>
                      <br />
                      {route.origin.address}
                    </Popup>
                  </Marker>
                  <Marker position={[route.destination.lat, route.destination.lng]} icon={destinationIcon}>
                    <Popup>
                      <strong>Destino</strong>
                      <br />
                      {route.destination.address}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </Card>

          {/* Info del vehículo */}
          <Card>
            <CardTitle>Información del Vehículo</CardTitle>
            <div className="mt-4 flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div>
                  <p className="text-sm text-gray-500">Marca y Modelo</p>
                  <p className="font-medium text-gray-900">{route.vehicle.brand} {route.vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Año</p>
                  <p className="font-medium text-gray-900">{route.vehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Color</p>
                  <p className="font-medium text-gray-900">{route.vehicle.color}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Placa</p>
                  <p className="font-medium text-gray-900">{route.vehicle.plateNumber}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Barra lateral */}
        <div className="space-y-6">
          {/* Info del conductor */}
          <Card>
            <CardTitle>Conductor</CardTitle>
            <div className="mt-4 text-center">
              <Avatar
                src={route.driver.profilePicture}
                alt={route.driver.fullName}
                size="xl"
                className="w-20 h-20 mx-auto"
              />
              <h3 className="text-lg font-semibold text-gray-900 mt-3">{route.driver.fullName}</h3>
              <p className="text-sm text-gray-500">{route.driver.university}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <StarRating rating={route.driver.averageRating} size="sm" showValue />
              </div>
              <p className="text-sm text-gray-500 mt-1">{route.driver.totalTrips} viajes completados</p>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setShowBookingModal(true)}
                disabled={route.availableSeats === 0}
              >
                Solicitar Cupo
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/chat')}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chatear con el conductor
              </Button>
            </div>
          </Card>

          {/* Resumen de precio */}
          <Card>
            <CardTitle>Resumen del Precio</CardTitle>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Precio por cupo</span>
                <span>${route.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tarifa de servicio</span>
                <span>$0</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-gray-900">
                <span>Total por cupo</span>
                <span className="text-primary">${route.price.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de reserva */}
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
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Ruta</p>
              <p className="font-medium text-gray-900">{route.origin.address} → {route.destination.address}</p>
              <p className="text-sm text-gray-500 mt-2">Salida</p>
              <p className="font-medium text-gray-900">{formatDateTime(route.departureTime)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Número de cupos</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform"
                  onClick={() => setSeatsToBook(Math.max(1, seatsToBook - 1))}
                >
                  -
                </button>
                <span className="text-xl font-semibold w-12 text-center">{seatsToBook}</span>
                <button
                  type="button"
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform"
                  onClick={() => setSeatsToBook(Math.min(route.availableSeats, seatsToBook + 1))}
                >
                  +
                </button>
                <span className="text-sm text-gray-500 ml-2">
                  Máximo {route.availableSeats} disponibles
                </span>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex justify-between text-gray-600">
                <span>{seatsToBook} cupo(s) × ${route.price.toLocaleString()}</span>
                <span className="font-semibold text-gray-900">
                  ${(seatsToBook * route.price).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowBookingModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleBooking} isLoading={isBooking}>
                Confirmar Solicitud
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}