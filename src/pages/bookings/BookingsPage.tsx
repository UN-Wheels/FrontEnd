import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Avatar, StarRating, BookingStatusBadge, Loading, EmptyState, Modal } from '../../components/ui';
import { mockService, mockBookings } from '../../services/mockData';
import { Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';

type TabType = 'my-bookings' | 'requests';

export function BookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('my-bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject'>('accept');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const data = await mockService.getBookings();
        setBookings(data);
      } catch (error) {
        console.error('Error al obtener reservas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const myBookings = bookings.filter(b => b.passenger.id === user?.id);
  const bookingRequests = mockBookings.filter(b => b.route.driver.id === user?.id || b.route.driver.id === '2');

  const displayedBookings = activeTab === 'my-bookings' ? myBookings : bookingRequests;

  const handleAction = async () => {
    if (!selectedBooking) return;
    setIsProcessing(true);
    try {
      const newStatus = actionType === 'accept' ? 'CONFIRMED' : 'REJECTED';
      await mockService.updateBookingStatus(selectedBooking.id, newStatus);
      
      setBookings(prev =>
        prev.map(b =>
          b.id === selectedBooking.id ? { ...b, status: newStatus } : b
        )
      );
      
      setShowActionModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error al actualizar reserva:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionModal = (booking: Booking, action: 'accept' | 'reject') => {
    setSelectedBooking(booking);
    setActionType(action);
    setShowActionModal(true);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Reservas</h1>
        <p className="text-gray-600 mt-1">Gestiona tus viajes y solicitudes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'my-bookings'
              ? 'text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('my-bookings')}
        >
          Mis Viajes
          {activeTab === 'my-bookings' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'requests'
              ? 'text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('requests')}
        >
          Solicitudes Recibidas
          {bookingRequests.filter(b => b.status === 'PENDING').length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {bookingRequests.filter(b => b.status === 'PENDING').length}
            </span>
          )}
          {activeTab === 'requests' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" message="Cargando reservas..." />
        </div>
      ) : displayedBookings.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title={activeTab === 'my-bookings' ? 'Aún no tienes reservas' : 'No hay solicitudes pendientes'}
          description={
            activeTab === 'my-bookings'
              ? 'Comienza buscando rutas disponibles para tu próximo viaje.'
              : 'Cuando los pasajeros soliciten unirse a tus rutas, aparecerán aquí.'
          }
          action={
            activeTab === 'my-bookings'
              ? {
                  label: 'Buscar un Viaje',
                  onClick: () => navigate('/search'),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* User info */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Avatar
                    src={
                      activeTab === 'my-bookings'
                        ? booking.route.driver.profilePicture
                        : booking.passenger.profilePicture
                    }
                    alt={
                      activeTab === 'my-bookings'
                        ? booking.route.driver.fullName
                        : booking.passenger.fullName
                    }
                    size="lg"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {activeTab === 'my-bookings'
                        ? booking.route.driver.fullName
                        : booking.passenger.fullName}
                    </p>
                    <div className="flex items-center gap-1">
                      <StarRating
                        rating={
                          activeTab === 'my-bookings'
                            ? booking.route.driver.averageRating
                            : booking.passenger.averageRating
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Route info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">
                      {booking.route.origin} → {booking.route.destination}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="capitalize">{formatDateTime(booking.route.departureTime)}</span>
                    <span>•</span>
                    <span>{booking.seatsRequested} {booking.seatsRequested === 1 ? 'cupo' : 'cupos'}</span>
                    <span>•</span>
                    <span>${(booking.seatsRequested * booking.route.price).toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {/* Status and actions */}
                <div className="flex items-center gap-3">
                  <BookingStatusBadge status={booking.status} />
                  
                  {activeTab === 'requests' && booking.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openActionModal(booking, 'accept')}
                      >
                        Aceptar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openActionModal(booking, 'reject')}
                      >
                        Rechazar
                      </Button>
                    </div>
                  )}

                  {activeTab === 'my-bookings' && booking.status === 'CONFIRMED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/chat')}
                    >
                      Chat
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/routes/${booking.route.id}`)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={actionType === 'accept' ? 'Aceptar Reserva' : 'Rechazar Reserva'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {actionType === 'accept'
              ? `¿Estás seguro de que quieres aceptar la solicitud de ${selectedBooking?.passenger.fullName}?`
              : `¿Estás seguro de que quieres rechazar la solicitud de ${selectedBooking?.passenger.fullName}?`}
          </p>

          {selectedBooking && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Ruta</p>
              <p className="font-medium text-gray-900">
                {selectedBooking.route.origin} → {selectedBooking.route.destination}
              </p>
              <p className="text-sm text-gray-500 mt-2">Cupos solicitados</p>
              <p className="font-medium text-gray-900">{selectedBooking.seatsRequested}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowActionModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant={actionType === 'accept' ? 'primary' : 'danger'}
              className="flex-1"
              onClick={handleAction}
              isLoading={isProcessing}
            >
              {actionType === 'accept' ? 'Aceptar' : 'Rechazar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}