'use client';

import React, { useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { migrarDatosASupabase } from '@/scripts/migrarASupabase';

export default function MigracionPage() {
  const [status, setStatus] = useState<string>('');
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setStatus('Iniciando migración...');
    setRunning(true);
    try {
      const res = await migrarDatosASupabase();
      setStatus(res?.message || 'Migración finalizada');
    } catch (e: any) {
      setStatus(`Error: ${e?.message || e}`);
    } finally {
      setRunning(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Migración a Supabase</h1>
        <p className="text-sm text-red-600">Supabase no está configurado. Definí las variables en <code>.env.local</code> y reiniciá el servidor.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Migración a Supabase</h1>
      <p className="text-sm text-gray-700">Este proceso migrará: contratistas, asociados, fotos DNI, adjuntos, historial de contratistas, entregas de ropa, accidentes y whitelist.</p>
      <button
        onClick={handleRun}
        disabled={running}
        className={`px-4 py-2 rounded-md text-white font-medium ${running ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {running ? 'Migrando...' : 'Ejecutar migración'}
      </button>
      {status && (
        <div className="text-sm text-gray-800 border rounded p-3 bg-gray-50">{status}</div>
      )}
    </div>
  );
}


