'use client';

import { useState } from 'react';
import { verificarTablaArchivos } from '@/scripts/verificarTablaArchivos';

export default function DebugSupabasePage() {
  const [resultado, setResultado] = useState<string>('');
  const [ejecutando, setEjecutando] = useState(false);

  const ejecutarVerificacion = async () => {
    setEjecutando(true);
    setResultado('');
    
    // Capturar console.log
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      logs.push(`[LOG] ${args.join(' ')}`);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      logs.push(`[ERROR] ${args.join(' ')}`);
      originalError(...args);
    };
    
    try {
      await verificarTablaArchivos();
    } catch (error) {
      console.error('Error ejecutando verificación:', error);
    } finally {
      // Restaurar console original
      console.log = originalLog;
      console.error = originalError;
      setResultado(logs.join('\n'));
      setEjecutando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug - Verificar Tabla Archivos</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Verificación de Tabla Archivos</h2>
        <p className="text-gray-600 mb-4">
          Este script verifica si la tabla "archivos" existe en Supabase y tiene la estructura correcta.
        </p>
        
        <button
          onClick={ejecutarVerificacion}
          disabled={ejecutando}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {ejecutando ? 'Verificando...' : 'Ejecutar Verificación'}
        </button>
      </div>

      {resultado && (
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Resultado:</h3>
          <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
            {resultado}
          </pre>
        </div>
      )}
    </div>
  );
}
