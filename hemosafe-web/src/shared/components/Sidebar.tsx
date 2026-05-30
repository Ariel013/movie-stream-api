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
  { label: 'Dashboard',    icon: 'dashboard',       href: '/dashboard',                    roles: ['ADMIN', 'HOSPITAL', 'BLOOD_BANK'] },
  { label: 'Stock',        icon: 'inventory_2',     href: '/dashboard/stock',              roles: ['ADMIN', 'BLOOD_BANK'] },
  { label: 'Reservations', icon: 'event_upcoming',  href: '/dashboard/reservations',       roles: ['ADMIN', 'HOSPITAL', 'BLOOD_BANK'] },
  { label: 'Blood Search', icon: 'search_check',    href: '/dashboard/blood-search',       roles: ['HOSPITAL'] },
  { label: 'Donors',       icon: 'favorite',        href: '/dashboard/donors',             roles: ['ADMIN', 'BLOOD_BANK'] },
  { label: 'Patients',     icon: 'personal_injury', href: '/dashboard/patients',           roles: ['HOSPITAL'] },
  { label: 'Directory',    icon: 'local_hospital',  href: '/dashboard/directory',          roles: ['ADMIN', 'HOSPITAL', 'BLOOD_BANK'] },
  { label: 'Map',          icon: 'map',             href: '/dashboard/map',                roles: ['ADMIN', 'HOSPITAL'] },
  { label: 'Statistics',   icon: 'bar_chart',       href: '/dashboard/statistics',         roles: ['ADMIN'] },
  { label: 'Notifications',icon: 'notifications',   href: '/dashboard/notifications',      roles: ['ADMIN', 'HOSPITAL', 'BLOOD_BANK'] },
  { label: 'Logs',         icon: 'history',         href: '/dashboard/logs',               roles: ['ADMIN'] },
  { label: 'Settings',     icon: 'settings',        href: '/dashboard/settings',           roles: ['ADMIN', 'HOSPITAL', 'BLOOD_BANK'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'HOSPITAL';

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-72 bg-surface-container-low flex flex-col fixed h-full z-20">

      {/* Logo */}
      <div className="p-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
          <span className="material-symbols-outlined">bloodtype</span>
        </div>
        <div>
          <h2 className="text-on-surface font-extrabold text-lg leading-tight font-headline">National Blood Bank</h2>
          <p className="text-on-surface-variant text-xs font-medium">Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-colors',
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

      {/* Offline sync widget */}
      <div className="p-6 bg-surface-container-high m-4 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Offline mode</span>
        </div>
        <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
          Data will sync when connection returns
        </p>
        <button className="w-full py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary-container transition-colors">
          Sync Now
        </button>
      </div>
    </aside>
  );
}
