'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/store/auth.store';
import api from '@/shared/lib/api';

const ROLE_LABELS = {
  ADMIN: 'Admin Role',
  HOSPITAL: 'Hospital Role',
  BLOOD_BANK: 'Blood Bank Role',
};

const ROLE_ICONS = {
  ADMIN: 'admin_panel_settings',
  HOSPITAL: 'medical_services',
  BLOOD_BANK: 'bloodtype',
};

export function TopBar(_: { title?: string } = {}) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      router.push('/auth/login');
    }
  };

  return (
    <header className="glass-nav sticky top-0 z-10 px-10 py-4 flex items-center justify-between">

      {/* Left – app name + search */}
      <div className="flex items-center gap-8 w-1/2">
        <h1 className="text-xl font-bold text-primary font-headline whitespace-nowrap">BloodConnect</h1>
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input
            type="text"
            placeholder="Search across clinical records..."
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">

        {/* Role badge */}
        {user && (
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary-container rounded-full">
            <span className="material-symbols-outlined text-sm text-secondary">{ROLE_ICONS[user.role]}</span>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter">{ROLE_LABELS[user.role]}</span>
          </div>
        )}

        {/* Notifications */}
        <button className="relative text-on-surface-variant">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface">
              {user ? `${user.firstName} ${user.lastName}` : '—'}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              {user?.facilityName ?? user?.email ?? ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
