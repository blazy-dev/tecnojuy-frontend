import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface HomepageContent {
  id: number;
  section: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  order_index: number;
  extra_data?: string;
}

interface HomepageGallery {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  is_featured: boolean;
}

interface HomepageData {
  content: HomepageContent[];
  gallery: HomepageGallery[];
}

const DynamicHomepage: React.FC = () => {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    loadHomepageData();
  }, []);

  const loadHomepageData = async () => {
    try {
      const homepageData = await api.getHomepageData();
      setData(homepageData);
    } catch (error) {
      console.error('Error loading homepage data:', error);
      // Use fallback content if API fails
      setData({
        content: [
          {
            id: 1,
            section: 'hero',
            title: 'Aprende Tecnología del Futuro',
            subtitle: 'Con TecnoJuy',
            description: 'Descubre cursos diseñados por expertos para llevarte al siguiente nivel profesional.',
            button_text: 'Comenzar Ahora',
            button_url: '/cursos',
            order_index: 0
          }
        ],
        gallery: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Get all hero slides sorted by order_index
  const getHeroSlides = (): HomepageContent[] => {
    if (!data) return [];
    return data.content
      .filter(c => c.section === 'hero')
      .sort((a, b) => a.order_index - b.order_index);
  };

  const heroSlides = getHeroSlides();

  // Auto-slide effect
  useEffect(() => {
    if (heroSlides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [heroSlides.length]);

  // Manual navigation
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (heroSlides.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-600 mb-4">No hay contenido disponible</h1>
          <p className="text-gray-500">Agrega contenido desde el panel de administración</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[70vh] min-h-[500px] overflow-hidden" style={{ zIndex: 10 }}>

      {/* Hero Slider */}
      <div className="relative h-full" style={{ zIndex: 10 }}>
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
              index === currentSlide ? 'translate-x-0' : 
              index < currentSlide ? '-translate-x-full' : 'translate-x-full'
            }`}
            style={{ pointerEvents: index === currentSlide ? 'auto' : 'none' }}
          >
            <section 
              className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 h-full flex items-center"
              style={{ 
                pointerEvents: 'auto',
                zIndex: 10,
                isolation: 'isolate'
              }}
            >
              {slide.image_url && (
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
                  style={{ 
                    backgroundImage: `url(${slide.image_url})`,
                    pointerEvents: 'none'
                  }}
                />
              )}
              <div 
                className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10"
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 20
                }}
              >
                <div className="animate-fade-in-up">
                  {slide.subtitle && (
                    <p className="text-xl text-blue-200 mb-4 font-medium">
                      {slide.subtitle}
                    </p>
                  )}
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                    {slide.title || 'Aprende Tecnología del Futuro'}
                  </h1>
                  {slide.description && (
                    <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
                      {slide.description}
                    </p>
                  )}
                  {slide.button_text && slide.button_url && (
                    <div className="space-y-4">
                      <button 
                        type="button"
                        className="inline-block bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 cursor-pointer z-50 relative shadow-xl"
                        style={{ 
                          pointerEvents: 'auto',
                          zIndex: 30,
                          position: 'relative',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const url = slide.button_url;
                          if (!url) {
                            return;
                          }
                          
                          if (url.startsWith('http') || url.startsWith('//')) {
                            // External URL
                            window.open(url, '_blank', 'noopener,noreferrer');
                          } else {
                            // Internal URL
                            window.location.href = url;
                          }
                        }}
                      >
                        {slide.button_text}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        ))}
      </div>

      {/* CONTROLES DE NAVEGACIÓN - Solo en desktop */}
      
      {/* Botones de navegación anterior/siguiente - Ocultos en mobile */}
      {heroSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hidden md:flex"
            style={{
              position: 'absolute',
              left: '30px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              width: '55px',
              height: '55px',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              zIndex: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            ‹
          </button>
          
          <button
            onClick={nextSlide}
            className="hidden md:flex"
            style={{
              position: 'absolute',
              right: '30px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              width: '55px',
              height: '55px',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              zIndex: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            ›
          </button>
        </>
      )}

      {/* Indicadores de slide */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 9999
      }}>
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              backgroundColor: index === currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transform: index === currentSlide ? 'scale(1.2)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (index !== currentSlide) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== currentSlide) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          />
        ))}
      </div>

    </div>
  );
};

export default DynamicHomepage;