'use client';
import {
  useQuery,
  useMutation,
  useQueries,
  useQueryClient,
  QueryClient,
} from '@tanstack/react-query';
import { routesService, reservationsService, ApiRoute } from '../services/routesService';
import { vehiclesService } from '../services/vehiclesService';
import { chatService } from '../services/chatService';

// ─── Query keys ────────────────────────────────────────────────────────────────
// Centralizar aquí garantiza invalidaciones consistentes en toda la app.

export const queryKeys = {
  routes: {
    available: ()          => ['routes', 'available']        as const,
    my:        ()          => ['routes', 'my']               as const,
    byId:      (id: string)=> ['routes', id]                 as const,
    slots:     (id: string)=> ['routes', id, 'slots']        as const,
    availability:(id:string)=>['routes', id, 'availability'] as const,
  },
  reservations: {
    passengerPending:   () => ['reservations', 'passenger', 'pending']    as const,
    passengerConfirmed: () => ['reservations', 'passenger', 'confirmed']  as const,
    passengerHistory:   () => ['reservations', 'passenger', 'history']    as const,
    driverPending:      () => ['reservations', 'driver',    'pending']    as const,
    driverConfirmed:    () => ['reservations', 'driver',    'confirmed']  as const,
  },
  vehicles: {
    my: () => ['vehicles', 'my'] as const,
  },
  conversations: {
    byUser:   (userId: string)           => ['conversations', userId]        as const,
    messages: (convId: string, page: number) => ['messages', convId, page]  as const,
  },
  osrm: (oLng: number, oLat: number, dLng: number, dLat: number) =>
    ['osrm', oLng, oLat, dLng, dLat] as const,
};

// ─── Stale times ───────────────────────────────────────────────────────────────
const STALE = {
  routes:        60_000,   // 1 min — cambian poco
  reservations:  30_000,   // 30 s — cambian al aceptar/rechazar
  vehicles:     300_000,   // 5 min — muy estables
  conversations:  5_000,   // 5 s  — frecuentes (socket los actualiza igual)
  osrm:        3_600_000,  // 1 h  — geometría de ruta no cambia
};

// ─── Hooks de rutas ────────────────────────────────────────────────────────────

export function useAvailableRoutes() {
  return useQuery({
    queryKey: queryKeys.routes.available(),
    queryFn:  () => routesService.getAvailableRoutes(),
    staleTime: STALE.routes,
  });
}

export function useMyRoutes() {
  return useQuery({
    queryKey: queryKeys.routes.my(),
    queryFn:  () => routesService.getMyRoutes(),
    staleTime: STALE.routes,
  });
}

export function useRouteById(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.routes.byId(id ?? ''),
    queryFn:  () => routesService.getRouteById(id!),
    enabled:  !!id,
    staleTime: STALE.routes,
  });
}

export function useRouteSlots(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.routes.slots(id ?? ''),
    queryFn:  () => routesService.getRouteSlots(id!),
    enabled:  !!id,
    staleTime: STALE.routes,
  });
}

/** Resuelve N rutas en paralelo, usando la misma cache que useRouteById. */
export function useRoutesByIds(ids: string[]) {
  return useQueries({
    queries: ids.map(id => ({
      queryKey: queryKeys.routes.byId(id),
      queryFn:  () => routesService.getRouteById(id),
      staleTime: STALE.routes,
    })),
    combine: (results) => {
      const map = new Map<string, ApiRoute>();
      results.forEach(r => { if (r.data) map.set(r.data.id, r.data); });
      return {
        map,
        isLoading: results.some(r => r.isLoading),
      };
    },
  });
}

export function useDeleteRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routesService.deleteRoute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.routes.my() });
    },
  });
}

// ─── Hooks de reservas ─────────────────────────────────────────────────────────

export function usePassengerPendingRequests() {
  return useQuery({
    queryKey: queryKeys.reservations.passengerPending(),
    queryFn:  () => reservationsService.getMyPendingRequests(),
    staleTime: STALE.reservations,
  });
}

export function usePassengerConfirmedTrips() {
  return useQuery({
    queryKey: queryKeys.reservations.passengerConfirmed(),
    queryFn:  () => reservationsService.getMyConfirmedTrips(),
    staleTime: STALE.reservations,
  });
}

export function usePassengerHistory() {
  return useQuery({
    queryKey: queryKeys.reservations.passengerHistory(),
    queryFn:  () => reservationsService.getTripHistory(),
    staleTime: STALE.reservations,
  });
}

export function useDriverPendingRequests() {
  return useQuery({
    queryKey: queryKeys.reservations.driverPending(),
    queryFn:  () => reservationsService.getDriverPendingRequests(),
    staleTime: STALE.reservations,
  });
}

export function useDriverConfirmedTrips() {
  return useQuery({
    queryKey: queryKeys.reservations.driverConfirmed(),
    queryFn:  () => reservationsService.getDriverConfirmedTrips(),
    staleTime: STALE.reservations,
  });
}

export function useAcceptReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsService.acceptReservation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reservations.driverPending() });
      qc.invalidateQueries({ queryKey: queryKeys.reservations.driverConfirmed() });
    },
  });
}

export function useRejectReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsService.rejectReservation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reservations.driverPending() });
    },
  });
}

export function useRequestReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, travelDate }: { routeId: string; travelDate: string }) =>
      reservationsService.requestReservation(routeId, travelDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reservations.passengerPending() });
    },
  });
}

// ─── Hooks de vehículos ────────────────────────────────────────────────────────

export function useMyVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles.my(),
    queryFn:  () => vehiclesService.getMyVehicles(),
    staleTime: STALE.vehicles,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesService.createVehicle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.vehicles.my() });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vehiclesService.deleteVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.vehicles.my() });
    },
  });
}

// ─── Hooks de conversaciones ───────────────────────────────────────────────────

export function useConversations(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.conversations.byUser(userId ?? ''),
    queryFn:  () => chatService.getUserConversations(userId!),
    enabled:  !!userId,
    staleTime: STALE.conversations,
  });
}

export function useMessages(conversationId: string | null | undefined, page = 1, limit = 50) {
  return useQuery({
    queryKey: queryKeys.conversations.messages(conversationId ?? '', page),
    queryFn:  () => chatService.getMessages(conversationId!, page, limit),
    enabled:  !!conversationId,
    staleTime: 0,
  });
}

// ─── Hook de geometría OSRM ────────────────────────────────────────────────────

async function fetchOsrmRoute(
  origin:      { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<[number, number][]> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const query  = '?overview=full&geometries=geojson';
  const servers = [
    `https://router.project-osrm.org/route/v1/driving/${coords}${query}`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coords}${query}`,
  ];

  for (const url of servers) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.routes?.[0]?.geometry?.coordinates?.length) continue;
      return data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
      );
    } catch { /* try next */ }
  }

  return [];
}

export function useOsrmRoute(
  origin?:      { lat: number; lng: number },
  destination?: { lat: number; lng: number },
) {
  return useQuery({
    queryKey: queryKeys.osrm(
      origin?.lng ?? 0, origin?.lat ?? 0,
      destination?.lng ?? 0, destination?.lat ?? 0,
    ),
    queryFn:  () => fetchOsrmRoute(origin!, destination!),
    enabled:  !!origin && !!destination,
    staleTime: STALE.osrm,
    retry: false,
  });
}

// ─── createQueryClient (para el provider) ─────────────────────────────────────

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        // Keep inactive queries in memory for 10 min so navigating back
        // between screens never triggers a fresh fetch unnecessarily.
        gcTime: 600_000,
      },
    },
  });
}
