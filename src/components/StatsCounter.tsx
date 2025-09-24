import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { getApiUrl } from '../lib/config';

export default function StatsCounter() {
  const [coursesCount, setCoursesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Cargar número de cursos
        const coursesResponse = await api.getCoursesPublic();
        setCoursesCount(coursesResponse.length);

        // Cargar número de usuarios registrados desde el nuevo endpoint público
  const usersResponse = await fetch(getApiUrl('/homepage/users-count'));
        if (usersResponse.ok) {
          const userData = await usersResponse.json();
          setUsersCount(userData.count || 0);
        } else {
          setUsersCount(0);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        setCoursesCount(5);
        setUsersCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <section className="py-20" style={{ background: 'var(--gradient-hero)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-white/80">Cargando estadísticas...</p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="py-20" style={{ background: 'var(--gradient-hero)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}>
            TecnoJuy en números
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-white/80" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}>
            Una academia nueva comprometida con la excelencia educativa.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}>{coursesCount}</div>
            <div className="font-medium text-white/80">Cursos Disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}>{usersCount}</div>
            <div className="font-medium text-white/80">Estudiantes Registrados</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}>24/7</div>
            <div className="font-medium text-white/80">Soporte Continuo</div>
          </div>
        </div>
        <div className="mt-16 text-center rounded-xl shadow-lg p-8" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
          <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Nuestro Compromiso</h3>
          <p className="text-lg max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Como academia nueva, nos enfocamos en calidad educativa y construir una comunidad sólida.
          </p>
        </div>
      </div>
    </section>
  );
}




