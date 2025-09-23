import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface BlogFiltersProps {
  onSearchChange?: (search: string) => void;
  onFilterChange?: (filters: { author?: string; category?: string }) => void;
}

export default function BlogFilters({ onSearchChange, onFilterChange }: BlogFiltersProps) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange?.(value);
  };

  const handleFilterChange = (type: 'author' | 'category', value: string) => {
    if (type === 'author') {
      setSelectedAuthor(value);
    } else {
      setSelectedCategory(value);
    }
    
    onFilterChange?.({
      author: type === 'author' ? value : selectedAuthor,
      category: type === 'category' ? value : selectedCategory
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedAuthor('');
    setSelectedCategory('');
    onSearchChange?.('');
    onFilterChange?.({});
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-outline flex items-center space-x-2 ${showFilters ? 'bg-secondary-100' : ''}`}
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filtros</span>
          </button>
          
          {(search || selectedAuthor || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="text-sm text-secondary-500 hover:text-secondary-700"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Autor</label>
              <select
                value={selectedAuthor}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="input"
              >
                <option value="">Todos los autores</option>
                <option value="admin">Equipo TecnoJuy</option>
                <option value="guest">Autores invitados</option>
              </select>
            </div>
            
            <div>
              <label className="label">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input"
              >
                <option value="">Todas las categorías</option>
                <option value="tutorial">Tutoriales</option>
                <option value="news">Noticias</option>
                <option value="tips">Tips y Trucos</option>
                <option value="resources">Recursos</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(search || selectedAuthor || selectedCategory) && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
              Búsqueda: "{search}"
              <button
                onClick={() => handleSearchChange('')}
                className="ml-2 hover:text-primary-600"
              >
                ×
              </button>
            </span>
          )}
          
          {selectedAuthor && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Autor: {selectedAuthor === 'admin' ? 'Equipo TecnoJuy' : 'Autores invitados'}
              <button
                onClick={() => handleFilterChange('author', '')}
                className="ml-2 hover:text-green-600"
              >
                ×
              </button>
            </span>
          )}
          
          {selectedCategory && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Categoría: {selectedCategory}
              <button
                onClick={() => handleFilterChange('category', '')}
                className="ml-2 hover:text-purple-600"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}


