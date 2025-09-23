import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  is_featured: boolean;
  published_at?: string;
  reading_time_minutes?: number;
  views_count: number;
  author: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
    color: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  posts_count: number;
  created_at: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  posts_count: number;
  created_at: string;
}

interface BlogStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
  total_categories: number;
  total_tags: number;
  featured_posts: number;
}

type BlogAdminProps = {
  openNew?: boolean;
};

const BlogAdminContent: React.FC<BlogAdminProps> = ({ openNew }) => {
  const { user, isAdmin } = useAuth();

  // Helper para URL-encode de manera segura
  const getSafeImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    try {
      // Si la URL ya está bien encoded, úsala tal como está
      if (url.includes('%')) return url;
      
      // Si tiene espacios u otros caracteres especiales, encode solo la parte del filename
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const basePath = urlParts.slice(0, -1).join('/');
      return `${basePath}/${encodeURIComponent(filename)}`;
    } catch {
      return url;
    }
  };
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Estados para modales
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Crear/Editar Post
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '' as string | undefined,
    is_published: false,
    is_featured: false,
    category_id: null as number | null,
    tag_ids: [] as number[],
    meta_title: '',
    meta_description: ''
  });

  // Estados de filtros y paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [totalPosts, setTotalPosts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterPublished, setFilterPublished] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || !isAdmin) {
      return;
    }
    
    loadData();
  }, [user, isAdmin, currentPage, searchTerm, filterCategory, filterPublished]);

  // Si viene openNew=true, abrir el modal de creación al montar
  useEffect(() => {
    if (openNew && user && isAdmin) {
      openCreatePost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNew, user, isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPosts(),
        loadCategories(),
        loadTags(),
        loadStats()
      ]);
    } catch (err) {
      console.error('Error cargando datos del blog:', err);
      setError('Error al cargar los datos del blog');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const params: any = {
        page: currentPage,
        per_page: postsPerPage,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      if (searchTerm) params.search = searchTerm;
      if (filterCategory) params.category_id = filterCategory;
      if (filterPublished !== null) params.published_only = filterPublished;

      const response = await api.getAdminBlogPosts(params);
      setPosts(response.posts);
      setTotalPosts(response.total);
    } catch (err) {
      console.error('Error cargando posts:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.getAdminBlogCategories();
      setCategories(response);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  const loadTags = async () => {
    try {
      const response = await api.getAdminBlogTags();
      setTags(response);
    } catch (err) {
      console.error('Error cargando tags:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.getBlogStats();
      setStats(response);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) {
      return;
    }

    try {
      await api.deleteBlogPost(postId);
      loadPosts();
      loadStats();
    } catch (err) {
      console.error('Error eliminando post:', err);
      alert('Error al eliminar el post');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // Helpers
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const currentCategoryOptions = useMemo(() => categories.map(c => ({ value: c.id, label: c.name })), [categories]);
  const currentTagOptions = useMemo(() => tags.map(t => ({ value: t.id, label: t.name })), [tags]);

  const openCreatePost = () => {
    setEditingPost(null);
    setPostForm({
      title: '', slug: '', excerpt: '', content: '',
      featured_image_url: undefined, is_published: false, is_featured: false,
      category_id: null, tag_ids: [], meta_title: '', meta_description: ''
    });
    setShowPostModal(true);
  };

  const openEditPost = (post: Post) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      featured_image_url: post.featured_image_url,
      is_published: post.is_published,
      is_featured: post.is_featured,
      category_id: post.category?.id || null,
      tag_ids: post.tags?.map(t => t.id) || [],
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || ''
    });
    setShowPostModal(true);
  };

  const handleCoverSelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setSaving(true);
        const res = await api.uploadBlogFeaturedImage(file);
        setPostForm(prev => ({ ...prev, featured_image_url: res.public_url }));
      } catch (err) {
        console.error('Error subiendo portada', err);
        alert('No se pudo subir la imagen de portada');
      } finally {
        setSaving(false);
      }
    };
    input.click();
  };

  const handleSubmitPost = async () => {
    try {
      setSaving(true);
      const payload: any = {
        title: postForm.title,
        slug: postForm.slug || generateSlug(postForm.title),
        excerpt: postForm.excerpt || null,
        content: postForm.content,
        featured_image_url: postForm.featured_image_url || null,
        is_published: postForm.is_published,
        is_featured: postForm.is_featured,
        category_id: postForm.category_id || null,
        tag_ids: postForm.tag_ids || [],
        meta_title: postForm.meta_title || null,
        meta_description: postForm.meta_description || null
      };

      if (!payload.title || !payload.content) {
        alert('Título y contenido son obligatorios');
        return;
      }

      if (editingPost) {
        await api.updateBlogPost(editingPost.id, payload);
      } else {
        await api.createBlogPost(payload);
      }

      setShowPostModal(false);
      setEditingPost(null);
      await Promise.all([loadPosts(), loadStats()]);
    } catch (err: any) {
      console.error('Error guardando post:', err);
      alert(err?.message || 'Error al guardar el post');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Administración del Blog</h1>
        <p className="text-gray-600 dark:text-gray-400">Gestiona posts, categorías y tags del blog</p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.total_posts}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Posts</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.published_posts}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Publicados</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats.draft_posts}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Borradores</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{stats.total_views}</div>
            <div className="text-sm text-gray-600">Vistas</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-indigo-600">{stats.total_categories}</div>
            <div className="text-sm text-gray-600">Categorías</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-pink-600">{stats.total_tags}</div>
            <div className="text-sm text-gray-600">Tags</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{stats.featured_posts}</div>
            <div className="text-sm text-gray-600">Destacados</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'posts', label: 'Posts' },
            { key: 'categories', label: 'Categorías' },
            { key: 'tags', label: 'Tags' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de las tabs */}
      {activeTab === 'posts' && (
        <div>
          {/* Controles de posts */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Buscar posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={filterCategory || ''}
                onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select
                value={filterPublished === null ? '' : filterPublished.toString()}
                onChange={(e) => setFilterPublished(e.target.value === '' ? null : e.target.value === 'true')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="true">Publicados</option>
                <option value="false">Borradores</option>
              </select>
            </div>
            <button
              onClick={openCreatePost}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              ✍️ Nuevo Post
            </button>
          </div>

          {/* Lista de posts */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {posts.map((post) => (
                <li key={post.id}>
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {post.featured_image_url && (
                        <img
                          src={getSafeImageUrl(post.featured_image_url)}
                          alt={post.title}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatDate(post.created_at)}</span>
                          {post.category && (
                            <span 
                              className="px-2 py-1 rounded-full text-xs text-white"
                              style={{ backgroundColor: post.category.color }}
                            >
                              {post.category.name}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            post.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {post.is_published ? 'Publicado' : 'Borrador'}
                          </span>
                          {post.is_featured && (
                            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                              Destacado
                            </span>
                          )}
                          <span>👁️ {post.views_count}</span>
                          {post.reading_time_minutes && (
                            <span>⏱️ {post.reading_time_minutes} min</span>
                          )}
                        </div>
                        {post.excerpt && (
                          <p className="mt-1 text-sm text-gray-600 truncate">{post.excerpt}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditPost(post)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar post"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((currentPage - 1) * postsPerPage) + 1} a {Math.min(currentPage * postsPerPage, totalPosts)} de {totalPosts} posts
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab de Categorías */}
      {activeTab === 'categories' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Categorías</h2>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              📁 Nueva Categoría
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{category.name}</h3>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{category.posts_count} posts</span>
                  <div className="space-x-2">
                    <button 
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('¿Eliminar esta categoría?')) {
                          try {
                            await api.deleteBlogCategory(category.id);
                            loadCategories();
                          } catch (err) {
                            alert('Error al eliminar categoría');
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab de Tags */}
      {activeTab === 'tags' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tags</h2>
            <button
              onClick={() => setShowTagModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🏷️ Nuevo Tag
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <div key={tag.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">#{tag.name}</h3>
                  <div className="space-x-2">
                    <button 
                      onClick={() => {
                        setEditingTag(tag);
                        setShowTagModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('¿Eliminar este tag?')) {
                          try {
                            await api.deleteBlogTag(tag.id);
                            loadTags();
                          } catch (err) {
                            alert('Error al eliminar tag');
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">{tag.posts_count} posts</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Post */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingPost ? 'Editar Post' : 'Nuevo Post'}
              </h3>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >✖️</button>
            </div>
            <div className="px-6 py-4 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Título *</label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setPostForm(prev => ({ ...prev, title, slug: prev.slug || generateSlug(title) }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Título del post"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Slug</label>
                  <input
                    type="text"
                    value={postForm.slug}
                    onChange={(e) => setPostForm(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="mi-post-increible"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Categoría</label>
                  <select
                    value={postForm.category_id || ''}
                    onChange={(e) => setPostForm(prev => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Resumen (excerpt)</label>
                <textarea
                  rows={2}
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Descripción corta que aparecerá en la lista..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Imagen de portada</label>
                <div className="flex items-center gap-4">
                  {postForm.featured_image_url ? (
                    <img src={getSafeImageUrl(postForm.featured_image_url)} alt="Portada" className="h-24 w-24 object-cover rounded" />
                  ) : (
                    <div className="h-24 w-24 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">Sin imagen</div>
                  )}
                  <button
                    type="button"
                    onClick={handleCoverSelect}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    disabled={saving}
                  >
                    {saving ? 'Subiendo...' : 'Subir/Cambiar imagen'}
                  </button>
                </div>
              </div>

              <div>
                <RichTextEditor
                  value={postForm.content}
                  onChange={(val) => setPostForm(prev => ({ ...prev, content: val }))}
                  placeholder="Escribe el contenido, agrega imágenes y videos de YouTube..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Meta título (SEO)</label>
                  <input
                    type="text"
                    value={postForm.meta_title}
                    onChange={(e) => setPostForm(prev => ({ ...prev, meta_title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Máx. 60 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Meta descripción (SEO)</label>
                  <input
                    type="text"
                    value={postForm.meta_description}
                    onChange={(e) => setPostForm(prev => ({ ...prev, meta_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Máx. 160 caracteres"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const checked = postForm.tag_ids.includes(tag.id);
                    return (
                      <label key={tag.id} className={`px-3 py-1 rounded-full border cursor-pointer ${checked ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}>
                        <input
                          type="checkbox"
                          className="mr-2 align-middle"
                          checked={checked}
                          onChange={(e) => {
                            setPostForm(prev => ({
                              ...prev,
                              tag_ids: e.target.checked
                                ? [...prev.tag_ids, tag.id]
                                : prev.tag_ids.filter(id => id !== tag.id)
                            }));
                          }}
                        />
                        #{tag.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={postForm.is_published}
                    onChange={(e) => setPostForm(prev => ({ ...prev, is_published: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Publicar</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={postForm.is_featured}
                    onChange={(e) => setPostForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Destacado</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => setShowPostModal(false)}
                disabled={saving}
              >Cancelar</button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSubmitPost}
                disabled={saving}
              >{saving ? 'Guardando...' : (editingPost ? 'Guardar cambios' : 'Crear post')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modales para categorías y tags - (futuro) */}
    </div>
  );
};

export default function BlogAdmin({ openNew }: BlogAdminProps) {
  return (
    <AuthProvider>
      <BlogAdminContent openNew={openNew} />
    </AuthProvider>
  );
}
