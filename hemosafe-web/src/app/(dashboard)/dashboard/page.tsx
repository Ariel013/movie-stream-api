'use client';

import { useAuthStore } from '@/shared/store/auth.store';
import { AdminDashboard } from '@/modules/dashboard/AdminDashboard';
import { HospitalDashboard } from '@/modules/dashboard/HospitalDashboard';
import { BloodBankDashboard } from '@/modules/dashboard/BloodBankDashboard';

export default function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role);

  if (role === 'ADMIN') return <AdminDashboard />;
  if (role === 'HOSPITAL') return <HospitalDashboard />;
  if (role === 'BLOOD_BANK') return <BloodBankDashboard />;

  return null;
}
