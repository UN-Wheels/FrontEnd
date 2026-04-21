import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, Loading, Modal } from '../../components/ui';
import {
  reservationsService,
  routesService,
  ApiReservation,
  ApiRoute,
} from '../../services/routesService';
import { useAuth } from '../../context/AuthContext';
import { AvailabilityManager } from '../../components/availability/AvailabilityManager';
import { vehiclesService, Vehicle } from '../../services/vehiclesService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const shortAddr = (addr: string) => addr.split(',')[0].trim();

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
};

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'default',
};

const ROUTE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activa',
  IN_PROGRESS: 'En curso',
  'IN PROGRESS': 'En curso',  // legacy variant
  COMPLETED: 'Finalizada',
  INACTIVE: 'Inactiva',
};

const ROUTE_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
  ACTIVE: 'success',
  IN_PROGRESS: 'warning',
  'IN PROGRESS': 'warning',
  COMPLETED: 'default',
  INACTIVE: 'danger',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function BookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Conductor data
  const [myRoutes, setMyRoutes] = useState<ApiRoute[]>([]);
  const [driverPending, setDriverPending] = useState<ApiReservation[]>([]);
  const [driverConfirmed, setDriverConfirmed] = useState<ApiReservation[]>([]);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);

  // Pasajero data
  const [myPending, setMyPending] = useState<ApiReservation[]>([]);
  const [myConfirmed, setMyConfirmed] = useState<ApiReservation[]>([]);
  const [passengerRouteMap, setPassengerRouteMap] = useState<Map<string, ApiRoute>>(new Map());

  // Action modal
  const [actionModal, setActionModal] = useState<{
    reservation: ApiReservation;
    type: 'accept' | 'reject';
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Delete route modal
  const [deleteModal, setDeleteModal] = useState<ApiRoute | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Availability modal
  const [availabilityRouteId, setAvailabilityRouteId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [routes, drPending, drConfirmed, paxPending, paxConfirmed, vehicles] = await Promise.all([
          routesService.getMyRoutes(),
          reservationsService.getDriverPendingRequests(),
          reservationsService.getDriverConfirmedTrips(),
          reservationsService.getMyPendingRequests(),
          reservationsService.getMyConfirmedTrips(),
          vehiclesService.getMyVehicles().catch(() => [] as Vehicle[]),
        ]);
        setMyRoutes(routes);
        setDriverPending(drPending);
        setDriverConfirmed(drConfirmed);
        setMyPending(paxPending);
        setMyConfirmed(paxConfirmed);
        setMyVehicles(vehicles);

        // Enrich passenger reservations with route details
        const allPax = [...paxPending, ...paxConfirmed];
        const uniqueIds = [...new Set(allPax.map(r => r.routeId))];
        const fetched = await Promise.all(
          uniqueIds.map(id =>
            routesService.getRouteById(id)
              .then(route => [id, route] as [string, ApiRoute])
              .catch(() => null)
          )
        );
        const map = new Map<string, ApiRoute>();
        fetched.forEach(e => { if (e) map.set(e[0], e[1]); });
        setPassengerRouteMap(map);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los datos. Intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAction = async () => {
    if (!actionModal) return;
    setIsProcessing(true);
    try {
      const { reservation, type } = actionModal;
      if (type === 'accept') {
        const updated = await reservationsService.acceptReservation(reservation.id);
        setDriverPending(prev => prev.filter(r => r.id !== updated.id));
        setDriverConfirmed(prev => [updated, ...prev]);
      } else {
        const updated = await reservationsService.rejectReservation(reservation.id);
        setDriverPending(prev => prev.map(r => r.id === updated.id ? updated : r));
      }
      setActionModal(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRoute = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await routesService.deleteRoute(deleteModal.id);
      setMyRoutes(prev => prev.filter(r => r.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Sub-components ─────────────────────────────────────────────────────────

  const RequestRow = ({ reservation }: { reservation: ApiReservation }) => (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">{fmtDate(reservation.travelDate)}</p>
          <p className="text-sm text-gray-700 font-medium">
            Pasajero {reservation.passengerId.slice(0, 12)}…
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant={STATUS_VARIANT[reservation.status] ?? 'default'} size="sm">
          {STATUS_LABEL[reservation.status] ?? reservation.status}
        </Badge>
        {reservation.status === 'PENDING' && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActionModal({ reservation, type: 'accept' })}
            >
              Aceptar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActionModal({ reservation, type: 'reject' })}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Rechazar
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const DriverRouteCard = ({ route }: { route: ApiRoute }) => {
    const pending = driverPending.filter(r => r.routeId === route.id && r.status === 'PENDING');
    const confirmed = driverConfirmed.filter(r => r.routeId === route.id);
    const allRequests = [
      ...driverPending.filter(r => r.routeId === route.id),
      ...confirmed,
    ];
    const vehicle = route.vehicleId
      ? myVehicles.find(v => String(v.id) === route.vehicleId)
      : undefined;

    return (
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        {/* Route header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <div className="w-px h-4 bg-gray-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate text-sm">
                {shortAddr(route.origin.address)}
                <span className="text-gray-400 mx-1.5">→</span>
                {shortAddr(route.destination.address)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {fmtTime(route.departureTime)} · ${route.price.toLocaleString()} por cupo
                {vehicle && (
                  <span className="ml-2 text-gray-400">· {vehicle.plate} ({vehicle.vehicle_type})</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={ROUTE_STATUS_VARIANT[route.status] ?? 'default'} size="sm">
              {ROUTE_STATUS_LABEL[route.status] ?? route.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAvailabilityRouteId(route.id)}
              title="Gestionar disponibilidad"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/routes/${route.id}`)}
              title="Ver ruta"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteModal(route)}
              title="Eliminar ruta"
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Request counts pill */}
        {allRequests.length > 0 && (
          <div className="px-5 pb-0 pt-0 flex gap-2">
            {pending.length > 0 && (
              <span className="text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
                {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
              </span>
            )}
            {confirmed.length > 0 && (
              <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                {confirmed.length} confirmado{confirmed.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Requests list */}
        {allRequests.length > 0 ? (
          <div className="px-4 py-3 bg-gray-50/60 border-t border-gray-100 mt-3 space-y-1">
            {pending.length > 0 && (
              <>
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider px-3 mb-1">
                  Pendientes
                </p>
                {pending.map(r => <RequestRow key={r.id} reservation={r} />)}
              </>
            )}
            {confirmed.length > 0 && (
              <>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider px-3 mb-1 mt-3">
                  Confirmados
                </p>
                {confirmed.map(r => <RequestRow key={r.id} reservation={r} />)}
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 px-5 pb-4 pt-2 border-t border-gray-100 mt-3">
            Sin solicitudes aún.
          </p>
        )}
      </div>
    );
  };

  const PassengerCard = ({ reservation }: { reservation: ApiReservation }) => {
    const route = passengerRouteMap.get(reservation.routeId);
    return (
      <div className="flex items-center justify-between gap-3 p-4 bg-white/90 border border-white/30 rounded-xl hover:bg-white hover:border-primary/30 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <div className="w-px h-3 bg-gray-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
          </div>
          <div className="min-w-0">
            {route ? (
              <p className="font-medium text-gray-900 text-sm truncate">
                {shortAddr(route.origin.address)}
                <span className="text-gray-400 mx-1.5">→</span>
                {shortAddr(route.destination.address)}
              </p>
            ) : (
              <p className="font-medium text-gray-500 text-sm font-mono">{reservation.routeId.slice(0, 12)}…</p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">
              {fmtDate(reservation.travelDate)}
              {route && ` · Salida ${fmtTime(route.departureTime)} · $${route.price.toLocaleString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={STATUS_VARIANT[reservation.status] ?? 'default'} size="sm">
            {STATUS_LABEL[reservation.status] ?? reservation.status}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/routes/${reservation.routeId}`)}
            title="Ver ruta"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading size="lg" message="Cargando tus viajes..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  const totalPendingDriver = driverPending.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Viajes</h1>
          <p className="text-gray-200 mt-0.5">
            {user?.fullName && <span className="font-medium">{user.fullName} · </span>}
            Gestiona tus rutas y reservas
          </p>
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── CONDUCTOR ─────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <h2 className="text-base font-semibold text-white">Como Conductor</h2>
            </div>
            {totalPendingDriver > 0 && (
              <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                {totalPendingDriver} pendiente{totalPendingDriver !== 1 ? 's' : ''}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/publish')}
              className="ml-auto border-white/30 text-white hover:bg-white/10"
            >
              + Publicar ruta
            </Button>
          </div>

          {myRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-white/20 rounded-2xl">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 text-gray-300 mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">No has publicado rutas</h3>
              <p className="text-gray-300 text-sm mb-4 max-w-xs">Publica tu primera ruta y empieza a recibir solicitudes de otros estudiantes.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/publish')}>Publicar una ruta</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRoutes.map(route => <DriverRouteCard key={route.id} route={route} />)}
            </div>
          )}
        </section>

        {/* ── PASAJERO ──────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-base font-semibold text-white">Como Pasajero</h2>
          </div>

          {/* Confirmed trips */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Viajes Confirmados · {myConfirmed.length}
            </p>
            {myConfirmed.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/20 rounded-xl">
                <p className="text-sm text-gray-400">No tienes viajes confirmados.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/search')}
                  className="mt-2 text-primary"
                >
                  Buscar rutas disponibles
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {myConfirmed.map(r => <PassengerCard key={r.id} reservation={r} />)}
              </div>
            )}
          </div>

          {/* Pending requests */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Solicitudes Enviadas · {myPending.length}
            </p>
          {myPending.length === 0 ? (
            <p className="text-sm text-gray-400">No tienes solicitudes pendientes.</p>
          ) : (
            <div className="space-y-2">
              {myPending.map(r => <PassengerCard key={r.id} reservation={r} />)}
            </div>
          )}
        </div>
      </section>

      </div>{/* end grid */}

      {/* ── Accept / Reject modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.type === 'accept' ? 'Aceptar solicitud' : 'Rechazar solicitud'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {actionModal?.type === 'accept'
              ? '¿Confirmas que quieres aceptar esta solicitud?'
              : '¿Confirmas que quieres rechazar esta solicitud?'}
          </p>
          {actionModal && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <p className="font-medium text-gray-800">
                Fecha: {fmtDate(actionModal.reservation.travelDate)}
              </p>
              <p className="text-gray-500 font-mono text-xs">
                Pasajero {actionModal.reservation.passengerId.slice(0, 8)}…
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setActionModal(null)}>
              Cancelar
            </Button>
            <Button
              variant={actionModal?.type === 'accept' ? 'primary' : 'danger'}
              className="flex-1"
              onClick={handleAction}
              isLoading={isProcessing}
            >
              {actionModal?.type === 'accept' ? 'Aceptar' : 'Rechazar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Availability modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={!!availabilityRouteId}
        onClose={() => setAvailabilityRouteId(null)}
        title="Gestionar Disponibilidad"
        size="md"
      >
        {availabilityRouteId && (
          <AvailabilityManager routeId={availabilityRouteId} />
        )}
      </Modal>

      {/* ── Delete route modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Eliminar ruta"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Esta acción eliminará la ruta y todas sus solicitudes asociadas. No se puede deshacer.
          </p>
          {deleteModal && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-800">
                {shortAddr(deleteModal.origin.address)} → {shortAddr(deleteModal.destination.address)}
              </p>
              <p className="text-gray-500 mt-0.5">{fmtTime(deleteModal.departureTime)}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteRoute} isLoading={isDeleting}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
