'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';

type NotifType = 'reservation' | 'alert' | 'system' | 'transfer';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFS: Notification[] = [
  { id: '1', type: 'reservation', title: 'Reservation Confirmed', description: 'RES-0041 (O+ × 4 bags) has been confirmed by City Central Blood Bank.', time: '2 min ago', read: false },
  { id: '2', type: 'alert', title: 'Critical Stock Alert', description: 'AB- blood type is critically low at North Regional Blood Bank (< 5 bags remaining).', time: '8 min ago', read: false },
  { id: '3', type: 'transfer', title: 'Transfer Dispatched', description: 'Transfer #T-0047 is now en route to St. Mary General Hospital.', time: '15 min ago', read: false },
  { id: '4', type: 'reservation', title: 'Reservation Expired', description: 'RES-0033 (O- × 1 bag) has expired without pickup and bags have been released.', time: '1 hr ago', read: true },
  { id: '5', type: 'alert', title: 'Expiry Warning', description: '8 blood bags at City Central Blood Bank will expire within 48 hours.', time: '2 hr ago', read: true },
  { id: '6', type: 'system', title: 'System Maintenance', description: 'Scheduled database synchronization completed successfully.', time: '3 hr ago', read: true },
  { id: '7', type: 'reservation', title: 'New Reservation Request', description: 'Riverside Clinic has requested AB- × 2 bags. Awaiting your confirmation.', time: '4 hr ago', read: true },
  { id: '8', type: 'alert', title: 'Donor Screening Complete', description: 'Batch #203 of 12 donor screenings has been completed. 10 eligible.', time: '5 hr ago', read: true },
  { id: '9', type: 'system', title: 'New Hospital Registered', description: 'Riverside Medical Center (Oran) has been registered and is now active.', time: '6 hr ago', read: true },
  { id: '10', type: 'transfer', title: 'Transfer Delivered', description: 'Transfer #T-0045 (A+ × 6 bags) was confirmed received by City Hospital.', time: '8 hr ago', read: true },
];

const ICONS: Record<NotifType, string> = {
  reservation: 'event_upcoming',
  alert: 'warning',
  system: 'info',
  transfer: 'local_shipping',
};

const ICON_BG: Record<NotifType, string> = {
  reservation: 'bg-secondary-container text-secondary',
  alert: 'bg-error-container text-primary',
  system: 'bg-surface-container text-on-surface-variant',
  transfer: 'bg-tertiary-fixed/40 text-tertiary',
};

type FilterTab = 'all' | 'unread' | NotifType;

export default function NotificationsPage() {
  const [tab, setTab] = useState<FilterTab>('all');
  const [notifs, setNotifs] = useState<Notification[]>(MOCK_NOTIFS);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const filtered = notifs.filter((n) => {
    if (tab === 'unread') return !n.read;
    if (tab !== 'all') return n.type === tab;
    return true;
  });

  const TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: notifs.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'reservation', label: 'Reservations' },
    { key: 'alert', label: 'Alerts' },
    { key: 'system', label: 'System' },
  ];

  return (
    <div>
      <TopBar title="Notifications" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Notifications</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors ${tab === t.key ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.key === 'unread' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`bg-surface-container-lowest rounded-2xl p-5 ambient-shadow cursor-pointer transition-all ${!n.read ? 'border-l-4 border-primary bg-error-container/5' : 'border border-transparent hover:border-outline-variant/20'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG[n.type]}`}>
                  <span className="material-symbols-outlined text-[20px]">{ICONS[n.type]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-bold text-sm ${!n.read ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {n.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase">{n.time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{n.description}</p>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">notifications_off</span>
              <p className="text-on-surface-variant font-medium mt-4">No notifications in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
