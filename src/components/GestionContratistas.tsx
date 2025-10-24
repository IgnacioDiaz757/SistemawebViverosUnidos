'use client';

import React, { useEffect, useState } from 'react';
import { supabaseContratistasService } from '@/services/supabaseContratistasService';

interface GestionContratistasProps {
  isOpen: boolean;
  onClose: () => void;
}

const GestionContratistas: React.FC<GestionContratistasProps> = ({ isOpen, onClose }) => {
  const [contratistas, setContratistas] = useState<{ id: string; nombre: string }[]>([]);
  const [nuevoContratista, setNuevoContratista] = useState('');
  const [contratistaAEliminar, setContratistaAEliminar] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    supabaseContratistasService.listar().then(setContratistas).catch(console.error);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAgregarContratista = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = nuevoContratista.trim();
    if (!nombre) return;
    try {
      const creado = await supabaseContratistasService.crear(nombre);
      setContratistas(prev => [...prev, creado].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevoContratista('');
      try { window.dispatchEvent(new CustomEvent('contratistasUpdated')); } catch {}
    } catch (error: any) {
      alert(error?.message || 'Error al crear contratista');
    }
  };

  const handleEliminarContratista = async (id: string) => {
    try {
      const check = await supabaseContratistasService.puedeEliminar(id);
      if (!check.puede) {
        alert(`No se puede eliminar: tiene ${check.cantidad} asociado(s) activo(s) asignado(s)`);
        return;
      }
      await supabaseContratistasService.eliminar(id);
      setContratistas(prev => prev.filter(c => c.id !== id));
      setContratistaAEliminar(null);
      try { window.dispatchEvent(new CustomEvent('contratistasUpdated')); } catch {}
    } catch (error: any) {
      alert(error?.message || 'Error al eliminar contratista');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Gestión de Contratistas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Formulario para agregar nuevo contratista */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Agregar Nuevo Contratista</h4>
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
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Contratistas Existentes</h4>
          {contratistas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay contratistas registrados</p>
          ) : (
            <div className="space-y-3">
              {contratistas.map((contratista) => (
                <div key={contratista.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{contratista.nombre}</h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setContratistaAEliminar(contratista.id)}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de confirmación para eliminar */}
        {contratistaAEliminar && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-60">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmar Eliminación
              </h4>
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
                  onClick={() => handleEliminarContratista(contratistaAEliminar)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionContratistas;
