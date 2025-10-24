'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import HistorialMedico from '@/components/HistorialMedico';
import { supabase } from '@/lib/supabase';
import { supabaseHistorialMedicoService } from '@/services/supabaseHistorialMedicoService';
import { HistorialMedico as HistorialMedicoType, historialMedicoDefault } from '@/types/medico';

export default function HistorialMedicoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const asociadoId = (params?.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asociado, setAsociado] = useState<any>(null);
  const [historial, setHistorial] = useState<HistorialMedicoType>(historialMedicoDefault);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!asociadoId) return;
      setLoading(true);
      setError(null);
      try {
        // Traer datos básicos del asociado
        const { data, error } = await (supabase as any)
          .from('asociados')
          .select('*')
          .eq('id', asociadoId)
          .single();
        if (error) throw error;
        setAsociado(data);

        // Traer historial médico
        const hm = await supabaseHistorialMedicoService.obtener(asociadoId);
        setHistorial(hm || historialMedicoDefault);
      } catch (e: any) {
        setError(e?.message || 'No se pudo cargar el historial médico');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [asociadoId]);

  const handleGuardar = async () => {
    if (!asociadoId) return;
    setSaving(true);
    setSavedMsg(null);
    try {
      await supabaseHistorialMedicoService.guardar(asociadoId, historial);
      setSavedMsg('Historial guardado correctamente');
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el historial');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 3000);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Historial Médico</h1>
            {asociado && (
              <p className="text-gray-600">
                {asociado.nombre} {asociado.apellido} · DNI {asociado.dni}
                {asociado.contratista && (
                  <>
                    {' '}
                    · Contratista: {asociado?.contratista?.nombre || asociado?.contratista || ''}
                  </>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            ← Volver
          </button>
        </div>

        {loading && (
          <div className="bg-white p-6 rounded-lg shadow text-gray-600">Cargando…</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {savedMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm">{savedMsg}</div>
            )}
            <HistorialMedico historialMedico={historial} onChange={setHistorial} readonly={false} showHabitos />
            <div className="flex justify-end">
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}


