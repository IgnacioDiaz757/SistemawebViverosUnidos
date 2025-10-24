'use client';

import React, { useState, useEffect } from 'react';
import { errorLogger, ErrorLog } from '@/services/errorLogger';

interface ErrorMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

const ErrorMonitor: React.FC<ErrorMonitorProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshLogs = () => {
    const newLogs = errorLogger.getLogs(filter === 'all' ? undefined : filter, 100);
    setLogs(newLogs);
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen, filter]);

  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    const interval = setInterval(refreshLogs, 2000); // Actualizar cada 2 segundos
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, filter]);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES');
  };

  const exportLogs = () => {
    const data = errorLogger.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los logs?')) {
      errorLogger.clearLogs();
      refreshLogs();
    }
  };

  const stats = errorLogger.getErrorCount();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Monitor de Errores</h2>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Total: {stats.total}</span>
              <span className="text-red-600">Errores: {stats.errors}</span>
              <span className="text-yellow-600">Warnings: {stats.warnings}</span>
              <span className="text-blue-600">Info: {stats.info}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-4 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todos</option>
              <option value="error">Solo Errores</option>
              <option value="warning">Solo Warnings</option>
              <option value="info">Solo Info</option>
            </select>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-actualizar
            </label>

            <button
              onClick={refreshLogs}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Actualizar
            </button>

            <button
              onClick={exportLogs}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Exportar
            </button>

            <button
              onClick={clearLogs}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto p-4">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No hay logs disponibles
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${getLogColor(log.level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getLogIcon(log.level)}</span>
                      <div className="flex-1">
                        <div className="font-medium">{log.message}</div>
                        {log.context && Object.keys(log.context).length > 0 && (
                          <div className="mt-1 text-sm">
                            <details>
                              <summary className="cursor-pointer text-gray-600">
                                Contexto ({Object.keys(log.context).length} campos)
                              </summary>
                              <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                                {JSON.stringify(log.context, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                        {log.stack && (
                          <div className="mt-1 text-sm">
                            <details>
                              <summary className="cursor-pointer text-gray-600">
                                Stack Trace
                              </summary>
                              <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                                {log.stack}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 ml-4">
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </div>
                  {log.userId && (
                    <div className="text-xs text-gray-500 mt-1">
                      Usuario: {log.userId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMonitor;
