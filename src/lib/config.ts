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
      list: '/users/',
      roles: '/users/roles',
      adminStats: '/users/admin/stats/',
      adminList: '/users/admin/list/'
    },
    posts: {
      list: '/posts/',
      detail: (id: number) => `/posts/${id}/`,
      create: '/posts/',
      update: (id: number) => `/posts/${id}/`,
      delete: (id: number) => `/posts/${id}/`,
      adminList: '/posts/admin/all/',
      adminDetail: (id: number) => `/posts/admin/${id}/`
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
  // La base de la API se inyecta en el build via Vite `define`
  const base = typeof __API_URL__ !== 'undefined' ? __API_URL__ : 'https://backend-tecnojuy2-production.up.railway.app';
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // En desarrollo, el proxy de Vite se encarga de todo
  if (import.meta.env.DEV) {
    const devUrl = `/api${ep}`;
    console.log(`🏠 DEV API URL (via proxy): ${devUrl}`);
    return devUrl;
  }

  // En producción, construir la URL completa y forzar HTTPS
  let fullUrl = `${base}${ep}`;

  // Forzar HTTPS si por alguna razón la base es http
  if (fullUrl.startsWith('http://')) {
    console.warn('⚠️ URL insegura detectada, forzando a HTTPS:', fullUrl);
    fullUrl = fullUrl.replace('http://', 'https://');
  }
  
  // Normalizar doble slash accidental
  fullUrl = fullUrl.replace(/([^:]\/)\/+/g, '$1');

  console.log(`🚀 PROD API URL (from build variable): ${fullUrl}`);
  return fullUrl;
};


