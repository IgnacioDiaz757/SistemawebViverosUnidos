'use client';

import React, { useEffect, useState } from 'react';
import { useEmpleados } from '@/context/EmpleadosContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabaseContratistasService } from '@/services/supabaseContratistasService';
import { isSupabaseConfigured } from '@/lib/supabase';
import AlertBanner from '@/components/AlertBanner';

export default function ContratistasPage() {
  const { state, agregarContratista, eliminarContratista, obtenerAsociadosActivos } = useEmpleados();
  const [nuevoContratista, setNuevoContratista] = useState('');
  const [contratistaAEliminar, setContratistaAEliminar] = useState<string | null>(null);
  const [contratistasDb, setContratistasDb] = useState<{ id: string; nombre: string }[]>([]);
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  // Cargar contratistas desde Supabase y escuchar actualizaciones globales
  useEffect(() => {
    const load = async () => {
      try {
        const lista = await supabaseContratistasService.listar();
        setContratistasDb(lista || []);
      } catch {
        setContratistasDb([]);
      }
    };
    load();
    const handler = () => { load(); };
    window.addEventListener('contratistasUpdated', handler as any);
    return () => window.removeEventListener('contratistasUpdated', handler as any);
  }, []);

  const handleAgregarContratista = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = nuevoContratista.trim();
    if (!nombre) return;
    try {
      if (isSupabaseConfigured) {
        const creado = await supabaseContratistasService.crear(nombre);
        // Si ya existía y se reactivó, avisar
        const yaExistia = (contratistasDb.find(c => c.id === creado.id) || state.contratistas.find(c => (c as any).id === creado.id));
        if (yaExistia) {
          setBanner({ type: 'info', message: `El contratista "${creado.nombre}" ya existía y fue reactivado.` });
        }
        try { window.dispatchEvent(new CustomEvent('contratistasUpdated')); } catch {}
      }
      // Mantener compatibilidad con estado local
      agregarContratista(nombre);
      setNuevoContratista('');
    } catch (error: any) {
      setBanner({ type: 'error', message: error?.message || 'Error al crear contratista' });
    }
  };

  const handleEliminarContratista = async (id: string, nombre: string) => {
    try {
      if (isSupabaseConfigured) {
        // Pre-chequeo: no permitir eliminar si tiene asociados activos
        try {
          const check = await (supabaseContratistasService as any).puedeEliminar?.(id);
          if (check && !check.puede) {
            setBanner({ type: 'warning', message: `No se puede eliminar: tiene ${check.cantidad} asociado(s) activo(s) asignado(s)` });
            return;
          }
        } catch {}
        await (supabaseContratistasService as any).eliminar?.(id);
        // Reload lista desde DB para evitar residuos
        try {
          const lista = await supabaseContratistasService.listar();
          setContratistasDb(lista || []);
        } catch {}
        try { window.dispatchEvent(new CustomEvent('contratistasUpdated')); } catch {}
      }
      // Mantener compatibilidad con estado local (por nombre)
      const local = state.contratistas.find(c => (c.id === id) || (c.nombre?.trim().toLowerCase() === nombre.trim().toLowerCase()));
      if (local) {
        const res = eliminarContratista(local.id);
        if (!res.success) {
          // No bloquear si el local falla; ya se eliminó en DB
        }
      }
      setBanner({ type: 'success', message: 'Contratista eliminado' });
      setContratistaAEliminar(null);
    } catch (e: any) {
      setBanner({ type: 'error', message: e?.message || 'Error al eliminar contratista' });
    }
  };

  const obtenerAsociadosDelContratista = (nombreContratista: string) => {
    const asociadosActivos = obtenerAsociadosActivos();
    return asociadosActivos.filter(asociado => asociado.contratista === nombreContratista);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {banner && (
          <AlertBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
        )}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Contratistas
          </h1>
          <p className="text-lg text-gray-600">
            Administra los contratistas de la cooperativa
          </p>
        </div>

      {/* Formulario para agregar nuevo contratista */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Agregar Nuevo Contratista</h2>
        <form onSubmit={handleAgregarContratista} className="flex gap-3">
          <input
            type="text"
            value={nuevoContratista}
            onChange={(e) => setNuevoContratista(e.target.value)}
            placeholder="Nombre del contratista"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Agregar
          </button>
        </form>
      </div>

      {/* Lista de contratistas existentes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Contratistas Registrados</h2>
        
        {(contratistasDb.length || state.contratistas.length) === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay contratistas registrados</p>
        ) : (
          <div className="space-y-4">
            {(contratistasDb.length ? contratistasDb : state.contratistas).map((contratista) => {
              const asociadosAsignados = obtenerAsociadosDelContratista(contratista.nombre);
              const puedeEliminar = asociadosAsignados.length === 0;

              return (
                <div key={contratista.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-lg">{contratista.nombre}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {asociadosAsignados.length === 0 
                        ? 'Sin asociados asignados'
                        : `${asociadosAsignados.length} asociado(s) activo(s) asignado(s)`
                      }
                    </p>
                    {asociadosAsignados.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-medium">Asociados asignados:</p>
                        <ul className="text-sm text-gray-600 ml-2 mt-1">
                          {asociadosAsignados.slice(0, 5).map((asociado) => (
                            <li key={asociado.id}>• {asociado.nombre} {asociado.apellido} (Legajo: {asociado.legajo})</li>
                          ))}
                          {asociadosAsignados.length > 5 && (
                            <li className="text-gray-500 italic">... y {asociadosAsignados.length - 5} más</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {puedeEliminar ? (
                      <button
                        onClick={() => setContratistaAEliminar(contratista.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      >
                        🗑️ Eliminar
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-md cursor-not-allowed" title="No se puede eliminar: tiene asociados asignados">
                        🔒 No disponible
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      {contratistaAEliminar && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Está seguro que desea eliminar este contratista? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setContratistaAEliminar(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const target = (contratistasDb.length ? contratistasDb : state.contratistas).find(c => c.id === contratistaAEliminar);
                  handleEliminarContratista(contratistaAEliminar, target?.nombre || '');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
