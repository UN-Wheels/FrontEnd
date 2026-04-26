'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../ui/Loading';
import logo from '../../assets/logo.png';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #07091a 0%, #0a0f28 50%, #0a1830 100%)' }}
    >
      {/* Dot-map background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='1' fill='%2345acab' fill-opacity='0.10'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient teal glow from top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(69,172,171,0.13) 0%, transparent 65%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-7">
          <img
            src={logo.src}
            alt="UN Wheels"
            className="h-20 mx-auto animate-fade-in"
            style={{ filter: 'drop-shadow(0 4px 20px rgba(69,172,171,0.35))' }}
          />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl px-8 py-8 animate-fade-in relative"
          style={{
            background: 'linear-gradient(160deg, #0e1730 0%, #0b1226 100%)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
            borderTop: '1px solid rgba(69,172,171,0.45)',
          }}
        >
          {children}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.18)' }}>
          &copy; {new Date().getFullYear()} UN Wheels &middot; Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
