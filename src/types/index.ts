export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  has_premium_access: boolean;
  role_name: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  google_id: string;
  is_active: boolean;
  has_premium_access: boolean;
  role_name: string;
  created_at: string;
  updated_at?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  cover_image_url?: string;
  is_published: boolean;
  author: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface PostSummary {
  id: number;
  title: string;
  cover_image_url?: string;
  author_name: string;
  created_at: string;
  is_published: boolean;
}

export interface PostCreate {
  title: string;
  content: string;
  cover_image_url?: string;
  is_published: boolean;
}

export interface PostUpdate {
  title?: string;
  content?: string;
  cover_image_url?: string;
  is_published?: boolean;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface UploadUrlResponse {
  upload_url: string;
  public_url: string;
  object_key: string;
  filename: string;
}

export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

// Tipos de formularios
export interface LoginFormData {
  email: string;
  password: string;
}

export interface PostFormData {
  title: string;
  content: string;
  cover_image?: File;
  is_published: boolean;
}

export interface FileUploadData {
  file: File;
  folder: 'uploads' | 'blog' | 'avatars';
}


