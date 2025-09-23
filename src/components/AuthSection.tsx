import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ChevronDownIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface AuthSectionProps {
  isMobile?: boolean;
}

function AuthSectionContent({ isMobile = false }: AuthSectionProps) {
  const { user, loading, login, logout, isAdmin } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className={`${isMobile ? 'px-3 py-2' : ''}`}>
        <div className="w-8 h-8 loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${isMobile ? 'px-3 py-2' : ''}`}>
        <button
          onClick={login}
          className="bg-gradient-to-r from-[#00012d] to-[#00cc66] text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <span>Iniciar Sesión</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </button>
      </div>
    );
  }

  const menuItems = [
    {
      label: 'Mi Perfil',
      href: '/profile',
      icon: UserIcon
    },
    ...(isAdmin ? [{
      label: 'Administración',
      href: '/admin/dashboard',
      icon: Cog6ToothIcon
    }] : []),
    {
      label: 'Cerrar Sesión',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: logout
    }
  ];

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-3 px-3 py-2">
          <img
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=ffffff`}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=ffffff`;
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-secondary-500 truncate">
              {user.email}
            </p>
          </div>
        </div>
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50 rounded-md flex items-center space-x-2"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <img
          src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=ffffff`}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=ffffff`;
          }}
        />
        <span className="text-secondary-700 dark:text-white font-medium hidden lg:block">
          {user.name}
        </span>
        <ChevronDownIcon className="w-4 h-4 text-secondary-400 dark:text-white" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-[100]">
          <div className="px-4 py-3 border-b border-secondary-200">
            <p className="text-sm font-medium text-secondary-900">{user.name}</p>
            <p className="text-xs text-secondary-500">{user.email}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
              user.role_name === 'admin' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user.role_name === 'admin' ? 'Administrador' : 'Alumno'}
            </span>
          </div>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick || (() => window.location.href = item.href)}
              className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuthSection({ isMobile = false }: AuthSectionProps) {
  return (
    <AuthProvider>
      <AuthSectionContent isMobile={isMobile} />
    </AuthProvider>
  );
}

