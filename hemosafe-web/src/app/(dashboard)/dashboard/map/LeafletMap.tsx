'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
// @ts-ignore — Leaflet CSS imported as side-effect, no type declarations needed
import 'leaflet/dist/leaflet.css';

interface BloodBank {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  available: number;
  status: string;
  lat: number;
  lng: number;
}

interface Props {
  banks: BloodBank[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  online:   '#006357',
  low:      '#f59e0b',
  critical: '#af101a',
};

function FlyTo({ banks, selectedId }: { banks: BloodBank[]; selectedId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const bank = banks.find((b) => b.id === selectedId);
    if (bank) map.flyTo([bank.lat, bank.lng], 11, { duration: 0.8 });
  }, [selectedId, banks, map]);
  return null;
}

export default function LeafletMap({ banks, selectedId, onSelect }: Props) {
  const center: [number, number] = [6.5, -5.5];

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ width: '100%', height: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyTo banks={banks} selectedId={selectedId} />

      {banks.map((bank) => (
        <CircleMarker
          key={bank.id}
          center={[bank.lat, bank.lng]}
          radius={selectedId === bank.id ? 14 : 10}
          pathOptions={{
            fillColor:   STATUS_COLOR[bank.status],
            fillOpacity: 0.9,
            color:       '#fff',
            weight:      2,
          }}
          eventHandlers={{ click: () => onSelect(bank.id) }}
        >
          <Popup>
            <div className="text-sm min-w-[180px]">
              <p className="font-bold mb-1">{bank.name}</p>
              <p className="text-gray-500 text-xs mb-2">{bank.address}</p>
              <p className="font-bold" style={{ color: STATUS_COLOR[bank.status] }}>
                {bank.available} bags disponibles
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
