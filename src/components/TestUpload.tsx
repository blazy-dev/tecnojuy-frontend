import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import FileUpload from '@/components/FileUpload';

function TestUploadContent() {
  const { user, loading } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; objectKey: string; name: string }>>([]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">Necesitas estar autenticado para probar la subida de archivos.</p>
          <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  const handleUploadSuccess = (url: string, objectKey: string) => {
    console.log('Archivo subido exitosamente:', { url, objectKey });
    
    // Extraer nombre del archivo del objectKey
    const filename = objectKey.split('/').pop() || objectKey;
    
    setUploadedFiles(prev => [
      ...prev,
      { url, objectKey, name: filename }
    ]);
  };

  const handleUploadError = (error: string) => {
    console.error('Error subiendo archivo:', error);
    alert(`Error: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prueba de Subida de Archivos
          </h1>
          <p className="text-gray-600">
            Prueba el sistema de subida a Cloudflare R2
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=ffffff`}
              alt={user.name}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                user.role_name === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role_name === 'admin' ? 'Administrador' : 'Alumno'}
              </span>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Component */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Subir Archivo
            </h3>
            
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              accept="image/*,.pdf,.doc,.docx"
              folder="test-uploads"
              maxFileSize={10}
              className="mb-4"
            />

            <div className="text-sm text-gray-600">
              <p><strong>Tipos permitidos:</strong> Imágenes (JPG, PNG, GIF, WebP), PDF, DOC, DOCX</p>
              <p><strong>Tamaño máximo:</strong> 10 MB</p>
            </div>
          </div>

          {/* Upload with Custom Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Subida Personalizada
            </h3>
            
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              accept="image/*"
              folder="custom-uploads"
              maxFileSize={5}
            >
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                📸 Seleccionar Imagen
              </button>
            </FileUpload>

            <div className="text-sm text-gray-600 mt-4">
              <p><strong>Solo imágenes</strong></p>
              <p><strong>Tamaño máximo:</strong> 5 MB</p>
            </div>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Archivos Subidos ({uploadedFiles.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="mb-2">
                    {file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate" title={file.objectKey}>
                      {file.objectKey}
                    </p>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Ver archivo
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Volver al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default function TestUpload() {
  return (
    <AuthProvider>
      <TestUploadContent />
    </AuthProvider>
  );
}

