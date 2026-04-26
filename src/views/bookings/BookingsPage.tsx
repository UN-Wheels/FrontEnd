'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Badge, Loading, Modal } from '../../components/ui';
import { ApiReservation, ApiRoute } from '../../services/routesService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { AvailabilityManager } from '../../components/availability/AvailabilityManager';
import { shortAddr, fmtDate, fmtTime } from '../../lib/format';
import { chatService } from '../../services/chatService';
import {
  useMyRoutes,
  useDriverPendingRequests,
  useDriverConfirmedTrips,
  usePassengerPendingRequests,
  usePassengerConfirmedTrips,
  useRoutesByIds,
  useAcceptReservation,
  useRejectReservation,
  useDeleteRoute,
  queryKeys,
} from '../../hooks/queries';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', REJECTED: 'Rechazado', CANCELLED: 'Cancelado',
};
const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
  PENDING: 'warning', CONFIRMED: 'success', REJECTED: 'danger', CANCELLED: 'default',
};
const ROUTE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activa', IN_PROGRESS: 'En curso', 'IN PROGRESS': 'En curso', COMPLETED: 'Finalizada', INACTIVE: 'Inactiva',
};
const ROUTE_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
  ACTIVE: 'success', IN_PROGRESS: 'warning', 'IN PROGRESS': 'warning', COMPLETED: 'default', INACTIVE: 'danger',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { lastNotification } = useNotifications();

  // ── Auto-refresh al recibir notificaciones de reservas en tiempo real ─────
  useEffect(() => {
    if (!lastNotification) return;
    const { type } = lastNotification;
    if (type === 'RESERVATION_REQUESTED') {
      // El conductor tiene una nueva solicitud pendiente
      qc.invalidateQueries({ queryKey: queryKeys.reservations.driverPending() });
    } else if (type === 'RESERVATION_ACCEPTED') {
      // El pasajero pasó a confirmado
      qc.invalidateQueries({ queryKey: queryKeys.reservations.passengerPending() });
      qc.invalidateQueries({ queryKey: queryKeys.reservations.passengerConfirmed() });
    } else if (type === 'RESERVATION_REJECTED') {
      // La solicitud del pasajero fue rechazada
      qc.invalidateQueries({ queryKey: queryKeys.reservations.passengerPending() });
    } else if (type === 'ROUTE_DELETED') {
      // La ruta fue cancelada — refrescar todo
      qc.invalidateQueries({ queryKey: queryKeys.reservations.passengerPending() });
      qc.invalidateQueries({ queryKey: queryKeys.reservations.passengerConfirmed() });
      qc.invalidateQueries({ queryKey: queryKeys.routes.my() });
    }
  }, [lastNotification, qc]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: myRoutes      = [], isLoading: loadRoutes    } = useMyRoutes();
  const { data: driverPending = [], isLoading: loadDrPend    } = useDriverPendingRequests();
  const { data: driverConfirmed=[], isLoading: loadDrConf   } = useDriverConfirmedTrips();
  const { data: myPending     = [], isLoading: loadPaxPend   } = usePassengerPendingRequests();
  const { data: myConfirmed   = [], isLoading: loadPaxConf   } = usePassengerConfirmedTrips();

  const isLoading = loadRoutes || loadDrPend || loadDrConf || loadPaxPend || loadPaxConf;

  // Obtener detalles de rutas para las reservas de pasajero (N ids → 1 cache compartida)
  const passengerRouteIds = useMemo(() => {
    const all = [...myPending, ...myConfirmed];
    return [...new Set(all.map(r => r.routeId))];
  }, [myPending, myConfirmed]);

  const { map: passengerRouteMap } = useRoutesByIds(passengerRouteIds);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const acceptMutation = useAcceptReservation();
  const rejectMutation = useRejectReservation();
  const deleteMutation = useDeleteRoute();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [actionModal, setActionModal]   = useState<{ reservation: ApiReservation; type: 'accept' | 'reject' } | null>(null);
  const [deleteModal, setDeleteModal]   = useState<ApiRoute | null>(null);
  const [availabilityRouteId, setAvailabilityRouteId] = useState<string | null>(null);
  const [chatError,    setChatError]    = useState('');
  const [chatOpeningKey, setChatOpeningKey] = useState<string | null>(null);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      if (actionModal.type === 'accept') {
        await acceptMutation.mutateAsync(actionModal.reservation.id);
      } else {
        await rejectMutation.mutateAsync(actionModal.reservation.id);
      }
      setActionModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoute = async () => {
    if (!deleteModal) return;
    try {
      await deleteMutation.mutateAsync(deleteModal.id);
      setDeleteModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const openOrCreateChat = async (
    routeId: string, driverId: string, passengerId: string, actionKey: string,
  ) => {
    setChatError('');
    setChatOpeningKey(actionKey);
    try {
      const result = await chatService.createConversation(routeId, driverId, passengerId);
      router.push(`/chat/${result.conversation._id}`);
    } catch (err) {
      console.error(err);
      setChatError('No se pudo abrir el chat. Intenta nuevamente.');
    } finally {
      setChatOpeningKey(null);
    }
  };

  // ── Sub-components ─────────────────────────────────────────────────────────

  const RequestRow = ({ reservation, route }: { reservation: ApiReservation; route: ApiRoute }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-3 rounded-xl border border-slate-100 bg-white hover:border-primary/25 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{fmtDate(reservation.travelDate)}</p>
          <p className="text-sm text-slate-600 font-medium truncate">
            {reservation.passenger?.name ?? reservation.passenger?.email ?? reservation.passengerId}
          </p>
          {reservation.passenger?.name && (
            <p className="text-xs text-slate-400 truncate">{reservation.passenger.email}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Badge variant={STATUS_VARIANT[reservation.status] ?? 'default'} size="sm">
          {STATUS_LABEL[reservation.status] ?? reservation.status}
        </Badge>
        <Button
          variant="secondary" size="sm"
          isLoading={chatOpeningKey === `driver-${reservation.id}`}
          onClick={() => openOrCreateChat(route.id, route.driverId, reservation.passengerId, `driver-${reservation.id}`)}
        >
          Chat
        </Button>
        {reservation.status === 'PENDING' && (
          <>
            <Button variant="primary" size="sm" onClick={() => setActionModal({ reservation, type: 'accept' })}>
              Aceptar
            </Button>
            <Button variant="ghost" size="sm"
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
    const pending   = driverPending.filter(r => r.routeId === route.id && r.status === 'PENDING');
    const confirmed = driverConfirmed.filter(r => r.routeId === route.id);
    const allReqs   = [...driverPending.filter(r => r.routeId === route.id), ...confirmed];
    const vehicle   = route.vehicle?.plate ? route.vehicle : undefined;

    return (
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-[0_10px_28px_rgba(8,20,46,0.16)]">
        <div className="flex items-start sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <div className="w-px h-4 bg-gray-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate text-sm sm:text-[15px]">
                {shortAddr(route.origin.address)}<span className="text-gray-400 mx-1.5">→</span>{shortAddr(route.destination.address)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {fmtTime(route.departureTime)} · ${route.price.toLocaleString()} por cupo
                {vehicle && <span className="ml-2 text-slate-400">· {vehicle.plate} ({vehicle.vehicle_type})</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <Badge variant={ROUTE_STATUS_VARIANT[route.status] ?? 'default'} size="sm">
              {ROUTE_STATUS_LABEL[route.status] ?? route.status}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setAvailabilityRouteId(route.id)} title="Gestionar disponibilidad">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/routes/${route.id}`)} title="Ver ruta">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteModal(route)} title="Eliminar ruta"
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>

        {allReqs.length > 0 && (
          <div className="px-5 pb-0 pt-0 flex gap-2 flex-wrap">
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

        {allReqs.length > 0 ? (
          <div className="px-4 py-3 bg-[#f7fafc] border-t border-slate-100 mt-3 space-y-2">
            {pending.length > 0 && (
              <>
                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider px-1 mb-1">Pendientes</p>
                {pending.map(r => <RequestRow key={r.id} reservation={r} route={route} />)}
              </>
            )}
            {confirmed.length > 0 && (
              <>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider px-1 mb-1 mt-2">Confirmados</p>
                {confirmed.map(r => <RequestRow key={r.id} reservation={r} route={route} />)}
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 px-5 pb-4 pt-2 border-t border-gray-100 mt-3">Sin solicitudes aún.</p>
        )}
      </div>
    );
  };

  const PassengerCard = ({ reservation }: { reservation: ApiReservation }) => {
    const route = passengerRouteMap.get(reservation.routeId);
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/35 hover:shadow-sm transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <div className="w-px h-3 bg-gray-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
          </div>
          <div className="min-w-0">
            {route ? (
              <p className="font-medium text-gray-900 text-sm truncate">
                {shortAddr(route.origin.address)}<span className="text-gray-400 mx-1.5">→</span>{shortAddr(route.destination.address)}
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
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <Badge variant={STATUS_VARIANT[reservation.status] ?? 'default'} size="sm">
            {STATUS_LABEL[reservation.status] ?? reservation.status}
          </Badge>
          {route && (
            <Button
              variant="secondary" size="sm"
              isLoading={chatOpeningKey === `passenger-${reservation.id}`}
              onClick={() => openOrCreateChat(route.id, route.driverId, reservation.passengerId, `passenger-${reservation.id}`)}
            >
              Chat
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => router.push(`/routes/${reservation.routeId}`)} title="Ver ruta">
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

  const totalPendingDriver = driverPending.filter(r => r.status === 'PENDING').length;
  const isProcessing = acceptMutation.isPending || rejectMutation.isPending;

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

      {chatError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{chatError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Conductor */}
        <section className="rounded-2xl border border-white/15 bg-[#0b1232]/65 backdrop-blur-sm p-4 md:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <h2 className="text-base font-semibold text-white">Como Conductor</h2>
            </div>
            {totalPendingDriver > 0 && (
              <span className="px-2 py-0.5 bg-yellow-300 text-yellow-900 text-xs font-bold rounded-full">
                {totalPendingDriver} pendiente{totalPendingDriver !== 1 ? 's' : ''}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push('/publish')}
              className="ml-auto border-white/30 text-white hover:bg-white/10">
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
              <p className="text-gray-300 text-sm mb-4 max-w-xs">Publica tu primera ruta y empieza a recibir solicitudes.</p>
              <Button variant="primary" size="sm" onClick={() => router.push('/publish')}>Publicar una ruta</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRoutes.map(route => <DriverRouteCard key={route.id} route={route} />)}
            </div>
          )}
        </section>

        {/* Pasajero */}
        <section className="rounded-2xl border border-white/15 bg-[#0b1232]/65 backdrop-blur-sm p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-base font-semibold text-white">Como Pasajero</h2>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Viajes Confirmados · {myConfirmed.length}
            </p>
            {myConfirmed.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/20 rounded-xl">
                <p className="text-sm text-gray-400">No tienes viajes confirmados.</p>
                <Button variant="ghost" size="sm" onClick={() => router.push('/search')} className="mt-2 text-primary">
                  Buscar rutas disponibles
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {myConfirmed.map(r => <PassengerCard key={r.id} reservation={r} />)}
              </div>
            )}
          </div>

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
      </div>

      {/* Modals */}
      <Modal isOpen={!!actionModal} onClose={() => setActionModal(null)}
        title={actionModal?.type === 'accept' ? 'Aceptar solicitud' : 'Rechazar solicitud'} size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">
            {actionModal?.type === 'accept'
              ? '¿Confirmas que quieres aceptar esta solicitud?'
              : '¿Confirmas que quieres rechazar esta solicitud?'}
          </p>
          {actionModal && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <p className="font-medium text-gray-800">Fecha: {fmtDate(actionModal.reservation.travelDate)}</p>
              <p className="text-gray-500 font-mono text-xs">Pasajero {actionModal.reservation.passengerId.slice(0, 8)}…</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setActionModal(null)}>Cancelar</Button>
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

      <Modal isOpen={!!availabilityRouteId} onClose={() => setAvailabilityRouteId(null)} title="Gestionar Disponibilidad" size="md">
        {availabilityRouteId && <AvailabilityManager routeId={availabilityRouteId} />}
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Eliminar ruta" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">Esta acción eliminará la ruta y todas sus solicitudes. No se puede deshacer.</p>
          {deleteModal && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-800">
                {shortAddr(deleteModal.origin.address)} → {shortAddr(deleteModal.destination.address)}
              </p>
              <p className="text-gray-500 mt-0.5">{fmtTime(deleteModal.departureTime)}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteRoute} isLoading={deleteMutation.isPending}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
