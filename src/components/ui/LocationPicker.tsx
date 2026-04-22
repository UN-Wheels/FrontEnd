'use client';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Location } from '../../types';

// ── Custom icons (divIcon avoids Vite asset-URL issues with default Leaflet icons) ──
const makeIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid white;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });

const pickerIcon = makeIcon('#45acab');

// ── Nominatim types ───────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// ── Sub-components (must live inside MapContainer) ───────────────────────
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prev = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (prev.current && (prev.current.lat !== lat || prev.current.lng !== lng)) {
      map.flyTo([lat, lng], 15, { duration: 0.5 });
    }
    prev.current = { lat, lng };
  }, [lat, lng, map]);
  return null;
}

function GeoFlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 0.8 });
  }, [center, map]);
  return null;
}

// ── Debounce hook ────────────────────────────────────────────────────────
function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// Destroys the Leaflet map instance on unmount — same pattern as LeafletMap.tsx
function MapDestroyer() {
  const map = useMap();
  useEffect(() => () => { map.remove(); }, [map]);
  return null;
}

// ── PickerMap ─────────────────────────────────────────────────────────────
interface PickerMapProps {
  initialCenter: [number, number];
  initialZoom: number;
  temp: Location | null;
  geoCenter: [number, number] | null;
  onMapClick: (lat: number, lng: number) => void;
}

function PickerMap({ initialCenter, initialZoom, temp, geoCenter, onMapClick }: PickerMapProps) {
  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <MapDestroyer />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <ClickHandler onClick={onMapClick} />
      <GeoFlyTo center={geoCenter} />
      {temp && (
        <>
          <Marker position={[temp.lat, temp.lng]} icon={pickerIcon} />
          <FlyTo lat={temp.lat} lng={temp.lng} />
        </>
      )}
    </MapContainer>
  );
}

// ── LocationPicker props ─────────────────────────────────────────────────
export interface LocationPickerProps {
  label?: string;
  value: Location | null;
  onChange: (loc: Location | null) => void;
  placeholder?: string;
  error?: string;
  autoGeolocate?: boolean;
  defaultCenter?: [number, number];
}

const BOGOTA: [number, number] = [4.6097, -74.0817];

export function LocationPicker({ label, value, onChange, placeholder, error, autoGeolocate, defaultCenter }: LocationPickerProps) {
  const [open, setOpen]                 = useState(false);
  const [temp, setTemp]                 = useState<Location | null>(null);
  const [query, setQuery]               = useState('');
  const [suggestions, setSuggestions]   = useState<NominatimResult[]>([]);
  const [searching, setSearching]       = useState(false);
  const [reversing, setReversing]       = useState(false);
  const [geoCenter, setGeoCenter]       = useState<[number, number] | null>(null);

  const debouncedQuery = useDebounce(query, 600);

  // Open: snapshot current value into temp, optionally geolocate
  const handleOpen = () => {
    setTemp(value);
    setQuery('');
    setSuggestions([]);
    setGeoCenter(null);
    setOpen(true);

    if (autoGeolocate && !value && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoCenter([pos.coords.latitude, pos.coords.longitude]),
        () => { /* silently ignore */ },
        { timeout: 5000 }
      );
    }
  };

  // Forward geocoding (search bar)
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) { setSuggestions([]); return; }
    setSearching(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=5&countrycodes=co&accept-language=es`,
      { headers: { 'Accept-Language': 'es' } }
    )
      .then(r => r.json())
      .then((data: NominatimResult[]) => setSuggestions(data))
      .catch(() => setSuggestions([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  // Reverse geocoding (map click)
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setReversing(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
      );
      const data = await res.json();
      setTemp({ address: data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
    } catch {
      setTemp({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
    } finally {
      setReversing(false);
    }
  }, []);

  // Select suggestion
  const handleSuggestion = (s: NominatimResult) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setTemp({ address: s.display_name, lat, lng });
    setQuery('');
    setSuggestions([]);
  };

  const handleConfirm = () => { onChange(temp); setOpen(false); };
  const handleClear   = (e: React.MouseEvent) => { e.stopPropagation(); onChange(null); };

  const initialCenter: [number, number] = value
    ? [value.lat, value.lng]
    : geoCenter ?? defaultCenter ?? BOGOTA;
  const initialZoom = value ? 15 : (geoCenter || defaultCenter) ? 15 : 12;

  return (
    <div>
      {label && <label className="label">{label}</label>}

      {/* ── Trigger field ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={e => e.key === 'Enter' && handleOpen()}
        className={`input flex items-center gap-2 cursor-pointer min-h-[42px] ${error ? 'input-error' : ''}`}
      >
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        {value
          ? <span className="flex-1 text-sm text-gray-900 line-clamp-1">{value.address}</span>
          : <span className="flex-1 text-sm text-gray-400">{placeholder ?? 'Seleccionar ubicación en mapa...'}</span>
        }
        {value ? (
          <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 p-0.5 rounded flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}

      {/* ── Modal ── */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in flex flex-col"
            style={{ maxHeight: '90vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {label ? `Seleccionar ${label.toLowerCase()}` : 'Seleccionar ubicación'}
              </h3>
              <button type="button" onClick={() => setOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search bar */}
            <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0 relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="input pl-9 pr-9"
                  placeholder="Buscar dirección o lugar en Colombia..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                />
                {searching && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute left-5 right-5 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[10000]">
                  {suggestions.map(s => (
                    <button
                      key={s.place_id}
                      type="button"
                      className="w-full flex items-start gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      onClick={() => handleSuggestion(s)}
                    >
                      <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <span className="text-sm text-gray-700 line-clamp-2">{s.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="relative h-72 md:h-80 flex-shrink-0">
              {reversing && (
                <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/60 pointer-events-none">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 z-[400] bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
                Haz clic en el mapa para colocar un pin
              </span>
              <PickerMap
                initialCenter={initialCenter}
                initialZoom={initialZoom}
                temp={temp}
                geoCenter={geoCenter}
                onMapClick={handleMapClick}
              />
            </div>

            {/* Selected location preview */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex-shrink-0 min-h-[52px] flex items-center gap-2">
              {temp ? (
                <>
                  <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <p className="text-sm text-gray-700 line-clamp-2 flex-1">{temp.address}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {temp.lat.toFixed(4)}, {temp.lng.toFixed(4)}
                  </span>
                </>
              ) : (
                <p className="text-sm text-gray-400">Ninguna ubicación seleccionada aún</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button type="button" className="btn-outline flex-1 text-sm" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary flex-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleConfirm}
                disabled={!temp}
              >
                Confirmar ubicación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
