export const config = {
  apiUrl: typeof __API_URL__ !== 'undefined' ? __API_URL__ : 'http://localhost:8000',
  
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
  // Usar proxy en desarrollo para mantener las cookies de autenticación
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `/api${endpoint}`;
  }
  return `${config.apiUrl}${endpoint}`;
};


