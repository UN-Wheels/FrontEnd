import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo purposes
const mockUser: User = {
  id: '1',
  fullName: 'Juan García',
  email: 'juan.garcia@universidad.edu.co',
  university: 'Universidad de los Andes',
  profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  averageRating: 4.8,
  totalTrips: 23,
  createdAt: '2024-01-15',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('uniwheels_token');
    if (token) {
      // Simulate fetching user data
      setUser(mockUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation
      if (!credentials.email.includes('@') || credentials.password.length < 8) {
        throw new Error('Invalid credentials');
      }

      // Store token
      const mockToken = 'mock_jwt_token_' + Date.now();
      if (credentials.rememberMe) {
        localStorage.setItem('uniwheels_token', mockToken);
      } else {
        sessionStorage.setItem('uniwheels_token', mockToken);
      }

      setUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock user with registration data
      const newUser: User = {
        id: String(Date.now()),
        fullName: data.fullName,
        email: data.email,
        university: data.university,
        averageRating: 0,
        totalTrips: 0,
        createdAt: new Date().toISOString(),
      };

      // Store token
      const mockToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('uniwheels_token', mockToken);

      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('uniwheels_token');
    sessionStorage.removeItem('uniwheels_token');
    setUser(null);
  };

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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
