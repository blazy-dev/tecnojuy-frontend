import React, { useState, useEffect } from 'react';
import { ClockIcon, UserGroupIcon, StarIcon } from '@heroicons/react/24/outline';

interface Course {
  id: number;
  title: string;
  description: string;
  short_description: string;
  cover_image_url?: string;
  instructor_name: string;
  level: string;
  language: string;
  estimated_duration_hours: number;
  category: string;
  is_premium: boolean;
  price?: string;
  students_count?: number;
  rating?: number;
}

export default function FeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedCourses();
  }, []);

  const loadFeaturedCourses = async () => {
    try {
      const { api } = await import('@/lib/api');
      const coursesData = await api.getCoursesPublic();
      // Mostrar solo los primeros 6 cursos para la vista previa
      setCourses(coursesData.slice(0, 6));
    } catch (error) {
      console.error('Error cargando cursos destacados:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelText = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return level;
    }
  };

  if (loading) {
    return (
      <section className="py-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Cursos Destacados
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Descubre los cursos más populares y mejor valorados por nuestros estudiantes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl h-96 animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null; // No mostrar la sección si no hay cursos
  }

  return (
    <section className="py-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Cursos Destacados
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
            Descubre los cursos más populares y mejor valorados por nuestros estudiantes.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {courses.map((course, index) => (
            <div 
              key={course.id} 
              className={`course-card relative rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105 animate-fade-in-up delay-${index * 100}`}
              style={{ 
                position: 'relative',
                zIndex: 1,
                isolation: 'isolate',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {/* Course Image */}
              <div className="relative h-48 bg-gradient-to-br from-[#00012d] to-[#02a0c7] overflow-hidden" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                {course.cover_image_url ? (
                  <img 
                    src={course.cover_image_url} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                    </div>
                  </div>
                )}
                
                {/* Premium Badge */}
                {course.is_premium && (
                  <div className="absolute top-4 right-4 bg-[#00cc66] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Premium
                  </div>
                )}

                {/* Level Badge */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(course.level)}`}>
                  {getLevelText(course.level)}
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-primary)' }}>
                {/* Category */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-500 dark:text-blue-400 text-sm font-medium uppercase tracking-wide">
                    {course.category}
                  </span>
                  {course.rating && (
                    <div className="flex items-center space-x-1">
                      <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{course.rating}</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2 line-clamp-2 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {course.short_description || course.description}
                </p>

                {/* Course Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{course.estimated_duration_hours}h</span>
                    </div>
                    {course.students_count && (
                      <div className="flex items-center space-x-1">
                        <UserGroupIcon className="w-4 h-4" />
                        <span>{course.students_count}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructor */}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Por {course.instructor_name}
                  </span>
                  
                  {/* Price */}
                  <div className="text-right">
                    {course.is_premium ? (
                      <span className="text-lg font-bold text-[#00cc66]">
                        ${course.price || '29.99'}
                      </span>
                    ) : (
                      <span className="text-lg font-bold text-[#00cc66]">
                        Gratis
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div 
                className="absolute inset-0 bg-[#00012d]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                style={{
                  pointerEvents: 'auto',
                  zIndex: 10
                }}
              >
                <a 
                  href={`/cursos/${course.id}`}
                  className="bg-[#00cc66] hover:bg-[#00b359] !text-white px-6 py-3 rounded-lg font-semibold transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-md"
                  style={{ color: '#ffffff', textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}
                >
                  Ver Curso
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center animate-fade-in-up delay-600">
          <a 
            href="/cursos"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#00012d] to-[#02a0c7] text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Ver Todos los Cursos
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}






