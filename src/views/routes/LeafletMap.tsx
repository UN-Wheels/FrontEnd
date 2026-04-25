'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

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

interface LeafletMapProps {
  center: [number, number];
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  routeCoords: [number, number][];
}

export default function LeafletMap({ center, origin, destination, routeCoords }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const polylineRef  = useRef<L.Polyline | null>(null);

  // Initialize map imperatively. Clears _leaflet_id before L.map() so that
  // React 18.3 StrictMode's callback-ref double-invoke doesn't throw
  // "Map container is being reused by another instance".
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    (el as unknown as Record<string, unknown>)._leaflet_id = undefined;

    const map = L.map(el, { scrollWheelZoom: true }).setView(center, 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.marker([origin.lat, origin.lng], { icon: originIcon })
      .bindPopup(`<strong>Origen</strong><br/>${origin.address}`)
      .addTo(map);

    L.marker([destination.lat, destination.lng], { icon: destinationIcon })
      .bindPopup(`<strong>Destino</strong><br/>${destination.address}`)
      .addTo(map);

    return () => {
      map.remove();
      mapRef.current     = null;
      polylineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw polyline whenever routeCoords change (arrives async from OSRM).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    polylineRef.current?.remove();
    polylineRef.current = null;

    if (routeCoords.length > 0) {
      polylineRef.current = L.polyline(routeCoords, {
        color: '#45acab',
        weight: 4,
        opacity: 0.85,
      }).addTo(map);
      map.fitBounds(polylineRef.current.getBounds(), { padding: [32, 32] });
    }
  }, [routeCoords]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
