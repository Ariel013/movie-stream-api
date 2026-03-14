'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { registerServiceWorker } from '@/shared/offline/sw-registration';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  );

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
