'use client';

import { useState } from 'react';
import ReportesLiquidacion from '@/components/ReportesLiquidacion';
import InformeRopa from '@/components/InformeRopa';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ReportesPage() {
  const [mostrarInformeRopa, setMostrarInformeRopa] = useState(false);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reportes del Sistema
          </h1>
          <p className="text-lg text-gray-600">
            Genera informes de liquidación y entregas de ropa
          </p>
        </div>

        {/* Botones de navegación entre reportes */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setMostrarInformeRopa(false)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              !mostrarInformeRopa
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Reportes de Liquidación
          </button>
          <button
            onClick={() => setMostrarInformeRopa(true)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              mostrarInformeRopa
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Informe de Ropa
          </button>
        </div>
        
        {mostrarInformeRopa ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Informe de Entregas de Ropa
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Consulta todas las entregas de ropa por contratista, fechas y elementos
            </p>
            <button
              onClick={() => setMostrarInformeRopa(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Abrir Informe de Ropa
            </button>
          </div>
        ) : (
          <ReportesLiquidacion />
        )}

        {/* Modal de Informe de Ropa */}
        <InformeRopa
          isOpen={mostrarInformeRopa}
          onClose={() => setMostrarInformeRopa(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
