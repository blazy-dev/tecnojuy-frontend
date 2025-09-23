import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { PostSummary, AuthUser } from '@/types';
import { 
  NewspaperIcon, 
  UsersIcon, 
  EyeIcon, 
  PlusIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

function AdminDashboardContent() {
  const { user, loading } = useAuth();

  // Debug logs
  console.log('🔍 AdminDashboard - loading:', loading);
  console.log('🔍 AdminDashboard - user:', user);
  console.log('🔍 AdminDashboard - role_name:', user?.role_name);

  // Verificación manual de admin
  if (loading) {
    console.log('⏳ Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Cargando dashboard...</span>
      </div>
    );
  }

  if (!user) {
    console.log('❌ No user, redirecting to login');
    window.location.href = '/login';
    return null;
  }

  if (user.role_name !== 'admin') {
    console.log('❌ Not admin, role is:', user.role_name);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">Solo los administradores pueden acceder a esta página.</p>
          <p className="text-sm text-gray-500">Tu rol actual: {user.role_name}</p>
          <a href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-4 inline-block">
            Volver al Dashboard
          </a>
        </div>
      </div>
    );
  }

  console.log('✅ User is admin, proceeding...');
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalUsers: 0
  });
  const [recentPosts, setRecentPosts] = useState<PostSummary[]>([]);
  const [recentUsers, setRecentUsers] = useState<AuthUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      
      // Cargar posts
      const [allPosts, users] = await Promise.all([
        api.getPostsAdmin({ limit: 10 }),
        api.getUsers({ limit: 10 })
      ]);
      
      setRecentPosts(allPosts);
      setRecentUsers(users);
      
      // Calcular estadísticas
      const publishedCount = allPosts.filter(p => p.is_published).length;
      const draftCount = allPosts.filter(p => !p.is_published).length;
      
      setStats({
        totalPosts: allPosts.length,
        publishedPosts: publishedCount,
        draftPosts: draftCount,
        totalUsers: users.length
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">
          Acceso Denegado
        </h2>
        <p className="text-secondary-600">
          Solo los administradores pueden acceder a esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          ¡Bienvenido, {user.name}! 👋
        </h2>
        <p className="text-primary-100">
          Gestiona el contenido y usuarios de TecnoJuy desde este panel de control.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <a href="/admin/blog/new" className="card-hover p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <PlusIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-medium text-secondary-900 mb-1">Nuevo Post</h3>
          <p className="text-sm text-secondary-600">Crear artículo de blog</p>
        </a>

        <a href="/admin/banners" className="card-hover p-4 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <PhotoIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-secondary-900 mb-1">Subir Archivo</h3>
          <p className="text-sm text-secondary-600">Gestionar archivos</p>
        </a>

        <a href="/admin/posts" className="card-hover p-4 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <DocumentTextIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-medium text-secondary-900 mb-1">Gestionar Posts</h3>
          <p className="text-sm text-secondary-600">Ver todos los posts</p>
        </a>

        <a href="/admin/cursos" className="card-hover p-4 text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="font-medium text-secondary-900 mb-1">Cursos</h3>
          <p className="text-sm text-secondary-600">Gestionar cursos online</p>
        </a>

        <a href="/admin/alumnos" className="card-hover p-4 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <UsersIcon className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-medium text-secondary-900 mb-1">Alumnos</h3>
          <p className="text-sm text-secondary-600">Gestionar estudiantes</p>
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <NewspaperIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Posts</p>
              <p className="text-2xl font-bold text-secondary-900">
                {loadingStats ? '...' : stats.totalPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <EyeIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Publicados</p>
              <p className="text-2xl font-bold text-secondary-900">
                {loadingStats ? '...' : stats.publishedPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Borradores</p>
              <p className="text-2xl font-bold text-secondary-900">
                {loadingStats ? '...' : stats.draftPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Usuarios</p>
              <p className="text-2xl font-bold text-secondary-900">
                {loadingStats ? '...' : stats.totalUsers}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Posts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Posts Recientes
            </h3>
            <a href="/admin/posts" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todos →
            </a>
          </div>
          
          <div className="space-y-3">
            {loadingStats ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-secondary-200 loading">
                  <div className="w-12 h-12 bg-secondary-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-secondary-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : recentPosts.length > 0 ? (
              recentPosts.slice(0, 5).map((post) => (
                <div key={post.id} className="flex items-center space-x-3 p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50">
                  <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <NewspaperIcon className="w-6 h-6 text-secondary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">
                      {post.title}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-secondary-500">
                      <span>{post.author_name}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        post.is_published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {post.is_published ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-secondary-500 text-center py-4">
                No hay posts recientes
              </p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Usuarios Recientes
            </h3>
            <a href="/admin/users" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todos →
            </a>
          </div>
          
          <div className="space-y-3">
            {loadingStats ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-secondary-200 loading">
                  <div className="w-10 h-10 bg-secondary-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-secondary-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : recentUsers.length > 0 ? (
              recentUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50">
                  <img
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=ffffff`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">
                      {user.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-secondary-500">
                      <span>{user.email}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        user.role_name === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role_name === 'admin' ? 'Admin' : 'Alumno'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-secondary-500 text-center py-4">
                No hay usuarios recientes
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AuthProvider>
      <AdminDashboardContent />
    </AuthProvider>
  );
}


