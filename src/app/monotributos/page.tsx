'use client';

import React, { useMemo, useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useEmpleados } from '@/context/EmpleadosContext';
import { useAuth } from '@/context/AuthContext';
import { useServicios } from '@/context/ServiciosContext';
import { supabaseAsociadosService } from '@/services/supabaseAsociadosService';
import AlertBanner from '@/components/AlertBanner';

export default function MonotributosPage() {
  const { state, obtenerEmpleadosActivos, editarAsociado } = useEmpleados();
  const { user } = useAuth();
  const servicios = useServicios();

  const [filtroContratista, setFiltroContratista] = useState<string>(''); // ID
  const [contratistas, setContratistas] = useState<{ id: string; nombre: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        if ((servicios as any)?.contratistas?.listar) {
          const lista = await (servicios as any).contratistas.listar();
          setContratistas((lista || []).map((c: any) => ({ id: String(c.id), nombre: String(c.nombre) })));
        } else {
          setContratistas((state.contratistas || []).map((c: any) => ({ id: String(c.id), nombre: String(c.nombre) })));
        }
      } catch {
        setContratistas((state.contratistas || []).map((c: any) => ({ id: String(c.id), nombre: String(c.nombre) })));
      }
    })();
  }, [state.contratistas]);
  const [activosBase, setActivosBase] = useState<any[]>([]);
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [busquedaNombre, setBusquedaNombre] = useState<string>('');
  const [busquedaDni, setBusquedaDni] = useState<string>('');

  // Cargar activos desde servicios (Supabase/local)
  useEffect(() => {
    (async () => {
      try {
        const lista = await (servicios as any).asociados.obtenerAsociadosActivos();
        setActivosBase(lista || []);
      } catch {
        setActivosBase(obtenerEmpleadosActivos?.() || state.asociados || []);
      }
    })();
  }, [servicios, obtenerEmpleadosActivos, state.asociados]);
  const idPorNombreLower = useMemo(() => Object.fromEntries((contratistas || []).map((c) => [String(c.nombre).trim().toLowerCase(), String(c.id)])), [contratistas]);
  const nombrePorId = useMemo(() => Object.fromEntries((contratistas || []).map((c) => [String(c.id), String(c.nombre)])), [contratistas]);

  const getContratistaIdFromAsociado = (a: any): string | '' => {
    const id = a?.contratista_id || a?.id_contratista || (typeof a?.contratista === 'object' && a?.contratista?.id) || '';
    if (id) return String(id);
    const nombre = typeof a?.contratista === 'string' ? a?.contratista : a?.contratista?.nombre;
    if (nombre) {
      const k = String(nombre).trim().toLowerCase();
      return idPorNombreLower[k] || '';
    }
    return '';
  };

  const activos = useMemo(() => {
    if (!filtroContratista) return activosBase;
    const selectedId = String(filtroContratista);
    const selectedName = nombrePorId[selectedId] || '';
    const norm = (s: string) => (s || '').trim().toLowerCase();
    return activosBase.filter((a: any) => {
      const id = getContratistaIdFromAsociado(a);
      if (id) return String(id) === selectedId;
      const raw = a?.contratista;
      const nombre = typeof raw === 'string' ? raw : a?.contratista?.nombre;
      // Coincidir por nombre normalizado o por el propio id (por si está guardado incorrectamente como string)
      return norm(nombre || '') === norm(selectedName) || norm(String(raw || '')) === norm(selectedId);
    });
  }, [activosBase, filtroContratista, idPorNombreLower, nombrePorId]);

  const activosFiltrados = useMemo(() => {
    const byNombre = (list: any[]) => {
      if (!busquedaNombre) return list;
      const q = busquedaNombre.toLowerCase();
      return list.filter((a: any) =>
        (a.nombre || '').toLowerCase().includes(q) ||
        (a.apellido || '').toLowerCase().includes(q)
      );
    };
    const byDni = (list: any[]) => {
      if (!busquedaDni) return list;
      return list.filter((a: any) => (a.dni || '').toString().includes(busquedaDni));
    };
    return byDni(byNombre(activos));
  }, [activos, busquedaNombre, busquedaDni]);

  const conMonotributo = activosFiltrados.filter((a: any) => !!a.monotributo);
  const sinMonotributo = activosFiltrados.filter((a: any) => !a.monotributo);

  const Card = ({ title, count, color }: { title: string; count: number; color: string }) => (
    <div className={`p-4 rounded-lg border ${color}`}>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{count}</p>
    </div>
  );

  const toggleMonotributo = async (asociado: any, valor: boolean) => {
    try {
      await supabaseAsociadosService.actualizarAsociado(asociado.id, { monotributo: valor });
      // Refrescar lista local
      setActivosBase(prev => prev.map((a) => a.id === asociado.id ? { ...a, monotributo: valor } : a));
      // Sincronizar contexto para coherencia con otras vistas
      editarAsociado({ ...asociado, monotributo: valor });
      setBanner({ type: 'success', message: valor ? 'Monotributo marcado correctamente' : 'Monotributo quitado correctamente' });
    } catch (e) {
      setBanner({ type: 'error', message: 'No se pudo actualizar monotributo' });
    }
  };

  // Opcional: estado pendiente solo local (sin DB)
  const marcarPendiente = (asociado: any) => setActivosBase(prev => prev.map(a => a.id === asociado.id ? { ...a, monotributo_pendiente: true } : a));
  const limpiarPendiente = (asociado: any) => setActivosBase(prev => prev.map(a => a.id === asociado.id ? { ...a, monotributo_pendiente: false } : a));

  const Tabla = ({ data }: { data: any[] }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asociado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Ingreso</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((a: any) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{a.nombre} {a.apellido}</div>
                {a.legajo && <div className="text-sm text-gray-500">Legajo: {a.legajo}</div>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.dni}</td>
              
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.fecha_ingreso || a.fechaIngreso}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                <div className="inline-flex items-center gap-2">
                  {a.monotributo ? (
                    <button
                      onClick={() => toggleMonotributo(a, false)}
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Quitar
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleMonotributo(a, true)}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Marcar
                    </button>
                  )}
                  {a.monotributo_pendiente ? (
                    <button
                      onClick={() => limpiarPendiente(a)}
                      className="px-3 py-1 text-xs bg-blue-200 text-blue-800 rounded hover:bg-blue-300"
                    >
                      Quitar Pendiente
                    </button>
                  ) : (
                    <button
                      onClick={() => marcarPendiente(a)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Pendiente
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {banner && (
          <AlertBanner
            type={banner.type}
            message={banner.message}
            onClose={() => setBanner(null)}
          />
        )}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Monotributos</h1>
          <p className="text-lg text-gray-600">Listado de asociados activos con y sin monotributo</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por contratista</label>
              <select
                value={filtroContratista}
                onChange={(e) => setFiltroContratista(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los contratistas</option>
                {contratistas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por nombre/apellido</label>
              <input
                type="text"
                value={busquedaNombre}
                onChange={(e) => setBusquedaNombre(e.target.value)}
                placeholder="Ej: Juan, Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por DNI</label>
              <input
                type="text"
                inputMode="numeric"
                value={busquedaDni}
                onChange={(e) => setBusquedaDni(e.target.value)}
                placeholder="Ej: 12345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setFiltroContratista(''); setBusquedaNombre(''); setBusquedaDni(''); }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 w-full"
              >
                Limpiar filtro
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Total Activos" count={activos.length} color="border-blue-200 bg-blue-50" />
          <Card title="Con Monotributo" count={conMonotributo.length} color="border-green-200 bg-green-50" />
          <Card title="Sin Monotributo" count={sinMonotributo.length} color="border-gray-200 bg-gray-50" />
        </div>

        <div className="bg-white rounded-lg shadow-md border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Con Monotributo ({conMonotributo.length})</h2>
          </div>
          {conMonotributo.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No hay asociados con monotributo</div>
          ) : (
            <div className="p-4">
              <Tabla data={conMonotributo} />
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Sin Monotributo ({sinMonotributo.length})</h2>
          </div>
          {sinMonotributo.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No hay asociados sin monotributo</div>
          ) : (
            <div className="p-4">
              <Tabla data={sinMonotributo} />
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Pendiente de Monotributo ({activos.filter((a:any)=>a.monotributo_pendiente).length})</h2>
          </div>
          {activos.filter((a:any)=>a.monotributo_pendiente).length === 0 ? (
            <div className="p-6 text-center text-gray-500">No hay asociados pendientes</div>
          ) : (
            <div className="p-4">
              <Tabla data={activos.filter((a:any)=>a.monotributo_pendiente)} />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}


