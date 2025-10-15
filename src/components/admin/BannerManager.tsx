import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  order: number;
}

function BannerManagerContent() {
  const { user, isAdmin } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Estado inicial con banners por defecto
  const defaultBanners: Banner[] = [
    {
      id: 1,
      title: "Aprende Tecnología del Futuro",
      subtitle: "Cursos especializados en desarrollo web, IA y más",
      description: "Domina las herramientas más demandadas del mercado tecnológico con nuestros cursos prácticos y certificaciones reconocidas.",
      image: "/api/placeholder/1200/600",
      ctaText: "Explorar Cursos",
      ctaLink: "/cursos",
      isActive: true,
      order: 1
    },
    {
      id: 2,
      title: "Certificaciones Profesionales",
      subtitle: "Valida tu conocimiento con certificados oficiales",
      description: "Obtén certificaciones reconocidas por la industria que potenciarán tu carrera profesional en el mundo tech.",
      image: "/api/placeholder/1200/600",
      ctaText: "Ver Certificaciones",
      ctaLink: "/certificaciones",
      isActive: true,
      order: 2
    },
    {
      id: 3,
      title: "Comunidad de Desarrolladores",
      subtitle: "Aprende junto a miles de estudiantes",
      description: "Únete a nuestra comunidad activa donde podrás resolver dudas, compartir proyectos y hacer networking.",
      image: "/api/placeholder/1200/600",
      ctaText: "Únete Ahora",
      ctaLink: "/registro",
      isActive: true,
      order: 3
    }
  ];

  useEffect(() => {
    // Por ahora usamos banners estáticos, después se puede integrar con una API
    setBanners(defaultBanners);
    setLoading(false);
  }, []);

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setShowEditor(true);
  };

  const handleCreate = () => {
    const newBanner: Banner = {
      id: Date.now(),
      title: '',
      subtitle: '',
      description: '',
      image: '',
      ctaText: 'Ver más',
      ctaLink: '/',
      isActive: true,
      order: banners.length + 1
    };
    setEditingBanner(newBanner);
    setShowEditor(true);
  };

  const handleSave = (banner: Banner) => {
    if (banner.id && banners.find(b => b.id === banner.id)) {
      // Actualizar existente
      setBanners(prev => prev.map(b => b.id === banner.id ? banner : b));
    } else {
      // Crear nuevo
      setBanners(prev => [...prev, { ...banner, id: Date.now() }]);
    }
    setShowEditor(false);
    setEditingBanner(null);
  };

  const handleToggleActive = (id: number) => {
    setBanners(prev => prev.map(banner => 
      banner.id === id 
        ? { ...banner, isActive: !banner.isActive }
        : banner
    ));
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este banner?')) {
      setBanners(prev => prev.filter(banner => banner.id !== id));
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Acceso Denegado</h3>
          <p className="text-gray-500">No tienes permisos para gestionar banners.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00cc66]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#00012d]">Gestión de Banners</h1>
          <p className="text-gray-600 mt-2">Configura los banners del hero section</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-[#00cc66] hover:bg-[#00b359] text-white font-semibold rounded-lg transition-colors"
        >
          ✨ Nuevo Banner
        </button>
      </div>

      {/* Banners List */}
      <div className="grid gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-[#00012d]">{banner.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      banner.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {banner.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-[#02a0c7] font-medium mb-2">{banner.subtitle}</p>
                  <p className="text-gray-600 mb-4">{banner.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>CTA: {banner.ctaText}</span>
                    <span>•</span>
                    <span>Link: {banner.ctaLink}</span>
                  </div>
                </div>
                
                {/* Preview Image */}
                {banner.image && (
                  <div className="ml-6 flex-shrink-0">
                    <img 
                      src={banner.image} 
                      alt={banner.title}
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Orden: {banner.order}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(banner.id)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      banner.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {banner.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium transition-colors"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Banner Editor Modal */}
      {showEditor && editingBanner && (
        <BannerEditor
          banner={editingBanner}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingBanner(null);
          }}
        />
      )}
    </div>
  );
}

// Banner Editor Component
interface BannerEditorProps {
  banner: Banner;
  onSave: (banner: Banner) => void;
  onClose: () => void;
}

function BannerEditor({ banner, onSave, onClose }: BannerEditorProps) {
  const [formData, setFormData] = useState<Banner>(banner);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof Banner, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#00012d]">
              {banner.id ? 'Editar Banner' : 'Nuevo Banner'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título Principal
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00cc66] focus:border-transparent"
                required
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtítulo
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00cc66] focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00cc66] focus:border-transparent"
                required
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Imagen
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => handleChange('image', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00cc66] focus:border-transparent"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            {/* CTA Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto del Botón
              </label>
              <input
                type="text"
                value={formData.ctaText}
                onChange={(e) => handleChange('ctaText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00cc66] focus:border-transparent"
                required
              />
            </div>

            {/* CTA Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlace del Botón
              </label>
              <input
                type="text"
                value={formData.ctaLink}
                onChange={(e) => handleChange('ctaLink', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00cc66] focus:border-transparent"
                placeholder="/cursos"
                required
              />
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => handleChange('order', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00cc66] focus:border-transparent"
                min="1"
                required
              />
            </div>

            {/* Active */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="h-4 w-4 text-[#00cc66] focus:ring-[#00cc66] border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Banner activo
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#00cc66] hover:bg-[#00b359] text-white font-semibold rounded-lg transition-colors"
              >
                {banner.id ? 'Actualizar' : 'Crear'} Banner
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BannerManager() {
  return (
    <AuthProvider>
      <BannerManagerContent />
    </AuthProvider>
  );
}







