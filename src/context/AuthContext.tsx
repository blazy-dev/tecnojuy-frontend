import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';
import { config, getApiUrl } from '@/lib/config';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isAlumno: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = () => {
    window.location.href = getApiUrl(config.endpoints.auth.googleLogin);
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      
      // Limpiar localStorage y sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Forzar recarga completa para limpiar cualquier estado residual
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      // En caso de error, limpiar el estado local de todas formas
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // Si el token ha expirado, intentar renovarlo
      try {
        await api.refreshToken();
        const userData = await api.getCurrentUser();
        setUser(userData);
      } catch (refreshError) {
        console.error('Auth check failed:', refreshError);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const isAdmin = user?.role_name === 'admin';
  const isAlumno = user?.role_name === 'alumno';

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAdmin,
    isAlumno
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook para proteger rutas
export function useRequireAuth(requiredRole?: 'admin' | 'alumno') {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login';
        return;
      }

      if (requiredRole && user.role_name !== requiredRole) {
        window.location.href = '/unauthorized';
        return;
      }
    }
  }, [user, loading, requiredRole]);

  return { user, loading };
}

// Hook para rutas de admin
export function useRequireAdmin() {
  return useRequireAuth('admin');
}

// Hook para rutas de alumno
export function useRequireAlumno() {
  return useRequireAuth('alumno');
}


