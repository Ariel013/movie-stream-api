'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/shared/components/Sidebar';
import { Footer } from '@/shared/components/Footer';
import { OfflineIndicator } from '@/shared/components/OfflineIndicator';
import { useAuthStore } from '@/shared/store/auth.store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
        <Footer />
        <OfflineIndicator />
      </div>
    </div>
  );
}
