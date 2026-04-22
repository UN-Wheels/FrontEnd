'use client';
import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { createQueryClient } from '@/hooks/queries';

export function Providers({ children }: { children: React.ReactNode }) {
  // useState garantiza que el QueryClient no se recrea en cada render
  const [queryClient] = useState(() => createQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
