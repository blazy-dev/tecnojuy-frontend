import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "María González",
    role: "Desarrolladora Frontend",
    company: "TechCorp",
    content: "Los cursos de TecnoJuy me ayudaron a conseguir mi primer trabajo como desarrolladora. La metodología es excelente y los instructores muy profesionales.",
    rating: 5,
    avatar: "https://ui-avatars.com/api/?name=Maria+Gonzalez&background=00cc66&color=ffffff"
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    role: "Full Stack Developer",
    company: "StartupX",
    content: "Después de completar el curso de React y Node.js, logré aumentar mi salario en un 60%. Totalmente recomendado para quienes buscan crecer profesionalmente.",
    rating: 5,
    avatar: "https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=00012d&color=ffffff"
  },
  {
    id: 3,
    name: "Ana Martínez",
    role: "Data Scientist",
    company: "DataFlow",
    content: "La calidad del contenido es excepcional. Los proyectos prácticos me permitieron aplicar inmediatamente lo aprendido en mi trabajo actual.",
    rating: 5,
    avatar: "https://ui-avatars.com/api/?name=Ana+Martinez&background=02a0c7&color=ffffff"
  },
  {
    id: 4,
    name: "Luis Fernández",
    role: "DevOps Engineer",
    company: "CloudTech",
    content: "TecnoJuy no solo enseña tecnología, sino que te prepara para el mundo real. Los mentores están siempre disponibles para resolver dudas.",
    rating: 5,
    avatar: "https://ui-avatars.com/api/?name=Luis+Fernandez&background=00cc66&color=ffffff"
  },
  {
    id: 5,
    name: "Sofía López",
    role: "UI/UX Designer",
    company: "DesignStudio",
    content: "Como diseñadora que quería aprender programación, encontré en TecnoJuy el puente perfecto. Ahora soy una diseñadora que también programa.",
    rating: 5,
    avatar: "https://ui-avatars.com/api/?name=Sofia+Lopez&background=00012d&color=ffffff"
  },
  {
    id: 6,
    name: "Miguel Castro",
    role: "Backend Developer",
    company: "ApiCore",
    content: "La comunidad de estudiantes es increíble. He hecho conexiones profesionales que han sido clave en mi carrera. Más que cursos, es una red profesional.",
    rating: 5,
    avatar: "https://ui-avatars.com/api/?name=Miguel+Castro&background=02a0c7&color=ffffff"
  }
];

export default function Testimonials() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const testimonialsPerSlide = 3;
  const totalSlides = Math.ceil(testimonials.length / testimonialsPerSlide);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalSlides]);

  const getCurrentTestimonials = () => {
    const start = currentSlide * testimonialsPerSlide;
    return testimonials.slice(start, start + testimonialsPerSlide);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-[#00012d] via-[#02a0c7] to-[#00cc66]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Lo que dicen nuestros estudiantes
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Historias reales de transformación profesional y crecimiento personal.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
              <div key={slideIndex} className="w-full flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {testimonials
                    .slice(slideIndex * testimonialsPerSlide, (slideIndex + 1) * testimonialsPerSlide)
                    .map((testimonial, index) => (
                    <div 
                      key={testimonial.id}
                      className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 animate-fade-in-up delay-${index * 100}`}
                    >
                      {/* Rating Stars */}
                      <div className="flex items-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon 
                            key={i}
                            className={`w-5 h-5 ${
                              i < testimonial.rating 
                                ? 'text-yellow-400' 
                                : 'text-white/30'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Testimonial Content */}
                      <blockquote className="text-white/90 mb-6 italic">
                        "{testimonial.content}"
                      </blockquote>

                      {/* Author Info */}
                      <div className="flex items-center">
                        <img 
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full mr-4 border-2 border-white/30"
                        />
                        <div>
                          <div className="font-semibold text-white">
                            {testimonial.name}
                          </div>
                          <div className="text-white/70 text-sm">
                            {testimonial.role} en {testimonial.company}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-[#00cc66] w-8' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-white/20">
          <div className="text-center animate-fade-in-up delay-100">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">4.9★</div>
            <div className="text-white/80 text-sm">Calificación promedio</div>
          </div>
          <div className="text-center animate-fade-in-up delay-200">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">2,500+</div>
            <div className="text-white/80 text-sm">Reseñas positivas</div>
          </div>
          <div className="text-center animate-fade-in-up delay-300">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">89%</div>
            <div className="text-white/80 text-sm">Obtienen empleo</div>
          </div>
          <div className="text-center animate-fade-in-up delay-400">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">67%</div>
            <div className="text-white/80 text-sm">Aumento salarial</div>
          </div>
        </div>
      </div>
    </section>
  );
}





