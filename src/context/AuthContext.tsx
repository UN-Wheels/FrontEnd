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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Adapta la respuesta del backend (snake_case, campos distintos) al tipo User del frontend
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiUser(data: any): User {
  return {
    id: String(data.id),
    fullName: data.name ?? data.fullName ?? '',
    email: data.email,
    university: data.major ?? data.university ?? '',
    profilePicture: data.profile_picture ?? data.profilePicture,
    averageRating: data.rating ?? data.averageRating ?? 0,
    totalTrips: data.total_trips ?? data.totalTrips ?? 0,
    createdAt: data.created_at ?? data.createdAt ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  //Check sesión al cargar la app
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(mapApiUser(data));
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  //LOGIN
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username: credentials.email, password: credentials.password }),
      });

      if (!res.ok) {
        throw new Error("Credenciales inválidas");
      }

      //Obtener usuario después del login
      const userRes = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });

      if (!userRes.ok) {
        throw new Error("No se pudo obtener el usuario");
      }

      const userData = await userRes.json();
      setUser(mapApiUser(userData));

    } finally {
      setIsLoading(false);
    }
  };

// REGISTER
const register = async (data: RegisterData): Promise<void> => {
  setIsLoading(true);
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.fullName,
        email: data.email,
        password: data.password,
        phone_number: data.phone_number,
        gender: data.gender,
        major: data.major,
        age: data.age,
        role: data.role,
      }),
      credentials: "include", // IMPORTANTE para el login automático posterior
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al registrar usuario");
    }

    await login({
      email: data.email,
      password: data.password,
      rememberMe: true,
    });
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

  //LOGOUT
  const logout = async (): Promise<void> => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
  };

  //UPDATE USER LOCAL
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
