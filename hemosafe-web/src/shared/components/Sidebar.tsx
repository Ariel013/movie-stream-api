'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, UserRole } from '@/shared/store/auth.store';
import clsx from 'clsx';

interface NavItem {
  label: string;
  icon: string;
  href: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', href: '/dashboard', roles: ['ADMIN', 'HOSPITAL', 'BLOOD_BANK'] },
  { label: 'Stock', icon: 'inventory_2', href: '/dashboard/stock', roles: ['ADMIN', 'BLOOD_BANK'] },
  { label: 'Reservations', icon: 'event_upcoming', href: '/dashboard/reservations', roles: ['ADMIN', 'HOSPITAL', 'BLOOD_BANK'] },
  { label: 'Blood Search', icon: 'search_check', href: '/dashboard/blood-search', roles: ['HOSPITAL'] },
  { label: 'Donors', icon: 'favorite', href: '/dashboard/donors', roles: ['ADMIN', 'BLOOD_BANK'] },
  { label: 'Patients', icon: 'personal_injury', href: '/dashboard/patients', roles: ['HOSPITAL'] },
  { label: 'Directory', icon: 'local_hospital', href: '/dashboard/directory', roles: ['ADMIN', 'HOSPITAL', 'BLOOD_BANK'] },
  { label: 'Map', icon: 'map', href: '/dashboard/map', roles: ['ADMIN', 'HOSPITAL'] },
  { label: 'Statistics', icon: 'bar_chart', href: '/dashboard/statistics', roles: ['ADMIN'] },
  { label: 'Notifications', icon: 'notifications', href: '/dashboard/notifications', roles: ['ADMIN', 'HOSPITAL', 'BLOOD_BANK'] },
  { label: 'Logs', icon: 'history', href: '/dashboard/logs', roles: ['ADMIN'] },
  { label: 'Settings', icon: 'settings', href: '/dashboard/settings', roles: ['ADMIN', 'HOSPITAL', 'BLOOD_BANK'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'HOSPITAL';

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-surface-container-low flex flex-col fixed h-full z-20 border-r border-outline-variant/10">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-outline-variant/10">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-on-primary">
          <span className="material-symbols-outlined filled text-[20px]">bloodtype</span>
        </div>
        <div>
          <h2 className="text-sm font-bold leading-none font-headline text-on-surface">HEMOSAFE</h2>
          <p className="text-[10px] text-on-surface-variant mt-0.5">National Blood Network</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors',
                isActive
                  ? 'bg-surface-container-highest text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              <span className={clsx('material-symbols-outlined text-[20px]', isActive && 'filled')}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Offline widget */}
      <div className="p-4 mt-auto border-t border-outline-variant/10">
        <div className="bg-surface-container p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-[16px]">person</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate text-on-surface">
                {user ? `${user.firstName} ${user.lastName}` : '—'}
              </p>
              <p className="text-[10px] text-on-surface-variant capitalize">
                {role === 'BLOOD_BANK' ? 'Blood Bank Officer' : role === 'HOSPITAL' ? 'Hospital Staff' : 'Administrator'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
