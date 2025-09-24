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
      
      // Limpiar localStorage, sessionStorage y tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.clear();
      sessionStorage.clear();
      
      // Forzar recarga completa para limpiar cualquier estado residual
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      // En caso de error, limpiar el estado local de todas formas
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
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
    const debug = (window as any).__AUTH_DEBUG__ || true; // Temporalmente siempre activo
    const log = (...args: any[]) => { if (debug) console.log('[auth]', ...args); };
    
    try {
      setLoading(true);
      log('Checking session...');
      
      // Intentar obtener token de localStorage primero
      const accessToken = localStorage.getItem('access_token');
      log('Access token from localStorage:', !!accessToken);
      
      // Crear headers para la petición
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // Intentar /auth/session con token en header o cookies
      const sessionResp = await fetch(getApiUrl('/auth/session'), { 
        credentials: 'include',  // Para cookies legacy
        headers 
      });
      
      if (sessionResp.status === 404) {
        log('Session endpoint 404 -> falling back to legacy /auth/me flow');
        try {
          const userData = await api.getCurrentUser();
          setUser(userData);
          log('Legacy /auth/me success');
        } catch (primaryErr: any) {
          log('Legacy /auth/me failed:', primaryErr?.message);
          // Limpiar tokens inválidos
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
        return;
      }
      
      const sessionData = await sessionResp.json().catch(() => ({}));
      if (sessionData.authenticated && sessionData.user) {
        setUser(sessionData.user);
        log('Session OK as', sessionData.user.email);
      } else {
        log('Session reports anonymous');
        // Si tenemos token pero el servidor dice que no estamos autenticados, limpiar tokens
        if (accessToken) {
          log('Cleaning invalid tokens');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        setUser(null);
      }
    } catch (e) {
      log('Session check error:', (e as any)?.message);
      setUser(null);
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


