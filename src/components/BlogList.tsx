import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { PostSummary } from '@/types';
import BlogCard from './BlogCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BlogList() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPosts = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const skip = reset ? 0 : (page - 1) * 12;
      const params: any = {
        skip,
        limit: 12
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const newPosts = await api.getPosts(params);
      
      if (reset) {
        setPosts(newPosts);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      // Si recibimos menos de 12 posts, no hay más
      setHasMore(newPosts.length === 12);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(true);
  }, [searchTerm]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadPosts();
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-secondary-200 rounded w-48 loading"></div>
          <div className="h-8 bg-secondary-200 rounded w-32 loading"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card loading">
              <div className="h-48 bg-secondary-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-secondary-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-secondary-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Error al cargar posts
        </h3>
        <p className="text-secondary-600 mb-4">{error}</p>
        <button
          onClick={() => loadPosts(true)}
          className="btn-primary"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          No hay posts disponibles
        </h3>
        <p className="text-secondary-600">
          {searchTerm 
            ? `No se encontraron resultados para "${searchTerm}"`
            : 'Aún no hay contenido publicado en el blog.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">
          {searchTerm ? `Resultados para "${searchTerm}"` : 'Últimos artículos'}
        </h2>
        <span className="text-sm text-secondary-500">
          {posts.length} {posts.length === 1 ? 'artículo' : 'artículos'}
        </span>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 loading-spinner mr-2"></div>
                Cargando...
              </>
            ) : (
              'Cargar más artículos'
            )}
          </button>
        </div>
      )}
    </div>
  );
}


