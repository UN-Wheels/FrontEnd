'use client';
import { api } from './api';

// ─────────────────────────────────────────────────────────────────────────────
// NOTA DE RUTAS EN EL GATEWAY
//
// El gateway monta el routes-reservations-service en el prefijo /api/routes.
// El servicio internamente tiene sus rutas en /routes/* y /reservations/*.
// Por lo tanto los paths completos desde el frontend son:
//   /api/routes/routes/*       → endpoints de rutas
//   /api/routes/reservations/* → endpoints de reservas
//
// Si el gateway está configurado diferente (p.ej. stripping /routes del prefijo),
// ajusta las constantes ROUTES_BASE y RESERVATIONS_BASE.
// ─────────────────────────────────────────────────────────────────────────────
const ROUTES_BASE = '/routes/routes';
const RESERVATIONS_BASE = '/routes/reservations';

// ─── Tipos del backend (respuesta raw) ───────────────────────────────────────

interface BackendLocation {
  name: string;
  lat: number;
  lng: number;
}

// El gateway enriquece driverId → driver, vehicleId → vehicle, passengerId → passenger
interface BackendUser {
  name?: string;
  email: string;
  role?: string;
  phone_number?: string;
}

interface BackendVehicle {
  id?: string | number;
  plate?: string;
  vehicle_type?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: number;
}

