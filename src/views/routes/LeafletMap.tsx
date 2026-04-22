'use client';
import 'leaflet/dist/leaflet.css';
import { useRef, useLayoutEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
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
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    return () => {
      if (wrapper) {
        const lc = wrapper.querySelector('.leaflet-container') as (HTMLDivElement & { _leaflet_id?: number }) | null;
        if (lc) delete lc._leaflet_id;
      }
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#45acab', weight: 4, opacity: 0.85 }}
          />
        )}
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>
            <strong>Origen</strong><br />{origin.address}
          </Popup>
        </Marker>
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>
            <strong>Destino</strong><br />{destination.address}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
