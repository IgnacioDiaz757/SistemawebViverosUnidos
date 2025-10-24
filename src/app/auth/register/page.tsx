'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { user, signUp, loading: authLoading } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones básicas
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, {
        nombre: 'Administradora',
        apellido: 'Sistema',
        cargo: 'Administradora'
      });

      if (error) {
        setError(error.message);
      } else {
        setError('Cuenta creada exitosamente. Revisa tu email para confirmar la cuenta.');
        // Limpiar formulario
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Error inesperado al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-4 sm:py-6 lg:py-8">
      {/* Logo y título principal */}
      <div className="text-center mb-4 sm:mb-6 lg:mb-8">
        <img 
          src="/images/logo-viveros.png" 
          alt="Viveros Unidos" 
          className="h-20 sm:h-24 md:h-28 lg:h-32 mx-auto drop-shadow-lg" 
        />
        <h1 className="mt-2 sm:mt-3 text-lg sm:text-xl font-bold text-gray-800 tracking-wide">
          Sistema de Gestión
        </h1>
        <p className="text-base sm:text-lg font-semibold mt-1" style={{color: '#C70CB9'}}>
          Viveros Unidos
        </p>
      </div>

      {/* Tarjeta de registro */}
      <div className="w-full max-w-sm sm:max-w-md bg-white/90 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border border-white/20">
        {/* Header del formulario */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">
            Crear Cuenta
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            Regístrate para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 lg:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 text-gray-800 placeholder:text-gray-400 bg-white/80 transition-all duration-200 text-sm sm:text-base"
              style={{'--tw-ring-color': '#C70CB9'} as React.CSSProperties}
              onFocus={(e) => {
                e.target.style.borderColor = '#C70CB9';
                e.target.style.boxShadow = '0 0 0 3px rgba(199, 12, 185, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="tu-email@dominio.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 text-gray-800 placeholder:text-gray-400 bg-white/80 transition-all duration-200 text-sm sm:text-base"
              style={{'--tw-ring-color': '#C70CB9'} as React.CSSProperties}
              onFocus={(e) => {
                e.target.style.borderColor = '#C70CB9';
                e.target.style.boxShadow = '0 0 0 3px rgba(199, 12, 185, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 text-gray-800 placeholder:text-gray-400 bg-white/80 transition-all duration-200 text-sm sm:text-base"
              style={{'--tw-ring-color': '#C70CB9'} as React.CSSProperties}
              onFocus={(e) => {
                e.target.style.borderColor = '#C70CB9';
                e.target.style.boxShadow = '0 0 0 3px rgba(199, 12, 185, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Repite tu contraseña"
              required
            />
          </div>

          {error && (
            <div 
              className={`text-xs sm:text-sm p-3 sm:p-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium ${error.includes('exitosamente') ? 'border-2' : 'bg-red-50 text-red-700 border-2 border-red-200'}`}
              style={error.includes('exitosamente') ? {
                backgroundColor: '#F3E5F2',
                color: '#C70CB9',
                borderColor: '#C70CB9'
              } : {}}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 lg:py-3.5 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 font-semibold text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(to right, #C70CB9, #A00A9A)',
              '--tw-ring-color': '#C70CB9'
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #A00A9A, #8B0A7A)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #C70CB9, #A00A9A)';
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs sm:text-sm lg:text-base">Creando cuenta...</span>
              </span>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        {/* Footer del formulario */}
        <div className="mt-4 sm:mt-6 lg:mt-8 text-center">
          <Link
            href="/auth/login"
            className="font-semibold text-xs sm:text-sm transition-colors duration-200"
            style={{color: '#C70CB9'}}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#A00A9A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#C70CB9';
            }}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>

        {/* Mensaje de la empresa */}
        <div className="mt-3 sm:mt-4 lg:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Hecho con ❤️ por
            <span className="font-bold ml-1" style={{color: '#C70CB9'}}>Viveros Unidos</span>
          </p>
        </div>
      </div>
    </div>
  );
}