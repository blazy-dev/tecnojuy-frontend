import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
}

interface HeroBannerProps {
  banners?: Banner[];
  autoSlide?: boolean;
  slideInterval?: number;
}

const defaultBanners: Banner[] = [
  {
    id: 1,
    title: "Aprende Tecnología del Futuro",
    subtitle: "Cursos especializados en desarrollo web, IA y más",
    description: "Domina las herramientas más demandadas del mercado tecnológico con nuestros cursos prácticos y certificaciones reconocidas.",
    image: "/api/placeholder/1200/600",
    ctaText: "Explorar Cursos",
    ctaLink: "/cursos",
    isActive: true
  },
  {
    id: 2,
    title: "Certificaciones Profesionales",
    subtitle: "Valida tu conocimiento con certificados oficiales",
    description: "Obtén certificaciones reconocidas por la industria que potenciarán tu carrera profesional en el mundo tech.",
    image: "/api/placeholder/1200/600",
    ctaText: "Ver Certificaciones",
    ctaLink: "/certificaciones",
    isActive: true
  },
  {
    id: 3,
    title: "Comunidad de Desarrolladores",
    subtitle: "Aprende junto a miles de estudiantes",
    description: "Únete a nuestra comunidad activa donde podrás resolver dudas, compartir proyectos y hacer networking.",
    image: "/api/placeholder/1200/600",
    ctaText: "Únete Ahora",
    ctaLink: "/registro",
    isActive: true
  }
];

export default function HeroBanner({ 
  banners = defaultBanners,
  autoSlide = true,
  slideInterval = 6000 
}: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const activeBanners = banners.filter(banner => banner.isActive);

  // Auto-slide functionality
  useEffect(() => {
    if (!autoSlide || activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, slideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, slideInterval, activeBanners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (activeBanners.length === 0) return null;

  return (
    <section className="relative h-[90vh] sm:h-[75vh] md:h-[80vh] overflow-hidden">
      {/* Banner Slides */}
      <div className="relative h-full">
        {activeBanners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
              index === currentSlide 
                ? 'translate-x-0' 
                : index < currentSlide 
                  ? '-translate-x-full' 
                  : 'translate-x-full'
            }`}
          >
            {/* Background Image - Mejor posicionamiento en móvil */}
            <div 
              className="absolute inset-0 bg-cover bg-no-repeat bg-[center_40%] sm:bg-center"
              style={{ backgroundImage: `url(${banner.image})` }}
            >
              {/* Overlay con gradiente de colores principales */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#00012d]/95 via-[#02a0c7]/75 to-[#00cc66]/85"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center pb-20 sm:pb-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full">
                <div className="max-w-3xl">
                  {/* Subtitle */}
                  <p className="text-[#00cc66] font-semibold text-xs sm:text-base md:text-lg mb-2 md:mb-4 animate-fade-in-up delay-100">
                    {banner.subtitle}
                  </p>
                  
                  {/* Title - Responsivo mejorado */}
                  <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-3 md:mb-6 leading-tight animate-fade-in-up delay-200">
                    {banner.title}
                  </h1>
                  
                  {/* Description */}
                  <p className="text-sm sm:text-lg md:text-xl text-gray-200 mb-5 md:mb-8 leading-relaxed animate-fade-in-up delay-300">
                    {banner.description}
                  </p>
                  
                  {/* CTA Button */}
                  <div className="animate-fade-in-up delay-400">
                    <a 
                      href={banner.ctaLink}
                      className="inline-flex items-center px-5 py-2.5 md:px-8 md:py-4 bg-[#00cc66] hover:bg-[#00b359] text-white font-semibold text-sm md:text-base rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    >
                      {banner.ctaText}
                      <svg className="ml-2 w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Abajo en móvil, centro en desktop */}
      {activeBanners.length > 1 && (
        <>
          {/* Desktop Navigation - Centrado verticalmente */}
          <button
            onClick={prevSlide}
            className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 group"
            aria-label="Banner anterior"
          >
            <ChevronLeftIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>
          
          <button
            onClick={nextSlide}
            className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 group"
            aria-label="Banner siguiente"
          >
            <ChevronRightIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>
          
          {/* Mobile Navigation - Abajo junto a los dots */}
          <div className="sm:hidden absolute bottom-16 left-0 right-0 z-20 flex justify-center items-center gap-4">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm active:bg-white/30 transition-all duration-300"
              aria-label="Banner anterior"
            >
              <ChevronLeftIcon className="w-5 h-5 text-white" />
            </button>
            
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm active:bg-white/30 transition-all duration-300"
              aria-label="Banner siguiente"
            >
              <ChevronRightIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </>
      )}

      {/* Dots Indicator */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2 sm:space-x-3">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-[#00cc66] w-6 sm:w-8' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Ir al banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll Indicator - Oculto en móvil */}
      <div className="hidden sm:block absolute bottom-8 left-8 z-20 text-white/70 animate-bounce">
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Scroll</span>
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
