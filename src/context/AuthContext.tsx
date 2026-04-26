'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL  = process.env.NEXT_PUBLIC_API_URL ?? '';
const CACHE_KEY = 'uniwheels_user_cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiUser(data: any): User {
  return {
    id:             String(data.id),
    fullName:       data.name        ?? data.fullName  ?? '',
    email:          data.email,
    university:     data.major       ?? data.university ?? '',
    profilePicture: data.profile_picture ?? data.profilePicture,
    averageRating:  data.rating      ?? data.averageRating ?? 0,
    totalTrips:     data.total_trips ?? data.totalTrips    ?? 0,
    createdAt:      data.created_at  ?? data.createdAt     ?? new Date().toISOString(),
  };
}

function readCache(): User | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}

function writeCache(u: User | null) {
  try {
    if (u) sessionStorage.setItem(CACHE_KEY, JSON.stringify(u));
    else    sessionStorage.removeItem(CACHE_KEY);
  } catch { /* storage full / private mode */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Siempre arranca igual en servidor y cliente — evita hydration mismatch.
  // La caché se lee en useEffect (solo cliente).
  const [user,      setUser]      = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = readCache();

    const validate = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const mapped = mapApiUser(await res.json());
          setUser(mapped);
          writeCache(mapped);
        } else {
          setUser(null);
          writeCache(null);
        }
      } catch {
        // Error de red: si había caché la mantenemos para no romper la sesión
        if (!cached) setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (cached) {
      // Stale-while-revalidate: muestra caché instantáneamente, revalida en background
      setUser(cached);
      setIsLoading(false);
      validate();
    } else {
      validate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: credentials.email, password: credentials.password }),
      });
      if (!res.ok) throw new Error('Credenciales inválidas');

      const userRes = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
      if (!userRes.ok) throw new Error('No se pudo obtener el usuario');

      const mapped = mapApiUser(await userRes.json());
      setUser(mapped);
      writeCache(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name:         data.fullName,
          email:        data.email,
          password:     data.password,
          phone_number: data.phone_number,
          gender:       data.gender,
          major:        data.major,
          age:          data.age,
          role:         data.role,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al registrar usuario');
      }
      await login({ email: data.email, password: data.password, rememberMe: true });
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    writeCache(null);
    setUser(null);
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...userData };
    setUser(updated);
    writeCache(updated);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
