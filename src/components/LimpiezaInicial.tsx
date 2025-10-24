'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LimpiezaInicial() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const email = (user?.email || '').toLowerCase();
    if (email !== 'admin@cooperativa.com') return;

    const FLAG_KEY = 'cleanup_done_v1';
    const already = localStorage.getItem(FLAG_KEY);
    if (already) return;

    ejecutarLimpieza();
  }, [user?.email]);

  const ejecutarLimpieza = () => {
    try {
      console.log('🧹 [LimpiezaInicial] Ejecutando limpieza inicial...');
      
      // Limpiar datos de localStorage
      const keysToRemove = [
        'asociados',
        'empleados',
        'contratistas',
        'usuarios_admin',
        'accidentes',
        'elementos_ropa',
        'entregas_ropa',
        'emails_autorizados',
        'usuarios_autorizados_detalle',
      ];
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Limpiar perfiles guardados por usuario
      const keys = Object.keys(localStorage);
      keys.filter((k) => k.startsWith('perfil_')).forEach((k) => localStorage.removeItem(k));

      // Marcar limpieza realizada
      localStorage.setItem('cleanup_done_v1', 'true');
      console.log('✅ [LimpiezaInicial] Limpieza inicial completada.');
      
    } catch (error) {
      console.error('❌ [LimpiezaInicial] Error durante la limpieza:', error);
    }
  };

  return null;
}


