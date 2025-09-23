import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'youtube';
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  youtubeUrl?: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsear el contenido inicial solo una vez
  React.useEffect(() => {
    if (!isInitialized) {
      if (value) {
        try {
          const parsedBlocks = JSON.parse(value);
          if (Array.isArray(parsedBlocks)) {
            setBlocks(parsedBlocks);
          } else {
            // Si no es un array, crear un bloque de texto
            setBlocks([{ id: '1', type: 'text', content: value }]);
          }
        } catch {
          // Si no se puede parsear, crear un bloque de texto
          setBlocks([{ id: '1', type: 'text', content: value }]);
        }
      } else {
        setBlocks([{ id: '1', type: 'text', content: '' }]);
      }
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  // Actualizar el valor cuando cambien los bloques (solo después de la inicialización)
  React.useEffect(() => {
    if (isInitialized) {
      const jsonValue = JSON.stringify(blocks);
      onChange(jsonValue);
    }
  }, [blocks, onChange, isInitialized]);

  const addTextBlock = (afterIndex?: number) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type: 'text',
      content: ''
    };

    if (afterIndex !== undefined) {
      const newBlocks = [...blocks];
      newBlocks.splice(afterIndex + 1, 0, newBlock);
      setBlocks(newBlocks);
    } else {
      setBlocks([...blocks, newBlock]);
    }
  };

  const addImageBlock = (afterIndex?: number) => {
    // Crear un input temporal para seleccionar archivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handleImageUpload(file, afterIndex);
      }
    };
    input.click();
  };

  const addYoutubeBlock = async (afterIndex?: number) => {
    const url = prompt('Pega el link de YouTube (https://www.youtube.com/watch?v=...)');
    if (!url) return;
    // Validación básica
    const isYoutube = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)/.test(url);
    if (!isYoutube) {
      alert('URL de YouTube no válida');
      return;
    }
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type: 'youtube',
      content: '',
      youtubeUrl: url
    };
    if (afterIndex !== undefined) {
      const newBlocks = [...blocks];
      newBlocks.splice(afterIndex + 1, 0, newBlock);
      setBlocks(newBlocks);
    } else {
      setBlocks([...blocks, newBlock]);
    }
  };

  const handleImageUpload = async (file: File, afterIndex?: number) => {
    try {
      setIsLoading(true);
      const result = await api.uploadBlogFeaturedImage(file);
      
      const newBlock: ContentBlock = {
        id: Date.now().toString(),
        type: 'image',
        content: '',
        imageUrl: result.public_url,
        imageAlt: file.name
      };

      if (afterIndex !== undefined) {
        const newBlocks = [...blocks];
        newBlocks.splice(afterIndex + 1, 0, newBlock);
        setBlocks(newBlocks);
      } else {
        setBlocks([...blocks, newBlock]);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  const updateImageAlt = (id: string, alt: string) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, imageAlt: alt } : block
    ));
  };

  const deleteBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(block => block.id !== id));
    }
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(block => block.id === id);
    if (index === -1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < blocks.length) {
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    return (
      <div key={block.id} className="group relative border border-gray-200 rounded-lg p-4 mb-4">
        {/* Controles del bloque */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <button
            type="button"
            onClick={() => moveBlock(block.id, 'up')}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Mover arriba"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveBlock(block.id, 'down')}
            disabled={index === blocks.length - 1}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Mover abajo"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => deleteBlock(block.id)}
            disabled={blocks.length === 1}
            className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
            title="Eliminar bloque"
          >
            ✕
          </button>
        </div>

        {block.type === 'text' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Párrafo de texto
            </label>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Escribe tu contenido aquí..."
            />
          </div>
        ) : block.type === 'image' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🖼️ Imagen
            </label>
            {block.imageUrl ? (
              <div className="mb-3">
                <img
                  src={block.imageUrl}
                  alt={block.imageAlt || ''}
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            ) : (
              <div className="mb-3 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <p className="text-gray-500 mb-2">No hay imagen seleccionada</p>
                <button
                  type="button"
                  onClick={() => addImageBlock(index)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📁 Seleccionar imagen
                </button>
              </div>
            )}
            <div className="space-y-2">
              <input
                type="text"
                value={block.imageAlt || ''}
                onChange={(e) => updateImageAlt(block.id, e.target.value)}
                placeholder="Texto alternativo para la imagen..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {block.imageUrl && (
                <button
                  type="button"
                  onClick={() => addImageBlock(index)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  🔄 Cambiar imagen
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🎬 Video de YouTube</label>
            {block.youtubeUrl ? (
              <div className="aspect-video w-full mb-3">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={toYouTubeEmbed(block.youtubeUrl)}
                  title={block.imageAlt || 'YouTube video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <input
                type="url"
                value={block.youtubeUrl || ''}
                onChange={(e) => setBlocks(blocks.map(b => b.id === block.id ? { ...b, youtubeUrl: e.target.value } : b))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Botones para agregar contenido después de este bloque */}
        <div className="mt-3 flex space-x-2">
          <button
            type="button"
            onClick={() => addTextBlock(index)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            + Texto
          </button>
          <button
            type="button"
            onClick={() => addImageBlock(index)}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? '⏳ Subiendo...' : '+ Imagen'}
          </button>
          <button
            type="button"
            onClick={() => addYoutubeBlock(index)}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            + YouTube
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Contenido del Post *
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => addTextBlock()}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            + Texto
          </button>
          <button
            type="button"
            onClick={() => addImageBlock()}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? '⏳ Subiendo...' : '+ Imagen'}
          </button>
          <button
            type="button"
            onClick={() => addYoutubeBlock()}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            + YouTube
          </button>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No hay contenido aún</p>
          <div className="flex justify-center space-x-2">
            <button
              type="button"
              onClick={() => addTextBlock()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Comenzar con texto
            </button>
            <button
              type="button"
              onClick={() => addImageBlock()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Comenzar con imagen
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, index) => renderBlock(block, index))}
        </div>
      )}

      {/* Vista previa del contenido */}
      {blocks.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">📖 Vista previa:</h4>
          <div className="text-sm text-gray-600">
            {blocks.map((block, index) => (
              <div key={block.id} className="mb-2">
                {block.type === 'text' ? (
                  <span>{block.content || '(Texto vacío)'}</span>
                ) : block.type === 'image' ? (
                  <span>🖼️ {block.imageAlt || 'Imagen'}</span>
                ) : (
                  <span>🎬 Video de YouTube</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;

function toYouTubeEmbed(url: string): string {
  try {
    // Acepta formatos: https://www.youtube.com/watch?v=ID, https://youtu.be/ID, https://www.youtube.com/embed/ID
    const reg = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/;
    const match = url.match(reg);
    const id = match?.[1];
    if (!id) return url;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return url;
  }
}
