'use client';

import { useState } from 'react';

export default function LoginDebugger() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testDirectAPI = async () => {
    addResult('🧪 Iniciando test directo de API...');
    
    try {
      // Test 1: Verificar que la API responde
      addResult('📡 Probando endpoint /api/auth/providers...');
      const providersResponse = await fetch('/api/auth/providers');
      addResult(`✅ Providers status: ${providersResponse.status}`);
      
      // Test 2: Obtener CSRF token
      addResult('🔐 Obteniendo CSRF token...');
      const csrfResponse = await fetch('/api/auth/csrf');
      const csrfData = await csrfResponse.json();
      addResult(`✅ CSRF obtenido: ${csrfData.csrfToken ? 'Sí' : 'No'}`);
      
      // Test 3: Probar autenticación directa
      addResult('🔑 Probando autenticación directa...');
      const authResponse = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: 'admin@cooperativa.com',
          password: '123456',
          csrfToken: csrfData.csrfToken,
          callbackUrl: '/',
          json: 'true'
        })
      });
      
      addResult(`📊 Auth response status: ${authResponse.status}`);
      const authText = await authResponse.text();
      addResult(`📝 Auth response: ${authText.substring(0, 200)}...`);
      
    } catch (error) {
      addResult(`❌ Error en test: ${error}`);
    }
  };

  const testCredentials = () => {
    addResult('🔍 Verificando credenciales predeterminadas...');
    addResult('📧 Email: admin@cooperativa.com');
    addResult('🔑 Password: 123456');
    addResult('👤 Rol esperado: admin');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <h3 className="font-bold text-yellow-800 mb-3">🔧 Debugger de Login</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testCredentials}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          📋 Verificar Credenciales
        </button>
        
        <button
          onClick={testDirectAPI}
          className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
        >
          🧪 Test API Directo
        </button>
        
        <button
          onClick={clearResults}
          className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          🧹 Limpiar Resultados
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="bg-white border rounded p-3">
          <h4 className="font-semibold text-gray-700 mb-2">📊 Resultados:</h4>
          <div className="space-y-1 text-xs font-mono max-h-60 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-gray-600">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <h4 className="font-semibold text-blue-800 mb-2">📝 Instrucciones de Debug:</h4>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Abre las herramientas de desarrollador (F12)</li>
          <li>Ve a la pestaña "Console"</li>
          <li>Haz clic en "Test API Directo"</li>
          <li>Intenta hacer login normalmente</li>
          <li>Revisa los logs en la consola</li>
        </ol>
      </div>
    </div>
  );
}
