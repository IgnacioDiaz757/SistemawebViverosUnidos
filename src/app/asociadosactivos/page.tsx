'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import ListaEmpleados from '@/components/ListaEmpleados';
import React from 'react';

export default function AsociadosActivosPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Asociados Activos
          </h1>
          <p className="text-lg text-gray-600">
            Lista de asociados activos con filtro por contratista
          </p>
        </div>

        <ListaEmpleados tipo="activos" />
      </div>
    </ProtectedRoute>
  );
}


