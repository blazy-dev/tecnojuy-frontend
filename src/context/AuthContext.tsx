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
    const debug = (window as any).__AUTH_DEBUG__;
    const log = (...args: any[]) => { if (debug) console.log('[auth]', ...args); };
    try {
      setLoading(true);
      log('Checking auth...');
      const userData = await api.getCurrentUser();
      setUser(userData);
      log('Authenticated as', userData.email);
    } catch (error: any) {
      log('Primary /auth/me failed:', error?.message);
      const hasRefresh = typeof document !== 'undefined' && document.cookie.includes('refresh_token=');
      if (!hasRefresh) {
        // No hay cookies todavía (usuario anónimo o primera visita)
        log('No refresh token present; treating as anonymous');
        setUser(null);
      } else {
        // Intentar un único refresh
        try {
          log('Attempting token refresh...');
            await api.refreshToken();
            const userData = await api.getCurrentUser();
            setUser(userData);
            log('Refresh succeeded');
        } catch (refreshError) {
          log('Refresh failed:', refreshError);
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Pequeño defer para asegurar que cookies post-redirect estén disponibles
    const t = setTimeout(() => { checkAuth(); }, 50);
    return () => clearTimeout(t);
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


