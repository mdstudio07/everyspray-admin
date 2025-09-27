'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  return <>{children}</>;
}