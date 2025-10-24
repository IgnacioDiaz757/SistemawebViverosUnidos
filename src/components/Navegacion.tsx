'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabasePerfilesService } from '@/services/supabasePerfilesService';
import LogoViveros from './LogoViveros';

const Navegacion: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const [mostrarMenuUsuario, setMostrarMenuUsuario] = useState(false);
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState<string>('');
  const [nombreActualizado, setNombreActualizado] = useState<string>('');

  // Cargar datos del perfil desde localStorage
  useEffect(() => {
    const cargarDatosPerfil = () => {
      if (user?.id) {
        const perfilKey = `perfil_${user.id}`;
        const perfil = JSON.parse(localStorage.getItem(perfilKey) || '{}');
        
        // Actualizar foto
        if (perfil.foto) {
          setFotoPerfilUrl(perfil.foto);
        } else {
          setFotoPerfilUrl('');
        }

        // Actualizar nombre si existe en el perfil
        if (perfil.nombre && perfil.apellido) {
          setNombreActualizado(`${perfil.nombre} ${perfil.apellido}`);
        } else {
          setNombreActualizado('');
        }
      }
    };

    // Cargar datos inicial
    cargarDatosPerfil();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('perfil_')) {
        cargarDatosPerfil();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // También escuchar cambios en la misma pestaña
    const handleCustomStorageChange = () => {
      cargarDatosPerfil();
    };

    window.addEventListener('perfilUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('perfilUpdated', handleCustomStorageChange);
    };
  }, [user?.id]);

  // Leer perfil desde Supabase (tabla perfiles_usuario) si está configurado
  useEffect(() => {
    const cargarPerfilSupabase = async () => {
      if (!user?.id || !isSupabaseConfigured) return;
      try {
        const perfil = await supabasePerfilesService.obtenerPerfil(user.id);
        if (perfil) {
          if (perfil.foto_perfil) setFotoPerfilUrl(perfil.foto_perfil);
          if (perfil.nombre_completo) setNombreActualizado(perfil.nombre_completo);
        }
      } catch {
        // ignorar errores silenciosamente
      }
    };
    cargarPerfilSupabase();
  }, [user?.id]);

  // Si estamos en rutas de auth, no mostrar la navegación
  if (pathname.startsWith('/auth')) {
    return null;
  }

  const handleLogout = async () => {
    logout();
    window.location.href = '/auth/login';
  };

  const menuItems = [
    { href: '/', label: 'Asociados Activos', icon: '👥' },
    { href: '/registro', label: 'Registrar Asociado', icon: '➕' },
    { href: '/bajas', label: 'Asociados de Baja', icon: '📋' },
    { href: '/contratistas', label: 'Gestión Contratistas', icon: '🏢' },
    { href: '/reportes', label: 'Reportes Liquidación', icon: '📊' },
  ];

  const menuItemsAdmin: Array<{ href: string; label: string; icon: string }> = [
    // Menú de administrador vacío por ahora
  ];

  return (
    <nav className="text-white shadow-lg" style={{backgroundColor: '#C70CB9'}}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Título */}
          <LogoViveros 
            size="nav" 
            showText={true} 
            textSize="lg" 
            className="text-white"
          />

          {/* Menú de navegación */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-white'
                    : 'text-purple-100 hover:text-white'
                }`}
                style={pathname === item.href ? {backgroundColor: '#A00A9A'} : {}}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Menús solo para administradores */}
            {mounted && user?.rol === 'admin' && menuItemsAdmin.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-white'
                    : 'text-purple-100 hover:text-white'
                }`}
                style={pathname === item.href ? {backgroundColor: '#A00A9A'} : {}}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Menú de usuario */}
            {mounted && user && (
              <div className="relative ml-4">
                <button
                  onClick={() => setMostrarMenuUsuario(!mostrarMenuUsuario)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-purple-100 hover:text-white transition-colors duration-200"
                >
                  <div className="relative">
                    {fotoPerfilUrl ? (
                      <img
                        src={fotoPerfilUrl}
                        alt="Foto de perfil"
                        className="w-8 h-8 rounded-full object-cover border-2 border-purple-300"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium">
                        {(nombreActualizado || `${user?.nombre} ${user?.apellido}`)?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {user?.rol === 'admin' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-purple-600 flex items-center justify-center">
                        <span className="text-xs">👑</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm">{nombreActualizado || `${user?.nombre} ${user?.apellido}`}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {mostrarMenuUsuario && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <p className="font-medium">{nombreActualizado || `${user?.nombre} ${user?.apellido}`}</p>
                      <p className="text-gray-500">{user?.email}</p>
                      <p className="text-xs uppercase" style={{color: '#C70CB9'}}>{user?.rol}</p>
                    </div>
                    
                    {/* Opciones de administrador */}
                    {user?.rol === 'admin' && (
                      <>
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setMostrarMenuUsuario(false)}
                        >
                          <span className="mr-2">📊</span>
                          Dashboard Admin
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                      </>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="mr-2">🚪</span>
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Menú móvil - botón hamburguesa */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-purple-100 hover:text-white focus:outline-none focus:text-white"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menú móvil - desplegable */}
        <div className="md:hidden border-t border-purple-500">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-white'
                    : 'text-purple-100 hover:text-white'
                }`}
                style={pathname === item.href ? {backgroundColor: '#A00A9A'} : {}}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Opciones de administrador en móvil */}
            {mounted && user?.rol === 'admin' && (
              <>
                <div className="border-t border-purple-500 my-2"></div>
                <div className="px-3 py-1">
                  <p className="text-xs text-purple-200 uppercase font-semibold">Administración</p>
                </div>
                <Link
                  href="/admin"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    pathname === '/admin'
                      ? 'text-white'
                      : 'text-purple-100 hover:text-white'
                  }`}
                  style={pathname === '/admin' ? {backgroundColor: '#A00A9A'} : {}}
                >
                  <span>📊</span>
                  <span>Dashboard Admin</span>
                </Link>
                {menuItemsAdmin.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      pathname === item.href
                        ? 'text-white'
                        : 'text-purple-100 hover:text-white'
                    }`}
                    style={pathname === item.href ? {backgroundColor: '#A00A9A'} : {}}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navegacion;
