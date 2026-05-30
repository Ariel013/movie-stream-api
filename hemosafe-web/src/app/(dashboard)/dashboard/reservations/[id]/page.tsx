'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopBar } from '@/shared/components/TopBar';
import { useAuthStore } from '@/shared/store/auth.store';
import api from '@/shared/lib/api';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'EXPIRED' | 'CANCELLED';

interface ReservationDetail {
  id: string;
  code: string;
  status: ReservationStatus;
  urgency: string;
  quantity: number;
  notes: string | null;
  expiresAt: string;
  confirmedAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  hospital:  { id: string; name: string; address: string };
  bloodBank: { id: string; name: string; address: string };
  bloodType: { label: string };
  reservationBags: Array<{ bloodBag: { code: string; expiresAt: string; volumeMl: number } }>;
}

const STATUS_STYLE: Record<ReservationStatus, string> = {
  PENDING:    'bg-amber-100 text-amber-700',
  CONFIRMED:  'bg-tertiary-fixed/40 text-tertiary',
  DISPATCHED: 'bg-secondary-container text-secondary',
  DELIVERED:  'bg-surface-container text-on-surface-variant',
  EXPIRED:    'bg-surface-dim text-on-surface-variant',
  CANCELLED:  'bg-error-container text-on-error-container',
};

