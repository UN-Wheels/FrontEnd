import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../ui/Loading';

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-dark via-secondary-medium to-secondary flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
<<<<<<< HEAD
          <h1 className="text-3xl font-bold text-white"><span className="text-primary">UN</span> Wheels</h1>
=======
          <h1 className="text-3xl font-bold text-white">UN Wheels</h1>
>>>>>>> 6c3bc753c6657ba631ffbe3125905755928eabc9
          <p className="text-gray-300 mt-2">Viajen juntos, ahorren juntos</p>
        </div>

        <div className="bg-[#151b3d] rounded-2xl shadow-xl p-8 animate-fade-in border border-white/5">
          <Outlet />
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          &copy; {new Date().getFullYear()} UN Wheels. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}