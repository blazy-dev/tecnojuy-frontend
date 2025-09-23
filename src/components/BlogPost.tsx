import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Post } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { marked } from 'marked';
import { ArrowLeftIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

interface BlogPostProps {
  postId: number;
}

export default function BlogPost({ postId }: BlogPostProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const postData = await api.getPost(postId);
      setPost(postData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back button skeleton */}
        <div className="h-6 bg-secondary-200 rounded w-32 loading"></div>
        
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="h-12 bg-secondary-200 rounded loading"></div>
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-secondary-200 rounded w-24 loading"></div>
            <div className="h-4 bg-secondary-200 rounded w-32 loading"></div>
          </div>
        </div>
        
        {/* Image skeleton */}
        <div className="h-64 bg-secondary-200 rounded-xl loading"></div>
        
        {/* Content skeleton */}
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-secondary-200 rounded loading" style={{width: `${Math.random() * 40 + 60}%`}}></div>
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
          Error al cargar el post
        </h3>
        <p className="text-secondary-600 mb-4">{error}</p>
        <div className="space-x-3">
          <button
            onClick={() => window.location.href = '/blog'}
            className="btn-outline"
          >
            Volver al blog
          </button>
          <button
            onClick={loadPost}
            className="btn-primary"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Post no encontrado
        </h3>
        <p className="text-secondary-600 mb-4">
          El artículo que buscas no existe o ha sido eliminado.
        </p>
        <button
          onClick={() => window.location.href = '/blog'}
          className="btn-primary"
        >
          Volver al blog
        </button>
      </div>
    );
  }

  const formattedDate = format(new Date(post.created_at), 'dd \'de\' MMMM \'de\' yyyy', { locale: es });
  const contentHtml = marked(post.content);

  return (
    <article className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => window.location.href = '/blog'}
        className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-900 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span>Volver al blog</span>
      </button>

      {/* Header */}
      <header className="space-y-6">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-900 leading-tight">
          {post.title}
        </h1>
        
        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-6 text-secondary-600">
          <div className="flex items-center space-x-2">
            <UserIcon className="w-5 h-5" />
            <span>{post.author.name}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5" />
            <time dateTime={post.created_at}>{formattedDate}</time>
          </div>
          
          {!post.is_published && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Borrador
            </span>
          )}
        </div>
      </header>

      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary-100">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg prose-secondary max-w-none prose-headings:text-secondary-900 prose-links:text-primary-600 prose-links:no-underline hover:prose-links:underline prose-code:text-primary-600 prose-code:bg-primary-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-secondary-900 prose-pre:text-secondary-100">
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>

      {/* Author Info */}
      <div className="bg-white rounded-xl p-6 border border-secondary-200">
        <div className="flex items-start space-x-4">
          <img
            src={post.author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=3b82f6&color=ffffff`}
            alt={post.author.name}
            className="w-16 h-16 rounded-full"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-secondary-900 mb-1">
              {post.author.name}
            </h3>
            <p className="text-secondary-600 text-sm mb-3">
              Autor en TecnoJuy
            </p>
            <p className="text-secondary-700">
              Contribuyendo con contenido de calidad para la comunidad de desarrolladores.
            </p>
          </div>
        </div>
      </div>

      {/* Related Posts CTA */}
      <div className="bg-primary-50 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          ¿Te gustó este artículo?
        </h3>
        <p className="text-secondary-600 mb-4">
          Descubre más contenido interesante en nuestro blog
        </p>
        <button
          onClick={() => window.location.href = '/blog'}
          className="btn-primary"
        >
          Ver más artículos
        </button>
      </div>
    </article>
  );
}


