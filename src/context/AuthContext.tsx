'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type RolUsuario = 'admin' | 'operador';

export interface UsuarioSesion {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
}

interface AuthContextValue {
  user: UsuarioSesion | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UsuarioSesion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (isSupabaseConfigured) {
        try {
          const { data } = await (supabase as any).auth.getUser();
          const u = data?.user;
          if (u?.email) {
            const sessionUser: UsuarioSesion = {
              id: u.id,
              email: u.email,
              nombre: (u.user_metadata?.nombre as string) || 'Usuario',
              apellido: (u.user_metadata?.apellido as string) || '',
              rol: ((u.user_metadata?.rol as RolUsuario) || 'admin'),
            };
            setUser(sessionUser);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        } finally {
          setLoading(false);
        }
        // Suscripción a cambios de sesión/usuario
        const { data: sub } = (supabase as any).auth.onAuthStateChange((_event: any, session: any) => {
          const u = session?.user;
          if (u?.email) {
            const sessionUser: UsuarioSesion = {
              id: u.id,
              email: u.email,
              nombre: (u.user_metadata?.nombre as string) || 'Usuario',
              apellido: (u.user_metadata?.apellido as string) || '',
              rol: ((u.user_metadata?.rol as RolUsuario) || 'admin'),
            };
            setUser(sessionUser);
          } else {
            setUser(null);
          }
        });
        return () => {
          try { sub?.subscription?.unsubscribe?.(); } catch {}
        };
        return;
      }
      // Si Supabase no está configurado
      setUser(null);
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const e = normalizeEmail(email);
    if (isSupabaseConfigured) {
      // Primero intentamos autenticar contra Supabase Auth
      try {
        const { data, error } = await (supabase as any).auth.signInWithPassword({ email: e, password });
        if (error || !data?.user) {
          // Log visible para diagnosticar por qué falla el login en Supabase
          if (typeof console !== 'undefined') {
            console.error('[Auth] Error signInWithPassword', {
              email: e,
              code: (error as any)?.code,
              message: (error as any)?.message,
              rawError: error,
              rawData: data,
              errorToString: (error as any)?.toString?.(),
              errorJson: ((): string | null => {
                try { return JSON.stringify(error); } catch { return null; }
              })(),
            });
            try {
              const compact = JSON.stringify({ error, data });
              console.error('[Auth] signInWithPassword compact=', compact);
            } catch {}
          }
          return false;
        }
        const u = data.user;
        const sessionUser: UsuarioSesion = {
          id: u.id,
          email: u.email,
          nombre: (u.user_metadata?.nombre as string) || 'Usuario',
          apellido: (u.user_metadata?.apellido as string) || '',
          rol: ((u.user_metadata?.rol as RolUsuario) || 'admin'),
        };
        setUser(sessionUser);
        // No persistimos en localStorage; supabase-js maneja la sesión
        return true;
      } catch (err: any) {
        if (typeof console !== 'undefined') {
          console.error('[Auth] Exception signInWithPassword', {
            email: e,
            message: err?.message,
          });
        }
        return false;
      }
    }
    // Si Supabase no está configurado, fallar explícitamente
    if (typeof console !== 'undefined') {
      console.warn('[Auth] Supabase no configurado. Login deshabilitado.');
    }
    return false;
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await (supabase as any).auth.signOut();
      }
    } catch {}
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}


