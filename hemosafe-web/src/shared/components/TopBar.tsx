'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/store/auth.store';
import api from '@/shared/lib/api';
import Link from 'next/link';

const ROLE_LABELS = {
  ADMIN: 'Admin Role',
  HOSPITAL: 'Hospital Role',
  BLOOD_BANK: 'Blood Bank Role',
};

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
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
    <header className="h-16 glass-nav border-b border-outline-variant/10 sticky top-0 z-10 flex items-center justify-between px-8">
      {/* Left */}
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-extrabold text-on-surface tracking-tight font-headline">{title}</h1>
        )}
        {user && (
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
            <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search..."
            className="bg-surface-container-low border-none rounded-full py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-primary/20 w-52"
          />
        </div>

        {/* Online indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-tertiary-container/10 text-tertiary rounded-full">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          <span className="text-xs font-semibold">System Online</span>
        </div>

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
        </Link>

        {/* Avatar + logout */}
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-on-surface">
              {user ? `${user.firstName} ${user.lastName}` : '—'}
            </p>
            <p className="text-[10px] text-on-surface-variant font-medium">
              {user?.facilityName ?? user?.email ?? ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white text-[16px] hover:opacity-90 transition-opacity"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
