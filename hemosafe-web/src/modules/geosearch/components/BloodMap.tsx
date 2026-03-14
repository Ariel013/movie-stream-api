'use client';

import { useEffect, useRef } from 'react';
import type { BloodBankSummary } from '@/shared/types/blood.types';

interface BloodMapProps {
  center: [number, number];
  radiusKm: number;
  banks: BloodBankSummary[];
  onBankSelect: (bank: BloodBankSummary) => void;
}

/**
 * Leaflet map rendered client-side only (no SSR).
 * Shows nearby blood banks as markers with stock info popups.
 */
export function BloodMap({ center, radiusKm, banks, onBankSelect }: BloodMapProps) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    // Dynamic import keeps Leaflet out of the SSR bundle
    import('leaflet').then((L) => {
      const map = L.map(mapRef.current!).setView(center, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Search radius circle
      L.circle(center, { radius: radiusKm * 1000, color: '#dc2626', fillOpacity: 0.05 })
        .addTo(map);

      // Hospital position marker
      L.marker(center, {
        icon: L.divIcon({ className: 'hospital-marker', html: '🏥', iconSize: [30, 30] }),
      }).addTo(map).bindPopup('Your hospital');

      // Blood bank markers
      banks.forEach((bank) => {
        L.marker([bank.lat, bank.lng], {
          icon: L.divIcon({ className: 'bank-marker', html: '🩸', iconSize: [30, 30] }),
        })
          .addTo(map)
          .bindPopup(
            `<b>${bank.name}</b><br/>
             ${bank.availableCount} bag(s) available<br/>
             ${bank.distanceKm} km away`,
          )
          .on('click', () => onBankSelect(bank));
      });

      leafletRef.current = map;
    });

    return () => {
      leafletRef.current?.remove();
      leafletRef.current = null;
    };
  }, []);  // intentionally run once; use imperative Leaflet API for updates

  return <div ref={mapRef} className="h-full w-full rounded-lg" />;
}
