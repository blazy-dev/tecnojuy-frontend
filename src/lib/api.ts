import Cookies from 'js-cookie';
import { config, getApiUrl } from './config';
import type { User, Post, PostSummary, PostCreate, PostUpdate, Role, AuthUser, UploadUrlResponse } from '@/types';

class ApiClient {
  private getHeaders(): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  // Autenticación
  async getCurrentUser(): Promise<User> {
    const response = await fetch(getApiUrl(config.endpoints.auth.me), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<User>(response);
  }

  async refreshToken(): Promise<void> {
    const response = await fetch(getApiUrl(config.endpoints.auth.refresh), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    await this.handleResponse(response);
  }

  async logout(): Promise<void> {
    const response = await fetch(getApiUrl(config.endpoints.auth.logout), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    await this.handleResponse(response);
  }

  // Usuarios
  async getUserProfile(): Promise<AuthUser> {
    const response = await fetch(getApiUrl(config.endpoints.users.profile), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<AuthUser>(response);
  }

  async updateUserProfile(data: Partial<AuthUser>): Promise<AuthUser> {
    const response = await fetch(getApiUrl(config.endpoints.users.profile), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    return this.handleResponse<AuthUser>(response);
  }

  async getUsers(params?: { skip?: number; limit?: number; role_name?: string; is_active?: boolean }): Promise<AuthUser[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.role_name) searchParams.append('role_name', params.role_name);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    
    const url = `${getApiUrl(config.endpoints.users.list)}?${searchParams}`;
    const response = await fetch(url, {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<AuthUser[]>(response);
  }

  async getRoles(): Promise<Role[]> {
    const response = await fetch(getApiUrl(config.endpoints.users.roles), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<Role[]>(response);
  }

  // Posts
  async getPosts(params?: { skip?: number; limit?: number; author_id?: number; search?: string }): Promise<PostSummary[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.author_id) searchParams.append('author_id', params.author_id.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const url = `${getApiUrl(config.endpoints.posts.list)}?${searchParams}`;
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    return this.handleResponse<PostSummary[]>(response);
  }

  async getPost(id: number): Promise<Post> {
    const response = await fetch(getApiUrl(config.endpoints.posts.detail(id)), {
      headers: this.getHeaders()
    });
    
    return this.handleResponse<Post>(response);
  }

  async createPost(data: PostCreate): Promise<Post> {
    const response = await fetch(getApiUrl(config.endpoints.posts.create), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    return this.handleResponse<Post>(response);
  }

  async updatePost(id: number, data: PostUpdate): Promise<Post> {
    const response = await fetch(getApiUrl(config.endpoints.posts.update(id)), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    return this.handleResponse<Post>(response);
  }

  async deletePost(id: number): Promise<void> {
    const response = await fetch(getApiUrl(config.endpoints.posts.delete(id)), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    await this.handleResponse(response);
  }

  // Posts Admin
  async getPostsAdmin(params?: { skip?: number; limit?: number; is_published?: boolean }): Promise<PostSummary[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.is_published !== undefined) searchParams.append('is_published', params.is_published.toString());
    
    const url = `${getApiUrl(config.endpoints.posts.adminList)}?${searchParams}`;
    const response = await fetch(url, {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<PostSummary[]>(response);
  }

  async getPostAdmin(id: number): Promise<Post> {
    const response = await fetch(getApiUrl(config.endpoints.posts.adminDetail(id)), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<Post>(response);
  }

  // Storage

  async uploadFile(uploadUrl: string, file: File, contentType: string): Promise<void> {
    console.log('📤 Uploading file to:', uploadUrl);
    console.log('📄 File details:', { name: file.name, size: file.size, type: file.type });
    console.log('🏷️ Content-Type:', contentType);
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType
      },
      body: file
    });
    
    console.log('📡 Upload response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed with response:', errorText);
      throw new Error(`File upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    console.log('✅ File uploaded successfully');
  }

  async deleteFile(objectKey: string): Promise<void> {
    const response = await fetch(getApiUrl(`${config.endpoints.storage.deleteFile}/${objectKey}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    await this.handleResponse(response);
  }

  async getDownloadUrl(objectKey: string): Promise<string> {
    const response = await fetch(getApiUrl(`/storage/download-url?object_key=${encodeURIComponent(objectKey)}`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    const data = await this.handleResponse<{ download_url: string }>(response);
    return data.download_url;
  }

  async getUploadUrl(request: { filename: string; content_type: string; folder?: string }): Promise<UploadUrlResponse> {
    const response = await fetch(getApiUrl(config.endpoints.storage.uploadUrl), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(request)
    });
    
    return this.handleResponse<UploadUrlResponse>(response);
  }

  async getFileInfo(objectKey: string): Promise<{ object_key: string; public_url: string; exists: boolean }> {
    const response = await fetch(getApiUrl(`${config.endpoints.storage.fileInfo}/${objectKey}`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<{ object_key: string; public_url: string; exists: boolean }>(response);
  }

  // Courses and Premium Access methods
  async grantLifetimeAccess(userId: number): Promise<{ message: string; user: any }> {
    const response = await fetch(getApiUrl(`/courses/access/grant-lifetime/${userId}`), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<{ message: string; user: any }>(response);
  }

  async revokePremiumAccess(userId: number): Promise<{ message: string }> {
    const response = await fetch(getApiUrl(`/courses/premium/revoke/${userId}`), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<{ message: string }>(response);
  }

  // Nuevo: Acceso por curso específico
  async grantCourseAccess(userId: number, courseId: number): Promise<{ message: string; enrollment: any }> {
    const response = await fetch(getApiUrl('/courses/access/grant-course'), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId
      })
    });
    
    return this.handleResponse<{ message: string; enrollment: any }>(response);
  }

  async revokeCourseAccess(userId: number, courseId: number): Promise<{ message: string }> {
    const response = await fetch(getApiUrl('/courses/access/revoke-course'), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId
      })
    });
    
    return this.handleResponse<{ message: string }>(response);
  }

  // Obtener cursos disponibles
  async getCourses(): Promise<any[]> {
    const response = await fetch(getApiUrl('/courses/'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<any[]>(response);
  }

  // Obtener enrollments para administración
  async getEnrollments(): Promise<any[]> {
    const response = await fetch(getApiUrl('/courses/admin/enrollments'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<any[]>(response);
  }

  // Obtener cursos de un usuario específico con estado de acceso
  async getUserCoursesWithAccess(userId: number): Promise<any[]> {
    const response = await fetch(getApiUrl(`/courses/admin/user/${userId}/courses`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<any[]>(response);
  }

  // Gestión de cursos para admin
  async getAdminCourses(): Promise<any[]> {
    const response = await fetch(getApiUrl('/courses/admin/courses/'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<any[]>(response);
  }

  async createCourse(courseData: any): Promise<any> {
    const response = await fetch(getApiUrl('/courses/admin/courses/'), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(courseData)
    });
    
    return this.handleResponse<any>(response);
  }

  async deleteCourse(courseId: number): Promise<void> {
    const response = await fetch(getApiUrl(`/courses/admin/courses/${courseId}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    });
    await this.handleResponse(response);
  }

  // Gestión de estructura de cursos (para administradores)
  async getCourseStructure(courseId: number): Promise<any[]> {
    const response = await fetch(getApiUrl(`/courses/admin/${courseId}/structure`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    
    return this.handleResponse<any[]>(response);
  }

  async createChapter(chapterData: any): Promise<any> {
    const response = await fetch(getApiUrl('/courses/admin/chapters/'), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(chapterData)
    });
    
    return this.handleResponse<any>(response);
  }

  async createLesson(lessonData: any): Promise<any> {
    const response = await fetch(getApiUrl('/courses/admin/lessons/'), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(lessonData)
    });
    
    return this.handleResponse<any>(response);
  }

  async updateLesson(lessonId: number, lessonData: any): Promise<any> {
    const response = await fetch(getApiUrl(`/courses/admin/lessons/${lessonId}`), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(lessonData)
    });
    
    return this.handleResponse<any>(response);
  }

  async deleteLesson(lessonId: number): Promise<void> {
    const response = await fetch(getApiUrl(`/courses/admin/lessons/${lessonId}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    });
    await this.handleResponse(response);
  }

  // Proxy upload: subir archivo a través del backend
  async uploadFileProxy(file: File, folder: string = 'courses', onProgress?: (percent: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    // If onProgress is provided, use XHR to track upload progress
    if (onProgress) {
      const doUpload = (): Promise<any> => new Promise((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', getApiUrl('/storage/proxy-upload'));
          xhr.withCredentials = true;

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(Math.min(99, Math.max(1, percent)));
            }
          };

          xhr.onerror = () => reject(new Error('Error de red durante la carga'));
          xhr.ontimeout = () => reject(new Error('Tiempo de espera agotado durante la carga'));

          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const json = JSON.parse(xhr.responseText || '{}');
                onProgress(100);
                resolve(json);
              } catch (e) {
                reject(new Error('Respuesta inválida del servidor'));
              }
            } else if (xhr.status === 401) {
              // Try to refresh auth and retry once
              try {
                await fetch(getApiUrl('/auth/refresh'), { method: 'POST', credentials: 'include' });
                // retry
                const xhr2 = new XMLHttpRequest();
                xhr2.open('POST', getApiUrl('/storage/proxy-upload'));
                xhr2.withCredentials = true;
                xhr2.upload.onprogress = xhr.upload.onprogress;
                xhr2.onload = () => {
                  if (xhr2.status >= 200 && xhr2.status < 300) {
                    try {
                      const json = JSON.parse(xhr2.responseText || '{}');
                      onProgress(100);
                      resolve(json);
                    } catch (e) {
                      reject(new Error('Respuesta inválida del servidor'));
                    }
                  } else {
                    reject(new Error(`Error de carga tras refrescar: ${xhr2.status}`));
                  }
                };
                xhr2.onerror = () => reject(new Error('Error de red durante la carga (reintento)'));
                xhr2.send(formData);
              } catch (e) {
                reject(new Error('No autorizado y no se pudo refrescar sesión'));
              }
            } else {
              reject(new Error(`Error de carga: ${xhr.status} ${xhr.statusText}`));
            }
          };

          xhr.send(formData);
        } catch (e) {
          reject(e);
        }
      });

      return doUpload();
    }

    // Fallback: no progress, use fetch
    let response = await fetch(getApiUrl('/storage/proxy-upload'), {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (response.status === 401) {
      await fetch(getApiUrl('/auth/refresh'), { method: 'POST', credentials: 'include' });
      response = await fetch(getApiUrl('/storage/proxy-upload'), {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
    }
    return this.handleResponse<any>(response);
  }

  // ===== NUEVOS MÉTODOS PARA PÁGINAS PÚBLICAS DE CURSOS =====

  async getCoursesPublic(): Promise<any[]> {
    const response = await fetch(getApiUrl('/courses/'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any[]>(response);
  }

  async getMyCourses(): Promise<any[]> {
    const response = await fetch(getApiUrl('/courses/my-courses'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any[]>(response);
  }

  async getMyCoursesAll(): Promise<any[]> {
    const response = await fetch(getApiUrl('/courses/my-courses-all'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any[]>(response);
  }

  async getCourseStructurePublic(courseId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/courses/${courseId}/structure`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getCourseStructureWithAccess(courseId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/courses/${courseId}/structure-with-access`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getLessonContent(lessonId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/courses/lessons/${lessonId}/content`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async markLessonComplete(lessonId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/courses/lessons/${lessonId}/complete`), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getCourseProgress(courseId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/courses/courses/${courseId}/progress`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async debugCourses(): Promise<any> {
    const response = await fetch(getApiUrl('/courses/debug-courses'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // ===== HOMEPAGE MANAGEMENT =====

  // Homepage content endpoints
  async getHomepageData(): Promise<any> {
    const response = await fetch(getApiUrl('/homepage/'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getHomepageContentAdmin(): Promise<any[]> {
    const response = await fetch(getApiUrl('/homepage/admin/content'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any[]>(response);
  }

  async createHomepageContent(content: any): Promise<any> {
    const response = await fetch(getApiUrl('/homepage/admin/content'), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(content)
    });
    return this.handleResponse<any>(response);
  }

  async updateHomepageContent(contentId: number, content: any): Promise<any> {
    const response = await fetch(getApiUrl(`/homepage/admin/content/${contentId}`), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(content)
    });
    return this.handleResponse<any>(response);
  }

  async deleteHomepageContent(contentId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/homepage/admin/content/${contentId}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // Homepage gallery endpoints
  async getHomepageGalleryAdmin(): Promise<any[]> {
    const response = await fetch(getApiUrl('/homepage/admin/gallery'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any[]>(response);
  }

  async createHomepageGallery(gallery: any): Promise<any> {
    const response = await fetch(getApiUrl('/homepage/admin/gallery'), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(gallery)
    });
    return this.handleResponse<any>(response);
  }

  async updateHomepageGallery(galleryId: number, gallery: any): Promise<any> {
    const response = await fetch(getApiUrl(`/homepage/admin/gallery/${galleryId}`), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(gallery)
    });
    return this.handleResponse<any>(response);
  }

  async deleteHomepageGallery(galleryId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/homepage/admin/gallery/${galleryId}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async uploadHomepageImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(getApiUrl('/homepage/admin/upload-image'), {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    return this.handleResponse<any>(response);
  }

  async updateCourse(courseId: number, courseData: any): Promise<any> {
    const response = await fetch(getApiUrl(`/courses/admin/courses/${courseId}`), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(courseData)
    });
    return this.handleResponse<any>(response);
  }

  // ===== MÉTODOS PARA BLOG =====

  // Métodos públicos del blog
  async getBlogPosts(params?: {
    page?: number;
    per_page?: number;
    category_id?: number;
    tag_id?: number;
    featured_only?: boolean;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(getApiUrl(`/blog/posts?${searchParams.toString()}`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getBlogPostBySlug(slug: string): Promise<any> {
    const response = await fetch(getApiUrl(`/blog/posts/${slug}`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async getBlogCategories(): Promise<any[]> {
    const response = await fetch(getApiUrl('/blog/categories'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any[]>(response);
  }

  async getBlogTags(): Promise<any[]> {
    const response = await fetch(getApiUrl('/blog/tags'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any[]>(response);
  }

  // Métodos de administración del blog
  async getAdminBlogPosts(params?: {
    page?: number;
    per_page?: number;
    category_id?: number;
    tag_id?: number;
    featured_only?: boolean;
    search?: string;
    published_only?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(getApiUrl(`/blog/admin/posts?${searchParams.toString()}`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async createBlogPost(postData: any): Promise<any> {
    const response = await fetch(getApiUrl('/blog/admin/posts'), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(postData)
    });
    return this.handleResponse<any>(response);
  }

  async getAdminBlogPost(postId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/blog/admin/posts/${postId}`), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async updateBlogPost(postId: number, postData: any): Promise<any> {
    const response = await fetch(getApiUrl(`/blog/admin/posts/${postId}`), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(postData)
    });
    return this.handleResponse<any>(response);
  }

  async deleteBlogPost(postId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/blog/admin/posts/${postId}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // Categorías - Admin
  async getAdminBlogCategories(): Promise<any[]> {
    const response = await fetch(getApiUrl('/blog/admin/categories'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any[]>(response);
  }

  async createBlogCategory(categoryData: any): Promise<any> {
    const response = await fetch(getApiUrl('/blog/admin/categories'), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(categoryData)
    });
    return this.handleResponse<any>(response);
  }

  async updateBlogCategory(categoryId: number, categoryData: any): Promise<any> {
    const response = await fetch(getApiUrl(`/blog/admin/categories/${categoryId}`), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(categoryData)
    });
    return this.handleResponse<any>(response);
  }

  async deleteBlogCategory(categoryId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/blog/admin/categories/${categoryId}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // Tags - Admin
  async getAdminBlogTags(): Promise<any[]> {
    const response = await fetch(getApiUrl('/blog/admin/tags'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any[]>(response);
  }

  async createBlogTag(tagData: any): Promise<any> {
    const response = await fetch(getApiUrl('/blog/admin/tags'), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(tagData)
    });
    return this.handleResponse<any>(response);
  }

  async updateBlogTag(tagId: number, tagData: any): Promise<any> {
    const response = await fetch(getApiUrl(`/blog/admin/tags/${tagId}`), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(tagData)
    });
    return this.handleResponse<any>(response);
  }

  async deleteBlogTag(tagId: number): Promise<any> {
    const response = await fetch(getApiUrl(`/blog/admin/tags/${tagId}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // Imágenes del blog
  async uploadBlogFeaturedImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(getApiUrl('/blog/admin/upload-featured-image'), {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    return this.handleResponse<any>(response);
  }

  // Estadísticas del blog
  async getBlogStats(): Promise<any> {
    const response = await fetch(getApiUrl('/blog/admin/stats'), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // Generic GET method
  async get(url: string): Promise<any> {
    const response = await fetch(getApiUrl(url), {
      credentials: 'include',
      headers: this.getHeaders()
    });
    return this.handleResponse<any>(response);
  }

  // Upload image method
  async uploadImage(formData: FormData): Promise<{ url: string }> {
    const headers = new Headers();
    // Don't set Content-Type header for FormData, let browser set it with boundary
    
    const response = await fetch(getApiUrl('/homepage/admin/upload-image'), {
      method: 'POST',
      credentials: 'include',
      headers: headers,
      body: formData
    });
    
    return this.handleResponse<{ url: string }>(response);
  }
}

export const api = new ApiClient();


