'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import api from '@/shared/lib/api';

type NotifType =
  | 'LOW_STOCK'
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_EXPIRED'
  | 'BAG_EXPIRING_SOON'
  | 'TRANSFER_RECEIVED'
  | 'PRESCRIPTION_FILLED'
  | 'SYSTEM';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const ICONS: Record<string, string> = {
  LOW_STOCK:             'warning',
  RESERVATION_CONFIRMED: 'event_upcoming',
  RESERVATION_EXPIRED:   'event_busy',
  BAG_EXPIRING_SOON:     'hourglass_bottom',
  TRANSFER_RECEIVED:     'local_shipping',
  PRESCRIPTION_FILLED:   'medication',
  SYSTEM:                'info',
};

const ICON_BG: Record<string, string> = {
  LOW_STOCK:             'bg-error-container text-primary',
  RESERVATION_CONFIRMED: 'bg-tertiary-fixed/40 text-tertiary',
  RESERVATION_EXPIRED:   'bg-surface-container text-on-surface-variant',
  BAG_EXPIRING_SOON:     'bg-amber-100 text-amber-700',
  TRANSFER_RECEIVED:     'bg-secondary-container text-secondary',
  PRESCRIPTION_FILLED:   'bg-secondary-container text-secondary',
  SYSTEM:                'bg-surface-container text-on-surface-variant',
};

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1)    return 'à l\'instant';
  if (mins < 60)   return `il y a ${mins} min`;
  if (mins < 1440) return `il y a ${Math.floor(mins / 60)} h`;
  return `il y a ${Math.floor(mins / 1440)} j`;
}

type FilterTab = 'all' | 'unread';

export default function NotificationsPage() {
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<FilterTab>('all');

  const fetchNotifs = () => {
    api.get('/notifications', { params: { limit: 50 } })
      .then((res) => setNotifs(res.data.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifs(); }, []);

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    if (notifs.find((n) => n.id === id)?.isRead) return;
    await api.patch(`/notifications/${id}/read`);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const filtered = tab === 'unread' ? notifs.filter((n) => !n.isRead) : notifs;

  return (
    <div>
      <TopBar title="Notifications" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Notifications</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {loading ? 'Chargement...' : unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour !'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 w-fit">
          {([
            { key: 'all'    as FilterTab, label: 'Toutes',    count: notifs.length },
            { key: 'unread' as FilterTab, label: 'Non lues',  count: unreadCount   },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors ${tab === t.key ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.key === 'unread' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-[32px] text-on-surface-variant/40">refresh</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`bg-surface-container-lowest rounded-2xl p-5 ambient-shadow cursor-pointer transition-all ${!n.isRead ? 'border-l-4 border-primary bg-error-container/5' : 'border border-transparent hover:border-outline-variant/20'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG[n.type] ?? 'bg-surface-container text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[20px]">{ICONS[n.type] ?? 'notifications'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-bold text-sm ${!n.isRead ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {n.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase">{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{n.body}</p>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">notifications_off</span>
                <p className="text-on-surface-variant font-medium mt-4">Aucune notification dans cette catégorie.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
