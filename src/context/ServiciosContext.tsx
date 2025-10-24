'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAsociadosService } from '@/services/supabaseAsociadosService';
import { supabaseContratistasService } from '@/services/supabaseContratistasService';
import { supabaseHistorialContratistasService } from '@/services/supabaseHistorialContratistasService';

type ServiciosContextType = {
  usandoSupabase: boolean;
  asociados: typeof supabaseAsociadosService;
  contratistas: typeof supabaseContratistasService;
  historialContratistas: typeof supabaseHistorialContratistasService;
};

const ServiciosContext = createContext<ServiciosContextType | null>(null);

export const ServiciosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<ServiciosContextType>(() => ({
    usandoSupabase: isSupabaseConfigured,
    asociados: supabaseAsociadosService,
    contratistas: supabaseContratistasService,
    historialContratistas: supabaseHistorialContratistasService,
  }), []);

  return <ServiciosContext.Provider value={value}>{children}</ServiciosContext.Provider>;
};

export function useServicios(): ServiciosContextType {
  const ctx = useContext(ServiciosContext);
  if (!ctx) throw new Error('useServicios debe usarse dentro de ServiciosProvider');
  return ctx;
}