export interface BackendRoute {
  _id: string;
  driver: BackendUser;
  vehicle?: BackendVehicle;
  origin: BackendLocation;
  destination: BackendLocation;
  departureTime: string;
  pricePerSeat: number;
  status: 'ACTIVE' | 'IN PROGRESS' | 'COMPLETED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface BackendReservation {
  _id: string;
  routeId: string | BackendRoute;
  passenger: BackendUser;
  travelDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

// ─── Tipos del frontend ────────────────────────────────────────────────────────

export interface ApiLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface ApiDriver {
  name?: string;
  email: string;
  role?: string;
  rating?: number;
}

export interface ApiVehicle {
  id?: string | number;
  plate?: string;
  vehicle_type?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: number;
}

export interface ApiRoute {
  id: string;
  /** Email del conductor — mantenido para compatibilidad con código existente */
  driverId: string;
  driver: ApiDriver;
  vehicle?: ApiVehicle;
  origin: ApiLocation;
  destination: ApiLocation;
  departureTime: string;
  price: number;
  status: string;
  createdAt: string;
}

export interface RouteSlot {
  date: string;
  totalSeats: number;
  usedSeats: number;
  availableSeats: number;
}

export interface ApiReservation {
  id: string;
  routeId: string;
  /** Email del pasajero — mantenido para compatibilidad con código existente */
  passengerId: string;
  passenger: ApiDriver;
  travelDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

// ─── Mapper backend → frontend ────────────────────────────────────────────────

export function mapRoute(r: BackendRoute): ApiRoute {
  return {
    id: r._id,
    driverId: r.driver?.email ?? '',
    driver:   r.driver   ?? { email: '' },
    vehicle:  r.vehicle  ?? undefined,
    origin: {
      address: r.origin.name,
      lat: r.origin.lat,
      lng: r.origin.lng,
    },
    destination: {
      address: r.destination.name,
      lat: r.destination.lat,
      lng: r.destination.lng,
    },
    departureTime: r.departureTime,
    price: r.pricePerSeat,
    status: r.status,
    createdAt: r.createdAt,
  };
}

function mapReservation(r: BackendReservation): ApiReservation {
  const routeId =
    typeof r.routeId === 'string' ? r.routeId : (r.routeId as BackendRoute)._id;
  return {
    id: r._id,
    routeId,
    passengerId: r.passenger?.email ?? '',
    passenger:   r.passenger ?? { email: '' },
    travelDate: r.travelDate,
    status: r.status,
    createdAt: r.createdAt,
  };
}

// ─── Tipos para crear ruta ────────────────────────────────────────────────────

export interface CreateRoutePayload {
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  departureTime: string;
  pricePerSeat: number;
  status?: 'ACTIVE' | 'INACTIVE';
  vehicleId?: string;
}

export type AvailabilityRule =
  | {
      kind: 'SPECIFIC_DATES';
      entries: { date: string; seats: number }[];
    }
  | {
      kind: 'WEEKLY_RECURRENCE';
      weekdays: number[];
      rangeStart: string;
      rangeEnd: string;
      seatsPerOccurrence: number;
    };

export interface AvailabilityRuleItem {
  _id: string;
  kind: 'SPECIFIC_DATES' | 'WEEKLY_RECURRENCE';
  entries?: { date: string; seats: number }[];
  weekdays?: number[];
  rangeStart?: string;
  rangeEnd?: string;
  seatsPerOccurrence?: number;
}

export interface AvailabilityData {
  rules: AvailabilityRuleItem[];
  slots: RouteSlot[];
}

// ─── Servicio de rutas ────────────────────────────────────────────────────────

export const routesService = {
  /**
   * GET /routes/available
   * Rutas activas con al menos un cupo futuro disponible.
   */
  async getAvailableRoutes(): Promise<ApiRoute[]> {
    const data = await api.get<BackendRoute[]>(`${ROUTES_BASE}/available`);
    return data.map(mapRoute);
  },

  /**
   * GET /routes/me
   * Rutas del conductor autenticado.
   */
  async getMyRoutes(): Promise<ApiRoute[]> {
    const data = await api.get<BackendRoute[]>(`${ROUTES_BASE}/me`);
    return data.map(mapRoute);
  },

  /**
   * GET /routes/:id
   */
  async getRouteById(id: string): Promise<ApiRoute> {
    const data = await api.get<BackendRoute>(`${ROUTES_BASE}/${id}`);
    return mapRoute(data);
  },

  /**
   * GET /routes/:id/slots
   * Cupos disponibles por día para una ruta.
   */
  async getRouteSlots(id: string, from?: string, to?: string): Promise<RouteSlot[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return api.get<RouteSlot[]>(`${ROUTES_BASE}/${id}/slots`, { params });
  },

  /**
   * POST /routes
   * Crea una nueva ruta. El driverId se toma del JWT en el gateway.
   */
  async createRoute(payload: CreateRoutePayload): Promise<ApiRoute> {
    const data = await api.post<BackendRoute>(ROUTES_BASE, payload);
    return mapRoute(data);
  },

  /**
   * GET /routes/:id/availability
   * Lista las reglas y slots de disponibilidad de una ruta (solo el propietario).
   */
  getAvailabilityRules(routeId: string): Promise<AvailabilityData> {
    return api.get(`${ROUTES_BASE}/${routeId}/availability`);
  },

  /**
   * POST /routes/:id/availability/rules
   * Añade una regla de disponibilidad y recalcula los slots.
   */
  addAvailabilityRule(routeId: string, rule: AvailabilityRule): Promise<unknown> {
    return api.post(`${ROUTES_BASE}/${routeId}/availability/rules`, rule);
  },

  /**
   * PATCH /routes/:id
   */
  async updateRoute(
    id: string,
    data: Partial<{
      vehicleId: string | null;
      origin: { name: string; lat: number; lng: number };
      destination: { name: string; lat: number; lng: number };
      departureTime: string;
      pricePerSeat: number;
      status: 'ACTIVE' | 'INACTIVE';
    }>
  ): Promise<ApiRoute> {
    const updated = await api.patch<BackendRoute>(`${ROUTES_BASE}/${id}`, data);
    return mapRoute(updated);
  },

  /**
   * DELETE /routes/:id
   * Elimina la ruta y en cascada reglas, slots y reservas.
   */
  deleteRoute(id: string): Promise<{ deleted: boolean; id: string }> {
    return api.delete(`${ROUTES_BASE}/${id}`);
  },

  /**
   * DELETE /routes/:id/availability/rules/:ruleId
   */
  deleteAvailabilityRule(
    routeId: string,
    ruleId: string
  ): Promise<{ deleted: boolean }> {
    return api.delete(`${ROUTES_BASE}/${routeId}/availability/rules/${ruleId}`);
  },
};

// ─── Servicio de reservas ─────────────────────────────────────────────────────

export const reservationsService = {
  /**
   * POST /reservations/request
   * Solicita una reserva para una fecha concreta.
   * travelDate debe ser ISO string al inicio del día UTC: "2026-04-22T00:00:00.000Z"
   */
  async requestReservation(
    routeId: string,
    travelDate: string
  ): Promise<ApiReservation> {
    const data = await api.post<BackendReservation>(`${RESERVATIONS_BASE}/request`, {
      routeId,
      travelDate,
    });
    return mapReservation(data);
  },

  // ── Pasajero ──────────────────────────────────────────────────────────────

  async getMyPendingRequests(): Promise<ApiReservation[]> {
    const data = await api.get<BackendReservation[]>(
      `${RESERVATIONS_BASE}/me/passenger/requests`
    );
    return data.map(mapReservation);
  },

  async getMyConfirmedTrips(): Promise<ApiReservation[]> {
    const data = await api.get<BackendReservation[]>(
      `${RESERVATIONS_BASE}/me/passenger/confirmed`
    );
    return data.map(mapReservation);
  },

  async getTripHistory(): Promise<ApiReservation[]> {
    const data = await api.get<BackendReservation[]>(
      `${RESERVATIONS_BASE}/me/passenger/history`
    );
    return data.map(mapReservation);
  },

  /** DELETE /reservations/:id — cancela la reserva (pasajero) */
  async cancelReservation(id: string): Promise<ApiReservation> {
    const data = await api.delete<BackendReservation>(`${RESERVATIONS_BASE}/${id}`);
    return mapReservation(data);
  },

  // ── Conductor ─────────────────────────────────────────────────────────────

  async getDriverPendingRequests(): Promise<ApiReservation[]> {
    const data = await api.get<BackendReservation[]>(
      `${RESERVATIONS_BASE}/me/driver/requests`
    );
    return data.map(mapReservation);
  },

  async getDriverConfirmedTrips(): Promise<ApiReservation[]> {
    const data = await api.get<BackendReservation[]>(
      `${RESERVATIONS_BASE}/me/driver/confirmed`
    );
    return data.map(mapReservation);
  },

  async acceptReservation(id: string): Promise<ApiReservation> {
    const data = await api.patch<BackendReservation>(
      `${RESERVATIONS_BASE}/${id}/accept`
    );
    return mapReservation(data);
  },

  async rejectReservation(id: string): Promise<ApiReservation> {
    const data = await api.patch<BackendReservation>(
      `${RESERVATIONS_BASE}/${id}/reject`
    );
    return mapReservation(data);
  },
};
