import React from 'react';

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'youtube';
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  youtubeUrl?: string;
}

interface BlogContentRendererProps {
  content: string;
  className?: string;
}

const BlogContentRenderer: React.FC<BlogContentRendererProps> = ({ content, className = '' }) => {
  const renderContent = () => {
    try {
      const blocks: ContentBlock[] = JSON.parse(content);
      
      if (!Array.isArray(blocks)) {
        // Fallback para contenido de texto plano
        return (
          <div className="prose max-w-none">
            <p style={{ color: 'var(--blog-body-color)' }}>{content}</p>
          </div>
        );
      }

      return (
        <div className="prose max-w-none">
          {blocks.map((block, index) => {
            if (block.type === 'text') {
              return (
                <div key={block.id} className="mb-4">
                  <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--blog-body-color)' }}>
                    {block.content}
                  </p>
                </div>
              );
            } else if (block.type === 'image' && block.imageUrl) {
              return (
                <div key={block.id} className="my-6">
                  <img
                    src={block.imageUrl}
                    alt={block.imageAlt || ''}
                    className="w-full h-auto rounded-lg"
                    style={{ maxHeight: '500px', objectFit: 'cover' }}
                  />
                  {block.imageAlt && (
                    <p className="text-sm italic mt-2 text-center" style={{ color: 'var(--blog-body-color)' }}>
                      {block.imageAlt}
                    </p>
                  )}
                </div>
              );
            } else if (block.type === 'youtube' && block.youtubeUrl) {
              return (
                <div key={block.id} className="my-8">
                  <div className="aspect-video w-full">
                    <iframe
                      className="w-full h-full rounded-lg"
                      src={toYouTubeEmbed(block.youtubeUrl)}
                      title={block.imageAlt || 'YouTube video'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    } catch (error) {
      // Si no se puede parsear como JSON, renderizar como texto plano
      return (
        <div className="prose max-w-none">
          <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--blog-body-color)' }}>
            {content}
          </p>
        </div>
      );
    }
  };

  return (
    <div className={className}>
      {renderContent()}
    </div>
  );
};

export default BlogContentRenderer;

function toYouTubeEmbed(url: string): string {
  try {
    const reg = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/;
    const match = url.match(reg);
    const id = match?.[1];
    if (!id) return url;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return url;
  }
}




