'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Topbar } from './Topbar';
import { Loading } from '../ui/Loading';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect in progress — render nothing to avoid flash
  if (!isLoading && !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-dark via-secondary-medium to-secondary bg-fixed flex flex-col">
      <Topbar />

      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loading message="Verificando sesión..." />
            </div>
          ) : children}
        </div>
      </main>
    </div>
  );
}
