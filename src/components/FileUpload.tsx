import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface FileUploadProps {
  onUploadSuccess?: (url: string, objectKey: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  folder?: string;
  maxFileSize?: number; // en MB
  className?: string;
  children?: React.ReactNode;
}

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
}

export default function FileUpload({
  onUploadSuccess,
  onUploadError,
  accept = "image/*",
  folder = "uploads",
  maxFileSize = 10, // 10MB por defecto
  className = "",
  children
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño del archivo
    if (file.size > maxFileSize * 1024 * 1024) {
      const error = `El archivo es demasiado grande. Máximo ${maxFileSize}MB permitido.`;
      setUploadProgress({ progress: 0, status: 'error', message: error });
      onUploadError?.(error);
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploadProgress({ progress: 0, status: 'uploading', message: 'Preparando subida...' });

      // 1. Obtener URL firmada del backend
      const uploadData = await api.getUploadUrl({
        filename: file.name,
        content_type: file.type,
        folder
      });

      setUploadProgress({ progress: 25, status: 'uploading', message: 'Subiendo archivo...' });

      // 2. Subir archivo directamente a R2
      const uploadResponse = await fetch(uploadData.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`Error subiendo archivo: ${uploadResponse.statusText}`);
      }

      setUploadProgress({ progress: 100, status: 'success', message: 'Archivo subido exitosamente' });

      // 3. Notificar éxito
      onUploadSuccess?.(uploadData.public_url, uploadData.object_key);

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error subiendo archivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setUploadProgress({ progress: 0, status: 'error', message: errorMessage });
      onUploadError?.(errorMessage);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {children ? (
        <div onClick={handleClick} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${uploadProgress.status === 'uploading' 
              ? 'border-blue-400 bg-blue-50' 
              : uploadProgress.status === 'error'
              ? 'border-red-400 bg-red-50'
              : uploadProgress.status === 'success'
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          {uploadProgress.status === 'uploading' && (
            <div className="absolute inset-0 bg-blue-100 bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-blue-600 font-medium">{uploadProgress.message}</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Haz click para subir
                </span>{' '}
                o arrastra y suelta
              </p>
              <p className="text-xs text-gray-500">
                Máximo {maxFileSize}MB
              </p>
            </div>
          </div>

          {uploadProgress.status === 'error' && (
            <div className="mt-2 text-red-600 text-sm">
              {uploadProgress.message}
            </div>
          )}

          {uploadProgress.status === 'success' && (
            <div className="mt-2 text-green-600 text-sm">
              {uploadProgress.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

