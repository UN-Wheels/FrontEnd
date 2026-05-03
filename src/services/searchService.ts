import { api } from './api';
import { ApiRoute } from './routesService';

// ─── Parámetros de búsqueda ───────────────────────────────────────────────────

export interface SearchRoutesParams {
  // Ubicación origen
  origin_lat?:    number;
  origin_lng?:    number;
  origin_radius?: number;   // metros, default 500
  origin_name?:   string;   // substring case-insensitive

  // Ubicación destino
  dest_lat?:    number;
  dest_lng?:    number;
  dest_radius?: number;
  dest_name?:   string;

  // Fecha / hora
  date?:      string;   // YYYY-MM-DD
  time_from?: string;   // HH:MM
  time_to?:   string;   // HH:MM

  // Precio
  max_price?: number;

  // Paginación
  page?:  number;
  limit?: number;
}

// ─── Respuesta del servicio ───────────────────────────────────────────────────

interface SearchRouteItem {
  id:            string;
  driverId:      string;
  originName:    string;
  originLat:     number;
  originLng:     number;
  destName:      string;
  destLat:       number;
  destLng:       number;
  departureTime: string;
  pricePerSeat:  number;
  status:        string;
}

export interface SearchRoutesResponse {
  data:  SearchRouteItem[];
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

// ─── Mapper → ApiRoute (compatible con RouteCard / RouteDetailPage) ───────────

function mapSearchItem(r: SearchRouteItem): ApiRoute {
  return {
    id:       r.id,
    driverId: r.driverId,
    driver:   { id: r.driverId } as any,
    origin: {
      address: r.originName,
      lat:     r.originLat,
      lng:     r.originLng,
    },
    destination: {
      address: r.destName,
      lat:     r.destLat,
      lng:     r.destLng,
    },
    departureTime: r.departureTime,
    price:         r.pricePerSeat,
    status:        r.status,
    createdAt:     '',
  };
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const searchService = {
  /**
   * GET /api/search/routes
   * Llama al route-search-service a través del gateway.
   * El endpoint es público — no requiere JWT.
   */
  async searchRoutes(params: SearchRoutesParams = {}): Promise<SearchRoutesResponse & { routes: ApiRoute[] }> {
    // Serializar solo los parámetros definidos
    const query: Record<string, string> = {};
    (Object.entries(params) as [string, unknown][]).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) {
        query[k] = String(v);
      }
    });

    const raw = await api.get<SearchRoutesResponse>('/search/routes', { params: query });
    return {
      ...raw,
      routes: (raw.data ?? []).map(mapSearchItem),
    };
  },
};
