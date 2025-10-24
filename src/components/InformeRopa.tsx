'use client';

import React, { useState, useEffect } from 'react';
import { informesRopaService, InformeRopaFiltros, InformeRopaItem, ResumenInformeRopa } from '@/services/supabaseInformesRopaService';

interface InformeRopaProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIAS_COLORS = {
  proteccion: 'bg-red-100 text-red-800',
  uniformes: 'bg-blue-100 text-blue-800',
  calzado: 'bg-green-100 text-green-800',
  accesorios: 'bg-yellow-100 text-yellow-800',
  otros: 'bg-gray-100 text-gray-800',
};

export default function InformeRopa({ isOpen, onClose }: InformeRopaProps) {
  const [filtros, setFiltros] = useState<InformeRopaFiltros>({
    fecha_desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fecha_hasta: new Date().toISOString().split('T')[0],
  });
  const [contratistas, setContratistas] = useState<Array<{ id: string; nombre: string }>>([]);
  const [items, setItems] = useState<InformeRopaItem[]>([]);
  const [resumen, setResumen] = useState<ResumenInformeRopa | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      cargarContratistas();
      generarInforme();
    }
  }, [isOpen]);

  const cargarContratistas = async () => {
    try {
      const data = await informesRopaService.obtenerContratistas();
      setContratistas(data);
    } catch (err) {
      console.error('Error cargando contratistas:', err);
    }
  };

  const generarInforme = async () => {
    setCargando(true);
    setError(null);
    
    try {
      const [itemsData, resumenData] = await Promise.all([
        informesRopaService.obtenerInformeRopa(filtros),
        informesRopaService.obtenerResumenInformeRopa(filtros),
      ]);
      
      setItems(itemsData);
      setResumen(resumenData);
    } catch (err: any) {
      console.error('Error generando informe:', err);
      setError(err.message || 'Error al generar el informe');
    } finally {
      setCargando(false);
    }
  };

  const handleFiltroChange = (key: keyof InformeRopaFiltros, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const exportarExcel = () => {
    // Crear datos para Excel
    const datosExcel = items.map(item => ({
      'Fecha Entrega': item.fecha_entrega,
      'Contratista': item.contratista_nombre,
      'Asociado': `${item.asociado_nombre} ${item.asociado_apellido}`,
      'Legajo': item.asociado_legajo,
      'Elemento': item.elemento_nombre,
      'Categoría': item.elemento_categoria,
      'Talla': item.talla || 'N/A',
      'Cantidad': item.cantidad,
      'Entregado por': item.entregado_por || 'N/A',
      'Observaciones': item.observaciones || 'N/A',
    }));

    // Convertir a CSV
    const headers = Object.keys(datosExcel[0] || {});
    const csvContent = [
      headers.join(','),
      ...datosExcel.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `informe_ropa_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Informe de Entregas de Ropa</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contratista
              </label>
              <select
                value={filtros.contratista_id || ''}
                onChange={(e) => handleFiltroChange('contratista_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los contratistas</option>
                {contratistas.map(contratista => (
                  <option key={contratista.id} value={contratista.id}>
                    {contratista.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde || ''}
                onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta || ''}
                onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={generarInforme}
                disabled={cargando}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {cargando ? 'Generando...' : 'Generar Informe'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Resumen */}
        {resumen && (
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold mb-3">Resumen General</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">{resumen.total_entregas}</div>
                <div className="text-sm text-gray-600">Total Entregas</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">{resumen.total_elementos}</div>
                <div className="text-sm text-gray-600">Total Elementos</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">{resumen.total_asociados}</div>
                <div className="text-sm text-gray-600">Asociados</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="text-2xl font-bold text-orange-600">{resumen.total_contratistas}</div>
                <div className="text-sm text-gray-600">Contratistas</div>
              </div>
            </div>

            {/* Resumen por Contratista */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Resumen por Contratista</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {resumen.resumen_por_contratista.map(item => (
                  <div key={item.contratista_id} className="bg-white p-3 rounded-lg shadow">
                    <div className="font-medium text-gray-800">{item.contratista_nombre}</div>
                    <div className="text-sm text-gray-600">
                      {item.total_entregas} entregas • {item.total_elementos} elementos • {item.total_asociados} asociados
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen por Elemento */}
            <div>
              <h4 className="font-semibold mb-2">Resumen por Elemento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {resumen.resumen_por_elemento.map(item => (
                  <div key={item.elemento_id} className="bg-white p-3 rounded-lg shadow">
                    <div className="font-medium text-gray-800">{item.elemento_nombre}</div>
                    <div className="text-sm text-gray-600">
                      {item.total_cantidad} unidades • {item.total_entregas} entregas
                    </div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${CATEGORIAS_COLORS[item.elemento_categoria as keyof typeof CATEGORIAS_COLORS] || CATEGORIAS_COLORS.otros}`}>
                      {item.elemento_categoria}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Detalles */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Detalle de Entregas</h3>
            <button
              onClick={exportarExcel}
              disabled={items.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Exportar Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contratista</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asociado</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Legajo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Elemento</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Talla</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregado por</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{item.fecha_entrega}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.contratista_nombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.asociado_nombre} {item.asociado_apellido}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.asociado_legajo}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.elemento_nombre}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${CATEGORIAS_COLORS[item.elemento_categoria as keyof typeof CATEGORIAS_COLORS] || CATEGORIAS_COLORS.otros}`}>
                        {item.elemento_categoria}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.talla || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.cantidad}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.entregado_por || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {items.length === 0 && !cargando && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron entregas con los filtros seleccionados
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
