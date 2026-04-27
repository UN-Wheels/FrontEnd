'use client';
import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { createQueryClient } from '@/hooks/queries';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          {children}
          <Toaster
            position="top-right"
            closeButton
            gap={8}
            toastOptions={{
              style: {
                fontFamily: 'inherit',
                borderRadius: '12px',
                fontSize: '13px',
                border: '1px solid #E0E7FF',
                boxShadow: '0 8px 24px -4px rgba(30,27,75,0.14)',
              },
              classNames: {
                toast:       'items-start',
                icon:        'mt-0.5 mr-1 flex-shrink-0',
                content:     'ml-1',
                title:       'font-semibold text-gray-900 text-[13px]',
                description: 'text-gray-500 text-[12px] mt-0.5',
                actionButton:'!bg-primary !text-white !text-[11px] !font-semibold !rounded-lg !px-3 !py-1.5',
              },
            }}
          />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
