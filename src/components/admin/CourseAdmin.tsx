import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import CourseEditor from './CourseEditor';

// Tipos
interface Course {
  id: number;
  title: string;
  description?: string;
  short_description?: string;
  category?: string;
  level: string;
  language: string;
  price?: string;
  is_premium: boolean;
  is_published: boolean;
  instructor_name: string;
  lesson_count: number;
  estimated_duration_hours?: number;
  created_at: string;
  cover_image_url?: string;
}

interface CourseCreate {
  title: string;
  description?: string;
  short_description?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  language: string;
  category?: string;
  tags?: string;
  estimated_duration_hours?: number;
  is_published: boolean;
  is_premium: boolean;
  price?: string;
  instructor_id: number;
}

function CourseAdminContent() {
  const { user, loading } = useAuth();
  const [allCourses, setAllCourses] = useState<Course[]>([]); // Lista completa desde backend
  const [courses, setCourses] = useState<Course[]>([]); // Lista visible (filtrada)
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{id: number, name: string} | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showAll, setShowAll] = useState(false); // Mostrar también no publicados
  const [newCourse, setNewCourse] = useState<Partial<CourseCreate>>({
    level: 'Beginner',
    language: 'Español',
    is_published: false,
    is_premium: true
  });

  useEffect(() => {
    if (user && user.role_name === 'admin') {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const { api } = await import('@/lib/api');
      const coursesData = await api.getAdminCourses();
      setAllCourses(coursesData);
      // Ocultar por defecto los no publicados
      setCourses((showAll ? coursesData : coursesData.filter((c: Course) => c.is_published)) as Course[]);
    } catch (error) {
      console.error('Error cargando cursos:', error);
      setAllCourses([]);
      setCourses([]); // En caso de error, mostrar lista vacía
    } finally {
      setLoadingCourses(false);
    }
  };

  // Recalcular lista visible cuando cambia el toggle o llegan datos
  useEffect(() => {
    if (!allCourses) return;
    setCourses(showAll ? allCourses : allCourses.filter((c) => c.is_published));
  }, [showAll, allCourses]);

  const handleCreateCourse = async () => {
    try {
      if (!user) return;
      
      const courseData: CourseCreate = {
        ...newCourse,
        instructor_id: user.id
      } as CourseCreate;

      const { api } = await import('@/lib/api');
      const createdCourse = await api.createCourse(courseData);
      
      // Recargar la lista de cursos
      await loadCourses();
      
      setShowCreateModal(false);
      setNewCourse({
        level: 'Beginner',
        language: 'Español',
        is_published: false,
        is_premium: true
      });
      
      alert('¡Curso creado exitosamente!');
    } catch (error) {
      console.error('Error creando curso:', error);
      alert('Error al crear el curso. Verifica los datos e intenta nuevamente.');
    }
  };

  // ✅ TODAS las verificaciones condicionales AL FINAL después de todos los hooks
  
  // Verificar que sea admin
  if (!loading && (!user || user.role_name !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">Solo los administradores pueden acceder a esta página.</p>
          <a href="/admin/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Volver al Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || loadingCourses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si hay un curso seleccionado, mostrar el editor
  if (selectedCourse) {
    return (
      <CourseEditor 
        courseId={selectedCourse.id}
        courseName={selectedCourse.name}
        onClose={() => setSelectedCourse(null)}
      />
    );
  }

  const openCourseEditor = (course: Course) => {
    setSelectedCourse({ id: course.id, name: course.title });
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (courseData: any, coverFile?: File) => {
    if (!editingCourse) return;

    try {
      let updatedData = { ...courseData };
      
      // Si hay archivo de portada, subirlo primero
      if (coverFile) {
        console.log('🔄 Subiendo portada...');
        const uploadResult = await api.uploadFileProxy(coverFile, 'courses/covers');
        updatedData.cover_image_url = uploadResult.public_url;
      }

      console.log('🔄 Actualizando curso...');
      await api.updateCourse(editingCourse.id, updatedData);
      
      setShowEditModal(false);
      setEditingCourse(null);
      
      // Recargar lista de cursos
      await loadCourses();
      
      console.log('✅ Curso actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando curso:', error);
      alert('Error actualizando el curso');
    }
  };

  const openDeleteModal = (course: Course) => {
    setCourseToDelete(course);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR') return;
    try {
      setDeleting(true);
      await api.deleteCourse(courseToDelete.id);
      setShowDeleteModal(false);
      setCourseToDelete(null);
      setDeleteConfirmText('');
      await loadCourses();
    } catch (error: any) {
      console.error('❌ Error eliminando curso:', error);
      alert(`No se pudo eliminar el curso: ${error?.message || 'Error inesperado'}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Secure Delete Modal */}
      <DeleteCourseModal
        open={showDeleteModal}
        course={courseToDelete}
        confirmText={deleteConfirmText}
        setConfirmText={setDeleteConfirmText}
        onCancel={() => { setShowDeleteModal(false); setCourseToDelete(null); setDeleteConfirmText(''); }}
        onConfirm={handleDeleteCourse}
        loading={deleting}
      />
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900">
                  📚 Gestión de Cursos
                </h1>
                <p className="mt-1 text-gray-600">
                  Crea y administra tus cursos online
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <a
                  href="/admin/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  ← Dashboard
                </a>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  ➕ Nuevo Curso
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{allCourses.length}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Cursos</p>
                  <p className="text-lg font-medium text-gray-900">{allCourses.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Publicados</p>
                  <p className="text-lg font-medium text-gray-900">
                    {allCourses.filter(c => c.is_published).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📝</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Borradores</p>
                  <p className="text-lg font-medium text-gray-900">
                    {allCourses.filter(c => !c.is_published).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">💎</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Premium</p>
                  <p className="text-lg font-medium text-gray-900">
                    {allCourses.filter(c => c.is_premium).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Cursos */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4 flex-col md:flex-row md:items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Mis Cursos
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Gestiona el contenido y configuración de tus cursos
                </p>
              </div>
              <div className="flex items-center gap-3 mt-3 md:mt-0">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={showAll}
                    onChange={(e) => setShowAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm"
                  />
                  Mostrar borradores (no publicados)
                </label>
                {!showAll && allCourses.some(c => !c.is_published) && (
                  <span className="text-xs text-gray-500">
                    Ocultando {allCourses.filter(c => !c.is_published).length} borrador(es)
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cursos</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer curso.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  ➕ Crear Primer Curso
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {courses.map((course) => (
                <li key={course.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-16 w-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            {course.cover_image_url ? (
                              <img 
                                src={course.cover_image_url} 
                                alt={course.title}
                                className="h-full w-full object-cover rounded-lg"
                              />
                            ) : (
                              <span className="text-gray-400 text-2xl">📚</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-medium text-gray-900 truncate">
                              {course.title}
                            </h4>
                            {course.is_published ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✅ Publicado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                📝 Borrador
                              </span>
                            )}
                            {course.is_premium && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                💎 Premium
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-500 mt-1">
                            {course.short_description || 'Sin descripción'}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>📂 {course.category || 'Sin categoría'}</span>
                            <span>📊 {course.level}</span>
                            <span>📝 {course.lesson_count} lecciones</span>
                            <span>⏱️ {course.estimated_duration_hours || 0}h</span>
                            <span>💰 {course.price || 'Gratis'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openCourseEditor(course)}
                          className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          📚 Contenido
                        </button>
                        <button 
                          onClick={() => openEditModal(course)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          ✏️ Editar Info
                        </button>
                        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                          📊 Stats
                        </button>
                        <button 
                          onClick={() => openDeleteModal(course)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                          title="Eliminar curso"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal Crear Curso */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  ➕ Crear Nuevo Curso
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título del curso</label>
                  <input
                    type="text"
                    value={newCourse.title || ''}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    placeholder="Ej: Programación Python para Principiantes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción corta</label>
                  <input
                    type="text"
                    value={newCourse.short_description || ''}
                    onChange={(e) => setNewCourse({...newCourse, short_description: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    placeholder="Una descripción atractiva para atraer estudiantes"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <input
                      type="text"
                      value={newCourse.category || ''}
                      onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                      placeholder="Programación"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nivel</label>
                    <select
                      value={newCourse.level || 'Beginner'}
                      onChange={(e) => setNewCourse({...newCourse, level: e.target.value as any})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    >
                      <option value="Beginner">Principiante</option>
                      <option value="Intermediate">Intermedio</option>
                      <option value="Advanced">Avanzado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio</label>
                    <input
                      type="text"
                      value={newCourse.price || ''}
                      onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                      placeholder="$99.99"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duración estimada (horas)</label>
                    <input
                      type="number"
                      value={newCourse.estimated_duration_hours || ''}
                      onChange={(e) => setNewCourse({...newCourse, estimated_duration_hours: parseInt(e.target.value)})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                      placeholder="8"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCourse.is_premium || false}
                      onChange={(e) => setNewCourse({...newCourse, is_premium: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 shadow-sm"
                    />
                    <span className="ml-2 text-sm text-gray-700">💎 Curso premium</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCourse.is_published || false}
                      onChange={(e) => setNewCourse({...newCourse, is_published: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 shadow-sm"
                    />
                    <span className="ml-2 text-sm text-gray-700">✅ Publicar inmediatamente</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCourse}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear Curso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Info */}
      {showEditModal && editingCourse && (
        <EditCourseInfoModal
          course={editingCourse}
          onSave={handleUpdateCourse}
          onClose={() => {
            setShowEditModal(false);
            setEditingCourse(null);
          }}
        />
      )}
    </div>
  );
}

// Componente Modal para Editar Info del Curso
interface EditCourseInfoModalProps {
  course: Course;
  onSave: (courseData: any, coverFile?: File) => Promise<void>;
  onClose: () => void;
}

function EditCourseInfoModal({ course, onSave, onClose }: EditCourseInfoModalProps) {
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description || '',
    short_description: course.short_description || '',
    level: course.level,
    language: course.language,
    category: course.category || '',
    estimated_duration_hours: course.estimated_duration_hours || 0,
    is_published: course.is_published,
    is_premium: course.is_premium,
    price: course.price || ''
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(course.cover_image_url || null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }

      setCoverFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSave(formData, coverFile || undefined);
    } catch (error) {
      console.error('Error guardando curso:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">✏️ Editar Información del Curso</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título del curso
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Descripción corta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción corta
              </label>
              <input
                type="text"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción breve para mostrar en la lista"
              />
            </div>

            {/* Descripción completa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción completa
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción detallada del curso"
              />
            </div>

            {/* Portada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen de portada
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF hasta 5MB</p>
                </div>
                {coverPreview && (
                  <div className="w-20 h-20">
                    <img
                      src={coverPreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Configuración en dos columnas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Beginner">Principiante</option>
                  <option value="Intermediate">Intermedio</option>
                  <option value="Advanced">Avanzado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idioma
                </label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ej: Programación, Diseño, Marketing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (horas)
                </label>
                <input
                  type="number"
                  value={formData.estimated_duration_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_duration_hours: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            {/* Switches */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                  📢 Publicado
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_premium"
                  checked={formData.is_premium}
                  onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_premium" className="ml-2 block text-sm text-gray-900">
                  💎 Premium
                </label>
              </div>
            </div>

            {/* Precio */}
            {formData.is_premium && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ej: $99, €50, Free"
                />
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CourseAdmin() {
  return (
    <AuthProvider>
      <CourseAdminContent />
    </AuthProvider>
  );
}

// Componente montado por Astro con client:load

// Delete Confirmation Modal (inside the same file for simplicity)
function DeleteCourseModal({
  open,
  course,
  confirmText,
  setConfirmText,
  onCancel,
  onConfirm,
  loading
}: {
  open: boolean;
  course: Course | null;
  confirmText: string;
  setConfirmText: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open || !course) return null;
  const disabled = confirmText.trim().toUpperCase() !== 'ELIMINAR' || loading;
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-gray-700">
            Vas a eliminar el curso <span className="font-semibold">"{course.title}"</span>. Esta acción no se puede deshacer.
          </p>
          <p className="text-gray-700">
            Escribe <span className="font-bold text-red-600">ELIMINAR</span> para confirmar.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ELIMINAR"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`px-4 py-2 rounded-md border text-white shadow-sm ${disabled ? 'bg-red-300 border-red-300 cursor-not-allowed' : 'bg-red-600 border-red-600 hover:bg-red-700'}`}
          >
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
