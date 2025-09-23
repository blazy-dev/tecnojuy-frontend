import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <a href="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-secondary-900">TecnoJuy</span>
            </a>
            
            <h2 className="text-3xl font-bold text-secondary-900 mb-2">
              Bienvenido de vuelta
            </h2>
            <p className="text-secondary-600">
              Inicia sesión para continuar con tu aprendizaje
            </p>
          </div>

          {/* Login Card */}
          <div className="card max-w-md mx-auto">
            <LoginForm />
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-secondary-500">
            <p>
              ¿No tienes cuenta? Al iniciar sesión con Google se creará automáticamente.
            </p>
            <div className="mt-4">
              <a href="/" className="text-primary-600 hover:text-primary-500">
                ← Volver al inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