const URGENCY_STYLE: Record<string, string> = {
  ROUTINE:   'bg-surface-container text-on-surface-variant',
  URGENT:    'bg-amber-100 text-amber-700',
  EMERGENCY: 'bg-error-container text-primary',
};

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const role    = useAuthStore((s) => s.user?.role);

  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Status transition state
  const [transitioning, setTransitioning] = useState(false);
  const [cancelReason, setCancelReason]   = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [actionError, setActionError]     = useState('');

  const fetchReservation = async () => {
    try {
      const res = await api.get(`/reservations/${id}`);
      setReservation(res.data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Réservation introuvable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservation(); }, [id]);

  const transition = async (status: ReservationStatus, reason?: string) => {
    setTransitioning(true);
    setActionError('');
    try {
      await api.patch(`/reservations/${id}/status`, { status, cancelReason: reason });
      await fetchReservation();
      setShowCancelForm(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setActionError(typeof msg === 'string' ? msg : 'Action impossible.');
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Réservation" />
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined animate-spin text-[32px] text-on-surface-variant/40">refresh</span>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div>
        <TopBar title="Réservation" />
        <div className="p-8 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">error</span>
          <p className="text-on-surface-variant mt-4 font-medium">{error || 'Réservation introuvable.'}</p>
          <button onClick={() => router.back()} className="mt-4 text-sm font-bold text-primary hover:underline">
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  const r = reservation;
  const canConfirm  = role === 'BLOOD_BANK'  && r.status === 'PENDING';
  const canDispatch = role === 'BLOOD_BANK'  && r.status === 'CONFIRMED';
  const canDeliver  = role === 'HOSPITAL'    && r.status === 'DISPATCHED';
  const canCancel   = (r.status === 'PENDING' || r.status === 'CONFIRMED');

  return (
    <div>
      <TopBar title="Détail de réservation" />
      <div className="p-8 max-w-4xl mx-auto space-y-6">

        {/* Back + header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">{r.code}</h2>
            <p className="text-sm text-on-surface-variant">Créée le {new Date(r.createdAt).toLocaleString('fr-CI')}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${STATUS_STYLE[r.status]}`}>{r.status}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${URGENCY_STYLE[r.urgency] ?? ''}`}>{r.urgency}</span>
          </div>
        </div>

        {/* Main info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Hôpital demandeur</p>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined filled text-secondary text-[20px]">local_hospital</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">{r.hospital.name}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{r.hospital.address}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Banque de sang</p>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined filled text-white text-[20px]">bloodtype</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">{r.bloodBank.name}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{r.bloodBank.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Blood + timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow text-center">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Groupe sanguin</p>
            <p className="text-4xl font-extrabold text-primary font-headline">{r.bloodType.label}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow text-center">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Quantité</p>
            <p className="text-4xl font-extrabold text-on-surface font-headline">{r.quantity}</p>
            <p className="text-xs text-on-surface-variant mt-1">poche{r.quantity > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow text-center">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Expire le</p>
            <p className="text-sm font-bold text-on-surface">{new Date(r.expiresAt).toLocaleString('fr-CI')}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">Suivi</p>
          <div className="space-y-3">
            {[
              { label: 'Créée',     value: r.createdAt,     always: true },
              { label: 'Confirmée', value: r.confirmedAt,   always: false },
              { label: 'Expédiée', value: r.dispatchedAt,  always: false },
              { label: 'Livrée',   value: r.deliveredAt,   always: false },
              { label: 'Annulée',  value: r.cancelledAt,   always: false },
            ].map(({ label, value, always }) =>
              (always || value) ? (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${value ? 'bg-tertiary' : 'bg-surface-dim'}`} />
                  <span className="text-xs font-bold text-on-surface w-24">{label}</span>
                  <span className="text-xs text-on-surface-variant">
                    {value ? new Date(value).toLocaleString('fr-CI') : '—'}
                  </span>
                </div>
              ) : null
            )}
            {r.cancelReason && (
              <p className="text-xs text-on-surface-variant ml-10 italic">Motif : {r.cancelReason}</p>
            )}
          </div>
        </div>

        {/* Allocated bags */}
        {r.reservationBags.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">
              Poches allouées ({r.reservationBags.length})
            </p>
            <div className="divide-y divide-outline-variant/10">
              {r.reservationBags.map(({ bloodBag: bag }) => (
                <div key={bag.code} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="font-mono font-bold text-on-surface">{bag.code}</span>
                  <span className="text-xs text-on-surface-variant">{bag.volumeMl} ml</span>
                  <span className="text-xs text-on-surface-variant">
                    Exp. {new Date(bag.expiresAt).toLocaleDateString('fr-CI')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {r.notes && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-on-surface">{r.notes}</p>
          </div>
        )}

        {/* Actions */}
        {actionError && (
          <p className="text-xs text-error font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">error</span>{actionError}
          </p>
        )}

        {(canConfirm || canDispatch || canDeliver || canCancel) && (
          <div className="flex flex-wrap gap-3">
            {canConfirm && (
              <button
                onClick={() => transition('CONFIRMED')}
                disabled={transitioning}
                className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Confirmer la réservation
              </button>
            )}
            {canDispatch && (
              <button
                onClick={() => transition('DISPATCHED')}
                disabled={transitioning}
                className="bg-secondary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                Marquer comme expédié
              </button>
            )}
            {canDeliver && (
              <button
                onClick={() => transition('DELIVERED')}
                disabled={transitioning}
                className="bg-tertiary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">inventory</span>
                Confirmer la réception
              </button>
            )}
            {canCancel && !showCancelForm && (
              <button
                onClick={() => setShowCancelForm(true)}
                className="border border-outline-variant text-on-surface-variant font-bold px-6 py-3 rounded-xl hover:bg-surface-container-low transition-colors text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                Annuler
              </button>
            )}
          </div>
        )}

        {showCancelForm && (
          <div className="bg-error-container/20 rounded-2xl p-6 border border-primary/20 space-y-3">
            <p className="text-sm font-bold text-on-surface">Motif d'annulation</p>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Expliquez la raison de l'annulation…"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => transition('CANCELLED', cancelReason)}
                disabled={transitioning || !cancelReason.trim()}
                className="gradient-primary text-white font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 text-sm"
              >
                Confirmer l'annulation
              </button>
              <button
                onClick={() => setShowCancelForm(false)}
                className="border border-outline-variant text-on-surface-variant font-bold px-5 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors text-sm"
              >
                Retour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
