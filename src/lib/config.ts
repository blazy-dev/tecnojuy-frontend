// Declaración para TypeScript del valor inyectado por Vite define (__API_URL__)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const __API_URL__: any; // Será reemplazado en build; en runtime puede no existir.

export const config = {
  // FORZAR HTTPS - FIX TEMPORAL PARA MIXED CONTENT
  apiUrl: 'https://backend-tecnojuy2-production.up.railway.app',
  
  // URLs de la API
  endpoints: {
    auth: {
      googleLogin: '/auth/google/login',
      googleCallback: '/auth/google/callback',
      me: '/auth/me',
      refresh: '/auth/refresh',
      logout: '/auth/logout'
    },
    users: {
      profile: '/users/me',
      list: '/users',
      roles: '/users/roles'
    },
    posts: {
      list: '/posts',
      detail: (id: number) => `/posts/${id}`,
      create: '/posts',
      update: (id: number) => `/posts/${id}`,
      delete: (id: number) => `/posts/${id}`,
      adminList: '/posts/admin/all',
      adminDetail: (id: number) => `/posts/admin/${id}`
    },
    storage: {
      uploadUrl: '/storage/upload-url',
      deleteFile: '/storage/file',
      fileInfo: '/storage/file-info',
      getFileUrl: (objectKey: string) => `/storage/file/${objectKey}`
    }
  },
  
  // Configuración de cookies
  cookies: {
    accessToken: 'access_token',
    refreshToken: 'refresh_token'
  },
  
  // Configuración de archivos
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocTypes: ['application/pdf', 'text/plain'],
    allowedVideoTypes: ['video/mp4', 'video/avi', 'video/quicktime'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg']
  }
};

export const getApiUrl = (endpoint: string) => {
  // TEMPORAL: Forzar HTTPS para solucionar Mixed Content
  const base = 'https://backend-tecnojuy2-production.up.railway.app';
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // En desarrollo usar proxy
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `/api${ep}`;
  }
  
  // En producción usar HTTPS directo
  console.log(`🔗 API URL: ${base}${ep}`); // Debug log
  return `${base}${ep}`;
};


