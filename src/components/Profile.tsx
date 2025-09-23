import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import FileUpload from '@/components/FileUpload';

function ProfileContent() {
  const { user, loading, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await api.updateUserProfile({ name, avatar_url: avatarUrl });
      await refreshUser();
      setMessage('Perfil actualizado correctamente');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err?.message || 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUploadSuccess = (url: string) => {
    setAvatarUrl(url);
    setMessage('Imagen subida correctamente');
  };

  const handleAvatarUploadError = (msg: string) => {
    setError(msg);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona tu información personal</p>
        </div>

        {(message || error) && (
          <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {error || message}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información de Usuario</h2>
          </div>
          <form onSubmit={handleSave} className="px-6 py-5 space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=ffffff`}
                alt={user.name}
                className="h-20 w-20 rounded-full object-cover"
              />
              <div>
                <div className="mb-3">
                  <FileUpload
                    onUploadSuccess={(url) => handleAvatarUploadSuccess(url)}
                    onUploadError={(e) => handleAvatarUploadError(e)}
                    accept="image/*"
                    folder="avatars"
                    maxFileSize={5}
                  >
                    <button type="button" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                      Cambiar imagen
                    </button>
                  </FileUpload>
                </div>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="o pega la URL de tu avatar"
                  className="w-full sm:w-96 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Correo</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <a href="/dashboard" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg">
                Cancelar
              </a>
              <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                user.role_name === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role_name === 'admin' ? 'Administrador' : 'Alumno'}
              </span>
            </div>
          </form>
        </div>

        {/* Metadatos de cuenta (opcional): si necesitas fechas, podemos obtenerlas desde /users/me y extender el tipo */}
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <AuthProvider>
      <ProfileContent />
    </AuthProvider>
  );
}
