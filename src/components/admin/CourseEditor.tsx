import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// Tipos
interface Chapter {
  id: number;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  course_id: number;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  content_type: 'video' | 'pdf' | 'image' | 'text' | 'quiz';
  video_url?: string;
  video_duration_seconds?: number;
  file_url?: string;
  file_type?: string;
  file_size_bytes?: number;
  text_content?: string;
  order_index: number;
  estimated_duration_minutes?: number;
  is_published: boolean;
  is_free: boolean;
  can_download: boolean;
  chapter_id: number;
  course_id: number;
}

interface ChapterCreate {
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  course_id: number;
}

interface LessonCreate {
  title: string;
  description?: string;
  content_type: 'video' | 'pdf' | 'image' | 'text' | 'quiz';
  video_url?: string;
  video_duration_seconds?: number;
  file_url?: string;
  file_type?: string;
  file_size_bytes?: number;
  text_content?: string;
  order_index: number;
  estimated_duration_minutes?: number;
  is_published: boolean;
  is_free: boolean;
  can_download: boolean;
  chapter_id: number;
  course_id: number;
}

interface CourseEditorProps {
  courseId: number;
  courseName: string;
  onClose: () => void;
}

export default function CourseEditor({ courseId, courseName, onClose }: CourseEditorProps) {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  
  // Estados para modales
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  
  // Estados para formularios
  const [newChapter, setNewChapter] = useState<Partial<ChapterCreate>>({
    title: '',
    description: '',
    is_published: false
  });
  
  const [newLesson, setNewLesson] = useState<Partial<LessonCreate>>({
    title: '',
    description: '',
    content_type: 'text',
    estimated_duration_minutes: 10,
    is_published: false,
    is_free: false,
    can_download: false
  });
  
  // Estados para upload de archivos
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoThumbs, setVideoThumbs] = useState<Record<number, string>>({});
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>('');
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');

  // Validaciones de archivos
  const MAX_SIZES: Record<'video'|'pdf'|'image', number> = {
    video: 1024 * 1024 * 500,   // 500 MB
    pdf:   1024 * 1024 * 50,    // 50 MB
    image: 1024 * 1024 * 20     // 20 MB
  };

  const ALLOWED_MIMES: Record<'video'|'pdf'|'image', RegExp> = {
    video: /^video\//i,
    pdf:   /^application\/pdf$/i,
    image: /^image\//i
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(size < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  };

  const getLessonById = (lessonId: number): Lesson | undefined => {
    for (const ch of chapters) {
      const found = ch.lessons.find(l => l.id === lessonId);
      if (found) return found;
    }
    return undefined;
  };

  const validateFileForLesson = (file: File, lesson?: Lesson): { ok: boolean; message?: string } => {
    if (!lesson) return { ok: false, message: 'Lección no encontrada' };
    if (lesson.content_type === 'text' || lesson.content_type === 'quiz') {
      return { ok: false, message: 'Esta lección no admite archivos' };
    }
    const type: 'video'|'pdf'|'image' = lesson.content_type as any;
    const sizeLimit = MAX_SIZES[type];
    const mimeRule = ALLOWED_MIMES[type];
    if (!mimeRule.test(file.type)) {
      return { ok: false, message: `Tipo inválido. Se espera ${type.toUpperCase()}.` };
    }
    if (file.size > sizeLimit) {
      return { ok: false, message: `El archivo excede el máximo para ${type.toUpperCase()} (${Math.round(sizeLimit/1024/1024)} MB).` };
    }
    return { ok: true };
  };

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        video.muted = true;
        video.playsInline = true as any;
        video.currentTime = 0.1;
        video.onloadeddata = () => {
          const canvas = document.createElement('canvas');
          const w = 320;
          const h = Math.round((video.videoHeight / video.videoWidth) * w) || 180;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            return resolve('');
          }
          ctx.drawImage(video, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        };
        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve('');
        };
      } catch (e) {
        resolve('');
      }
    });
  };

  useEffect(() => {
    loadChapters();
  }, [courseId]);

  const loadChapters = async () => {
    try {
      console.log('🔄 Cargando capítulos para curso:', courseId);
      setLoading(true);
      const { api } = await import('@/lib/api');
      const chaptersData = await api.getCourseStructure(courseId);
      console.log('✅ Capítulos cargados:', chaptersData);
      setChapters(chaptersData);
    } catch (e: any) {
      console.error('❌ Error cargando capítulos:', e);
      setChapters([]); // En caso de error, mostrar lista vacía
    } finally {
      setLoading(false);
    }
  };

  const closeChapterModal = () => {
    setShowChapterModal(false);
    setEditingChapter(null);
    setNewChapter({
      title: '',
      description: '',
      is_published: false
    });
  };

  const handleCreateChapter = async () => {
    try {
      if (!newChapter.title) {
        alert('El título del capítulo es requerido');
        return;
      }

      const { api } = await import('@/lib/api');
      if (editingChapter) {
        await api.updateChapter(editingChapter.id, {
          title: newChapter.title,
          description: newChapter.description,
          is_published: newChapter.is_published
        });
        alert('¡Capítulo actualizado!');
      } else {
        const chapterData: ChapterCreate = {
          ...newChapter as ChapterCreate,
          course_id: courseId,
          order_index: chapters.length + 1
        };

        await api.createChapter(chapterData);
        alert('¡Capítulo creado exitosamente!');
      }

      await loadChapters();

      closeChapterModal();
    } catch (e: any) {
      console.error('Error guardando capítulo:', e);
      alert('Error al guardar el capítulo');
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!confirm('¿Eliminar este capítulo y todas sus lecciones? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { api } = await import('@/lib/api');
      await api.deleteChapter(chapterId);
      await loadChapters();
      alert('Capítulo eliminado');
    } catch (e) {
      console.error('Error eliminando capítulo:', e);
      alert('No se pudo eliminar el capítulo');
    }
  };

  const handleMoveChapter = async (chapterId: number, direction: 'up' | 'down') => {
    const index = chapters.findIndex(ch => ch.id === chapterId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const reordered = [...chapters];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const normalized = reordered.map((chapter, idx) => ({
      ...chapter,
      order_index: idx + 1
    }));

    setChapters(normalized);

    try {
      const { api } = await import('@/lib/api');
      await api.reorderChapters(courseId, normalized.map(ch => ch.id));
    } catch (e) {
      console.error('Error reordenando capítulos:', e);
      alert('No se pudo reordenar el capítulo');
      await loadChapters();
    }
  };

  const handleCreateLesson = async () => {
    try {
      if (!newLesson.title || !selectedChapterId) {
        alert('El título de la lección y el capítulo son requeridos');
        return;
      }

      const chapter = chapters.find(c => c.id === selectedChapterId);
      if (!chapter) return;

      const lessonData: LessonCreate = {
        ...newLesson as LessonCreate,
        chapter_id: selectedChapterId,
        course_id: courseId,
        order_index: chapter.lessons.length + 1
      };

      const { api } = await import('@/lib/api');
      // Si habrá upload, mostrar barra de progreso desde ya para que el usuario la vea
      if (pendingFile && (newLesson.content_type === 'video' || newLesson.content_type === 'pdf' || newLesson.content_type === 'image')) {
        setUploadingFile(true);
        setUploadFileName(pendingFile.name);
        setUploadProgress(5);
      }
      const created = await api.createLesson(lessonData);

      // Si hay archivo seleccionado en el modal, subirlo ahora
      if (pendingFile && (newLesson.content_type === 'video' || newLesson.content_type === 'pdf' || newLesson.content_type === 'image')) {
        await handleFileUpload(pendingFile, created.id);
      }

      // Recargar capítulos desde el servidor (traerá file_url si se subió)
      await loadChapters();
      
      setShowLessonModal(false);
      setNewLesson({
        title: '',
        description: '',
        content_type: 'text',
        estimated_duration_minutes: 10,
        is_published: false,
        is_free: false,
        can_download: false
      });
      setPendingFile(null);
      setPendingFileName('');
      if (pendingPreviewUrl) {
        try { URL.revokeObjectURL(pendingPreviewUrl); } catch {}
      }
      setPendingPreviewUrl(null);
      
      alert('¡Lección creada exitosamente!');
    } catch (e: any) {
      console.error('Error creando lección:', e);
      alert('Error al crear la lección');
    }
  };

  const handleUpdateLesson = async () => {
    try {
      if (!editingLesson) return;
      const payload: Partial<LessonCreate> = {
        title: newLesson.title,
        description: newLesson.description,
        content_type: newLesson.content_type,
        text_content: newLesson.text_content,
        estimated_duration_minutes: newLesson.estimated_duration_minutes,
        is_published: newLesson.is_published,
        is_free: newLesson.is_free,
        can_download: newLesson.can_download
      } as Partial<LessonCreate>;

      const { api } = await import('@/lib/api');
      if (pendingFile && (newLesson.content_type === 'video' || newLesson.content_type === 'pdf' || newLesson.content_type === 'image')) {
        setUploadingFile(true);
        setUploadFileName(pendingFile.name);
        setUploadProgress(5);
      }
      await api.updateLesson(editingLesson.id, payload);

      // Si hay archivo nuevo seleccionado, subirlo ahora
      if (pendingFile && (newLesson.content_type === 'video' || newLesson.content_type === 'pdf' || newLesson.content_type === 'image')) {
        await handleFileUpload(pendingFile, editingLesson.id);
      }

      await loadChapters();
      setShowLessonModal(false);
      setEditingLesson(null);
      setPendingFile(null);
      setPendingFileName('');
      if (pendingPreviewUrl) {
        try { URL.revokeObjectURL(pendingPreviewUrl); } catch {}
      }
      setPendingPreviewUrl(null);
      alert('¡Lección actualizada!');
    } catch (e: any) {
      console.error('Error actualizando lección:', e);
      alert('Error al actualizar la lección');
    }
  };

  const handleFileUpload = async (file: File, lessonId: number) => {
    const startAt = Date.now();
    try {
      setUploadingFile(true);
  setUploadProgress(0);
      setUploadFileName(file.name);

      console.log('🔄 Iniciando upload de archivo:', file.name, 'para lección:', lessonId);

      // Validar (si la lección aún no está en estado, generar una falsa según el archivo)
      let lesson = getLessonById(lessonId);
      if (!lesson) {
        const inferredType: 'video'|'pdf'|'image' = file.type.startsWith('video/')
          ? 'video'
          : (file.type === 'application/pdf' ? 'pdf' : 'image');
        lesson = {
          id: lessonId,
          title: '',
          content_type: inferredType,
          order_index: 1,
          is_published: false,
          is_free: false,
          can_download: false,
          chapter_id: selectedChapterId || 0,
          course_id: courseId
        } as Lesson;
      }
      const validation = validateFileForLesson(file, lesson);
      if (!validation.ok) {
        alert(validation.message || 'Archivo inválido');
        return;
      }

      const { api } = await import('@/lib/api');
      
      // 1. Subir archivo a través del proxy backend con progreso en tiempo real
      console.log('📡 Subiendo archivo a través del backend...');
      const uploadResult = await api.uploadFileProxy(file, 'courses', (p: number) => {
        // Suavizar y limitar el rango visible para evitar saltos bruscos
        setUploadProgress(prev => {
          const next = Math.max(prev, Math.min(99, Math.round(p)));
          return next;
        });
      });
      console.log('✅ Archivo subido:', uploadResult);
      
      // 2. Actualizar lección con información del archivo
      const updateData: any = {
        file_url: uploadResult.public_url,
        file_object_key: uploadResult.object_key,
        file_type: uploadResult.content_type,
        file_size_bytes: uploadResult.size
      };

      // Si es video, también actualizar video_url y miniatura local
      if (file.type.startsWith('video/')) {
        updateData.video_url = uploadResult.public_url;
        updateData.video_object_key = uploadResult.object_key;
        // Miniatura (solo para previsualización en UI)
        const thumb = await generateVideoThumbnail(file);
        if (thumb) {
          setVideoThumbs(prev => ({ ...prev, [lessonId]: thumb }));
        }
      }

      console.log('📝 Actualizando lección con datos:', updateData);
      await api.updateLesson(lessonId, updateData);
      console.log('✅ Lección actualizada');
  setUploadProgress(100);

      alert('¡Archivo subido exitosamente!');
      await loadChapters(); // Recargar datos
      
    } catch (e: any) {
      console.error('❌ Error subiendo archivo:', e);
      console.error('❌ Error details:', {
        name: e?.name,
        message: e?.message,
        stack: e?.stack
      });
      alert(`Error al subir el archivo: ${e?.message || 'desconocido'}`);
    } finally {
      const elapsed = Date.now() - startAt;
      const minVisible = 600; // ms
      const delay = Math.max(0, minVisible - elapsed);
      setTimeout(() => {
        setUploadingFile(false);
        setUploadProgress(0);
        setUploadFileName('');
      }, delay);
    }
  };

  const handleFileChosen = (file: File) => {
    // Construimos una lección temporal para validar según el tipo actual
    const fakeLesson: Lesson = {
      id: -1,
      title: newLesson.title || '',
      description: newLesson.description,
      content_type: newLesson.content_type as any,
      order_index: newLesson.order_index || 1,
      is_published: newLesson.is_published || false,
      is_free: newLesson.is_free || false,
      can_download: newLesson.can_download || false,
      chapter_id: selectedChapterId || 0,
      course_id: courseId
    } as any;
    const v = validateFileForLesson(file, fakeLesson);
    if (!v.ok) {
      alert(v.message || 'Archivo inválido');
      return false;
    }
    // Limpiar preview anterior si existe
    if (pendingPreviewUrl) {
      try { URL.revokeObjectURL(pendingPreviewUrl); } catch {}
    }
    setPendingFile(file);
    setPendingFileName(file.name);
    if (newLesson.content_type === 'image') {
      const url = URL.createObjectURL(file);
      setPendingPreviewUrl(url);
    } else {
      setPendingPreviewUrl(null);
    }
    return true;
  };

  const openChapterModal = (chapter?: Chapter) => {
    if (chapter) {
      setEditingChapter(chapter);
      setNewChapter({
        title: chapter.title,
        description: chapter.description,
        is_published: chapter.is_published
      });
    } else {
      setEditingChapter(null);
      setNewChapter({
        title: '',
        description: '',
        is_published: false
      });
    }
    setShowChapterModal(true);
  };

  const openLessonModal = (chapterId: number, lesson?: Lesson) => {
    setSelectedChapterId(chapterId);
    if (lesson) {
      setEditingLesson(lesson);
      setNewLesson({
        title: lesson.title,
        description: lesson.description,
        content_type: lesson.content_type,
        text_content: lesson.text_content,
        estimated_duration_minutes: lesson.estimated_duration_minutes,
        is_published: lesson.is_published,
        is_free: lesson.is_free,
        can_download: lesson.can_download
      });
    } else {
      setEditingLesson(null);
      setNewLesson({
        title: '',
        description: '',
        content_type: 'text',
        estimated_duration_minutes: 10,
        is_published: false,
        is_free: false,
        can_download: false
      });
    }
    // Resetear estado de archivo pendiente y preview
    if (pendingPreviewUrl) {
      try { URL.revokeObjectURL(pendingPreviewUrl); } catch {}
    }
    setPendingPreviewUrl(null);
    setPendingFile(null);
    setPendingFileName('');
    setShowLessonModal(true);
  };

  if (loading) {
    console.log('⏳ CourseEditor está en estado de loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Cargando editor de curso...</span>
      </div>
    );
  }

  console.log('✅ CourseEditor renderizado con capítulos:', chapters.length);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <button 
                  onClick={onClose}
                  className="text-blue-600 hover:text-blue-700 font-medium mb-2"
                >
                  ← Volver a Cursos
                </button>
                <h1 className="text-3xl font-bold text-gray-900">
                  Editor: {courseName}
                </h1>
                <p className="text-gray-600">
                  Gestiona el contenido de tu curso
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => openChapterModal()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  ➕ Nuevo Capítulo
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="mt-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`pb-4 text-sm font-medium border-b-2 ${
                    activeTab === 'content'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📚 Contenido
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`pb-4 text-sm font-medium border-b-2 ${
                    activeTab === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ⚙️ Configuración
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'content' && (
          <div className="space-y-6">
            {chapters.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay capítulos todavía
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea tu primer capítulo para comenzar a estructurar tu curso
                </p>
                <button
                  onClick={() => openChapterModal()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
                >
                  ➕ Crear Primer Capítulo
                </button>
              </div>
            ) : (
              chapters.map((chapter, chapterIndex) => (
                <div key={chapter.id} className="bg-white rounded-lg border border-gray-200">
                  {/* Chapter Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Capítulo {chapterIndex + 1}: {chapter.title}
                        </h3>
                        {chapter.description && (
                          <p className="text-gray-600 mt-1">{chapter.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            chapter.is_published 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {chapter.is_published ? '✅ Publicado' : '⏳ Borrador'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {chapter.lessons.length} lecciones
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleMoveChapter(chapter.id, 'up')}
                          disabled={chapterIndex === 0}
                          className={`px-3 py-1 rounded text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ${chapterIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          ⬆️ Subir
                        </button>
                        <button
                          onClick={() => handleMoveChapter(chapter.id, 'down')}
                          disabled={chapterIndex === chapters.length - 1}
                          className={`px-3 py-1 rounded text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ${chapterIndex === chapters.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          ⬇️ Bajar
                        </button>
                        <button
                          onClick={() => openLessonModal(chapter.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          ➕ Lección
                        </button>
                        <button
                          onClick={() => openChapterModal(chapter)}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          🗑️ Borrar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lessons */}
                  <div className="p-6">
                    {chapter.lessons.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-3">No hay lecciones en este capítulo</p>
                        <button
                          onClick={() => openLessonModal(chapter.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                          ➕ Agregar Primera Lección
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chapter.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <span className="text-gray-500 font-mono text-sm">
                                {chapterIndex + 1}.{lessonIndex + 1}
                              </span>
                              
                              {/* Content Type Icon */}
                              <span className="text-2xl">
                                {lesson.content_type === 'video' && '🎥'}
                                {lesson.content_type === 'pdf' && '📄'}
                                {lesson.content_type === 'image' && '🖼️'}
                                {lesson.content_type === 'text' && '📝'}
                                {lesson.content_type === 'quiz' && '❓'}
                              </span>
                              
                              <div>
                                <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                                {lesson.description && (
                                  <p className="text-sm text-gray-600">{lesson.description}</p>
                                )}
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    lesson.is_published 
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {lesson.is_published ? 'Publicado' : 'Borrador'}
                                  </span>
                                  {lesson.is_free && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      🆓 Gratis
                                    </span>
                                  )}
                                  {lesson.estimated_duration_minutes && (
                                    <span className="text-xs text-gray-500">
                                      ⏱️ {lesson.estimated_duration_minutes} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {/* File Upload Button */}
                              {(lesson.content_type === 'video' || lesson.content_type === 'pdf' || lesson.content_type === 'image') && (
                                <label className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 cursor-pointer">
                                  {lesson.file_url ? '📁 Reemplazar Archivo' : '📁 Subir Archivo'}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept={
                                      lesson.content_type === 'video' ? 'video/*' :
                                      lesson.content_type === 'pdf' ? '.pdf' :
                                      lesson.content_type === 'image' ? 'image/*' : ''
                                    }
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(file, lesson.id);
                                      }
                                    }}
                                  />
                                </label>
                              )}
                              {/* Descarga si permitido */}
                              {lesson.can_download && lesson.file_url && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const { api } = await import('@/lib/api');
                                      // Derivar object_key desde la URL pública si hace falta
                                      let objectKey = (lesson.file_url ?? '').split('?')[0];
                                      if (!objectKey) {
                                        alert('No se pudo determinar el archivo para descarga');
                                        return;
                                      }
                                      // 2) Si contiene el bucket, extraer desde "<bucket>/"
                                      const bucketPrefix = 'tecnojuy2-uploads/';
                                      const iBucket = objectKey.indexOf(bucketPrefix);
                                      if (iBucket !== -1) {
                                        objectKey = objectKey.substring(iBucket + bucketPrefix.length);
                                      } else {
                                        // 3) fallback: tomar desde el último '/courses/' (incluyendo 'courses/')
                                        const tag = '/courses/';
                                        const iCourses = objectKey.lastIndexOf(tag);
                                        if (iCourses !== -1) {
                                          objectKey = objectKey.substring(iCourses + 1); // queda 'courses/...'
                                        }
                                      }
                                      const downloadUrl = await api.getDownloadUrl(objectKey);
                                      window.open(downloadUrl, '_blank');
                                    } catch (e) {
                                      console.error('Error generando URL de descarga:', e);
                                      alert('No se pudo generar la URL de descarga');
                                    }
                                  }}
                                  className="bg-white text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50"
                                >
                                  ⬇️ Descargar
                                </button>
                              )}
                              
                              <button
                                onClick={() => openLessonModal(chapter.id, lesson)}
                                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm('¿Eliminar esta lección? Esta acción no se puede deshacer.')) return;
                                  try {
                                    const { api } = await import('@/lib/api');
                                    await api.deleteLesson(lesson.id);
                                    await loadChapters();
                                  } catch (e) {
                                    console.error('Error eliminando lección', e);
                                    alert('No se pudo eliminar la lección');
                                  }
                                }}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                              >
                                🗑️ Borrar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Configuración del Curso</h3>
            <p className="text-gray-600">
              Próximamente: Configuraciones avanzadas del curso, precios, promociones, etc.
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress Modal */}
      {uploadingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Subiendo archivo...</h3>
            {uploadFileName && (
              <p className="text-sm text-gray-600 mb-2 truncate">{uploadFileName}</p>
            )}
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-gray-600 mt-2">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* Chapter Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingChapter ? 'Editar Capítulo' : 'Nuevo Capítulo'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título del Capítulo *
                </label>
                <input
                  type="text"
                  value={newChapter.title || ''}
                  onChange={(e) => setNewChapter({...newChapter, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Introducción a Python"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newChapter.description || ''}
                  onChange={(e) => setNewChapter({...newChapter, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción opcional del capítulo"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="chapter-published"
                  checked={newChapter.is_published || false}
                  onChange={(e) => setNewChapter({...newChapter, is_published: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="chapter-published" className="ml-2 text-sm text-gray-700">
                  Publicar capítulo inmediatamente
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeChapterModal}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateChapter}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingChapter ? 'Actualizar' : 'Crear'} Capítulo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingLesson ? 'Editar Lección' : 'Nueva Lección'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título de la Lección *
                  </label>
                  <input
                    type="text"
                    value={newLesson.title || ''}
                    onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Variables y tipos de datos"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={newLesson.description || ''}
                    onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descripción de la lección"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Contenido *
                  </label>
                  <select
                    value={newLesson.content_type || 'text'}
                    onChange={(e) => setNewLesson({...newLesson, content_type: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">📝 Texto/Artículo</option>
                    <option value="video">🎥 Video</option>
                    <option value="pdf">📄 PDF</option>
                    <option value="image">🖼️ Imagen</option>
                    <option value="quiz">❓ Quiz</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración Estimada (minutos)
                  </label>
                  <input
                    type="number"
                    value={newLesson.estimated_duration_minutes || 10}
                    onChange={(e) => setNewLesson({...newLesson, estimated_duration_minutes: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                {/* Content based on type */}
                {newLesson.content_type === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenido de Texto
                    </label>
                    <textarea
                      value={newLesson.text_content || ''}
                      onChange={(e) => setNewLesson({...newLesson, text_content: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={8}
                      placeholder="Escribe el contenido de la lección aquí..."
                    />
                  </div>
                )}
                
                {(newLesson.content_type === 'video' || newLesson.content_type === 'pdf' || newLesson.content_type === 'image') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Archivo
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative"
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (!file) return;
                        handleFileChosen(file);
                      }}
                    >
                      <div className="text-gray-600 mb-2">
                        <span className="text-4xl">
                          {newLesson.content_type === 'video' && '🎥'}
                          {newLesson.content_type === 'pdf' && '📄'}
                          {newLesson.content_type === 'image' && '🖼️'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Arrastra tu archivo aquí o haz clic para seleccionar
                      </p>
                      <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer inline-block">
                        Seleccionar Archivo
                        <input
                          type="file"
                          className="hidden"
                          accept={
                            newLesson.content_type === 'video' ? 'video/*' :
                            newLesson.content_type === 'pdf' ? '.pdf' :
                            newLesson.content_type === 'image' ? 'image/*' : ''
                          }
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            handleFileChosen(file);
                          }}
                        />
                      </label>

                      {/* Info del archivo seleccionado */}
                      {pendingFile && (
                        <div className="mt-4 text-left bg-gray-50 border border-gray-200 rounded p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{pendingFileName}</p>
                              <p className="text-xs text-gray-600">
                                {pendingFile.type} · {formatFileSize(pendingFile.size)}
                              </p>
                            </div>
                            <button
                              className="text-red-600 text-sm hover:underline"
                              onClick={() => {
                                if (pendingPreviewUrl) {
                                  try { URL.revokeObjectURL(pendingPreviewUrl); } catch {}
                                }
                                setPendingPreviewUrl(null);
                                setPendingFile(null);
                                setPendingFileName('');
                              }}
                            >
                              Quitar
                            </button>
                          </div>
                          {/* Preview de imagen */}
                          {pendingPreviewUrl && newLesson.content_type === 'image' && (
                            <img src={pendingPreviewUrl} alt="preview" className="mt-3 max-h-56 rounded" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="lesson-published"
                      checked={newLesson.is_published || false}
                      onChange={(e) => setNewLesson({...newLesson, is_published: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="lesson-published" className="ml-2 text-sm text-gray-700">
                      Publicar lección inmediatamente
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="lesson-free"
                      checked={newLesson.is_free || false}
                      onChange={(e) => setNewLesson({...newLesson, is_free: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="lesson-free" className="ml-2 text-sm text-gray-700">
                      Lección gratuita (accesible sin comprar)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="lesson-download"
                      checked={newLesson.can_download || false}
                      onChange={(e) => setNewLesson({...newLesson, can_download: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="lesson-download" className="ml-2 text-sm text-gray-700">
                      Permitir descarga del archivo
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowLessonModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {editingLesson ? 'Actualizar' : 'Crear'} Lección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
