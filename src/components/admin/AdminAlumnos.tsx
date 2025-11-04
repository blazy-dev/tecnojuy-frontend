import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Student {
  id: number;
  name: string;
  email: string;
  has_premium_access: boolean;
  role_name: string;
  created_at: string;
  avatar_url?: string;
}

interface Course {
  id: number;
  title: string;
  short_description: string;
  is_premium: boolean;
  price: string;
  instructor_name: string;
  has_access: boolean;
  has_premium_global: boolean;
}

function AdminAlumnosContent() {
  const { user, loading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingUserCourses, setLoadingUserCourses] = useState(false);
  const [processingUser, setProcessingUser] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para paginación y filtros (TODO en el cliente)
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | null>(null);
  const [studentsWithCourses, setStudentsWithCourses] = useState<Map<number, number[]>>(new Map());
  const studentsPerPage = 20;

  // Verificar que sea admin
  if (!loading && (!user || user.role_name !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">Solo los administradores pueden acceder a esta página.</p>
          <a href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Volver al Dashboard
          </a>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadStudents();
    loadCourses();
  }, []); // Cargar UNA SOLA VEZ

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      
      // Cargar TODOS los alumnos
      const allUsers = await api.getUsers({ role_name: 'alumno', limit: 1000 });
      setStudents(allUsers);
      
      // Cargar los cursos de cada alumno para el filtro
      const coursesMap = new Map<number, number[]>();
      for (const student of allUsers) {
        try {
          const userCoursesData = await api.getUserCoursesWithAccess(student.id);
          const accessibleCourseIds = userCoursesData
            .filter((c: Course) => c.has_access)
            .map((c: Course) => c.id);
          coursesMap.set(student.id, accessibleCourseIds);
        } catch (error) {
          console.error(`Error cargando cursos del alumno ${student.id}:`, error);
          coursesMap.set(student.id, []);
        }
      }
      setStudentsWithCourses(coursesMap);
      
    } catch (error) {
      console.error('Error cargando alumnos:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const coursesData = await api.getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error cargando cursos:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const grantLifetimeAccess = async (userId: number) => {
    if (!confirm('¿Estás seguro de otorgar acceso de por vida a este alumno?')) {
      return;
    }

    try {
      setProcessingUser(userId);
      
      const response = await api.grantLifetimeAccess(userId);
      alert(response.message);
      
      // Actualizar la lista local
      setStudents(students.map(student => 
        student.id === userId 
          ? { ...student, has_premium_access: true }
          : student
      ));
    } catch (error) {
      console.error('Error otorgando acceso:', error);
      alert('Error de conexión');
    } finally {
      setProcessingUser(null);
    }
  };

  const revokeAccess = async (userId: number) => {
    if (!confirm('¿Estás seguro de revocar el acceso premium de este alumno?')) {
      return;
    }

    try {
      setProcessingUser(userId);
      
      const response = await api.revokePremiumAccess(userId);
      alert('Acceso premium revocado exitosamente');
      
      // Actualizar la lista local
      setStudents(students.map(student => 
        student.id === userId 
          ? { ...student, has_premium_access: false }
          : student
      ));
    } catch (error) {
      console.error('Error revocando acceso:', error);
      alert('Error de conexión');
    } finally {
      setProcessingUser(null);
    }
  };

  const openCourseModal = async (student: Student) => {
    setSelectedStudent(student);
    setShowCourseModal(true);
    setLoadingUserCourses(true);
    
    try {
      // Cargar cursos con estado de acceso específico del usuario
      const userCoursesData = await api.getUserCoursesWithAccess(student.id);
      setUserCourses(userCoursesData);
    } catch (error) {
      console.error('Error cargando cursos del usuario:', error);
      alert('Error cargando los cursos del usuario');
    } finally {
      setLoadingUserCourses(false);
    }
  };

  const grantCourseAccess = async (courseId: number) => {
    if (!selectedStudent) return;

    try {
      const response = await api.grantCourseAccess(selectedStudent.id, courseId);
      alert(response.message);
      
      // Actualizar el estado local
      setUserCourses(userCourses.map(course => 
        course.id === courseId 
          ? { ...course, has_access: true }
          : course
      ));
    } catch (error) {
      console.error('Error otorgando acceso al curso:', error);
      alert('Error de conexión');
    }
  };

  const revokeCourseAccess = async (courseId: number) => {
    if (!selectedStudent) return;

    try {
      const response = await api.revokeCourseAccess(selectedStudent.id, courseId);
      alert(response.message);
      
      // Actualizar el estado local
      setUserCourses(userCourses.map(course => 
        course.id === courseId 
          ? { ...course, has_access: false }
          : course
      ));
    } catch (error) {
      console.error('Error revocando acceso al curso:', error);
      alert('Error de conexión');
    }
  };

  if (loading || loadingStudents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // 1. Filtrar por búsqueda local (nombre o email)
  let filteredAlumnos = students.filter(student => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    );
  });
  
  // 2. Filtrar por curso (si hay filtro seleccionado)
  if (selectedCourseFilter) {
    filteredAlumnos = filteredAlumnos.filter(student => {
      const studentCourses = studentsWithCourses.get(student.id) || [];
      return studentCourses.includes(selectedCourseFilter);
    });
  }
  
  // 3. Calcular paginación
  const totalFiltered = filteredAlumnos.length;
  const totalPages = Math.ceil(totalFiltered / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const paginatedAlumnos = filteredAlumnos.slice(startIndex, endIndex);
  
  // 4. Calcular estadísticas
  const totalAlumnos = students.length;
  const alumnosConPremium = students.filter(s => s.has_premium_access).length;
  const alumnosSinPremium = totalAlumnos - alumnosConPremium;
  const alumnosFiltrados = totalFiltered;
  
  const premiumCount = students.filter(student => student.has_premium_access).length;
  
  const handleCourseFilterChange = (courseId: number | null) => {
    setSelectedCourseFilter(courseId);
    setCurrentPage(1); // Reset a la primera página cuando cambia el filtro
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Alumnos
              </h1>
              <p className="mt-1 text-gray-600">
                Administra el acceso premium de tus estudiantes
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <a
                href="/admin/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Panel Admin
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Alumnos</dt>
                    <dd className="text-lg font-medium text-gray-900">{totalAlumnos}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Con Acceso Premium</dt>
                    <dd className="text-lg font-medium text-gray-900">{alumnosConPremium}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sin Acceso</dt>
                    <dd className="text-lg font-medium text-gray-900">{alumnosSinPremium}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Filtrados</dt>
                    <dd className="text-lg font-medium text-gray-900">{alumnosFiltrados}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Lista de Alumnos
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {selectedCourseFilter 
                      ? `Mostrando alumnos con acceso al curso seleccionado`
                      : `Gestiona el acceso premium de cada alumno individualmente`
                    }
                  </p>
                </div>
                
                {/* Buscador */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Filtro por curso */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Filtrar por curso:</label>
                <select
                  value={selectedCourseFilter || ''}
                  onChange={(e) => handleCourseFilterChange(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  disabled={loadingCourses}
                >
                  <option value="">Todos los alumnos</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                
                {selectedCourseFilter && (
                  <button
                    onClick={() => handleCourseFilterChange(null)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Limpiar filtro
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {paginatedAlumnos.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchQuery ? 'No se encontraron alumnos' : 'No hay alumnos registrados'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Intenta con otro término de búsqueda.' : 'Los alumnos aparecerán aquí cuando se registren.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {paginatedAlumnos.map((student) => (
                <li key={student.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src={student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=3b82f6&color=ffffff`}
                        alt={student.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          {student.has_premium_access && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Premium
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{student.email}</p>
                        <p className="text-xs text-gray-400">
                          Registrado: {new Date(student.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Botón para gestionar cursos específicos */}
                      <button
                        onClick={() => openCourseModal(student)}
                        className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        📚 Gestionar Cursos
                      </button>
                      
                      {/* Botón de acceso premium global */}
                      {student.has_premium_access ? (
                        <button
                          onClick={() => revokeAccess(student.id)}
                          disabled={processingUser === student.id}
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {processingUser === student.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <>
                              🔒 Revocar Premium Global
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => grantLifetimeAccess(student.id)}
                          disabled={processingUser === student.id}
                          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {processingUser === student.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              ✅ Premium Global
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(currentPage - 1) * studentsPerPage + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * studentsPerPage, totalStudents)}
                    </span>{' '}
                    de <span className="font-medium">{alumnosFiltrados}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Números de página */}
                    {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Siguiente</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                💡 Nuevo Sistema de Acceso Granular
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>📚 Gestionar Cursos:</strong> Otorga acceso individual a cursos específicos. Ideal cuando el alumno paga solo por un curso.</li>
                  <li><strong>✅ Premium Global:</strong> Acceso a TODOS los cursos de por vida. Para alumnos VIP o que compran paquetes completos.</li>
                  <li><strong>🎯 Flexibilidad:</strong> Puedes combinar ambos: un alumno puede tener acceso individual a algunos cursos Y premium global.</li>
                  <li><strong>🔒 Control total:</strong> Revoca accesos específicos o el premium global según sea necesario.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal para gestionar cursos */}
        {showCourseModal && selectedStudent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Gestionar Acceso por Curso - {selectedStudent.name}
                  </h3>
                  <button
                    onClick={() => setShowCourseModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {selectedStudent.has_premium_access && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      ✅ <strong>Este alumno tiene acceso premium global</strong> - puede ver todos los cursos automáticamente.
                    </p>
                  </div>
                )}

                <div className="max-h-96 overflow-y-auto">
                  {loadingUserCourses ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Cargando cursos...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userCourses.map((course) => {
                        const hasAccess = course.has_access || course.has_premium_global;
                        
                        return (
                          <div key={course.id} className={`border rounded-lg p-4 ${hasAccess ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h4 className="text-sm font-medium text-gray-900">{course.title}</h4>
                                  {hasAccess && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      {course.has_premium_global ? '🌟 Premium Global' : '✅ Acceso Individual'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{course.short_description}</p>
                                <div className="flex items-center mt-1 space-x-2">
                                  <p className="text-xs text-blue-600">Precio: {course.price}</p>
                                  <p className="text-xs text-gray-400">• {course.instructor_name}</p>
                                </div>
                              </div>
                              <div className="ml-4 flex space-x-2">
                                {!course.has_premium_global && (
                                  <>
                                    {course.has_access ? (
                                      <button
                                        onClick={() => revokeCourseAccess(course.id)}
                                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                      >
                                        🔒 Revocar
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => grantCourseAccess(course.id)}
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                      >
                                        ✅ Otorgar
                                      </button>
                                    )}
                                  </>
                                )}
                                {course.has_premium_global && (
                                  <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                    Acceso por Premium Global
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {userCourses.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No hay cursos premium disponibles</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowCourseModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAlumnos() {
  return (
    <AuthProvider>
      <AdminAlumnosContent />
    </AuthProvider>
  );
}
