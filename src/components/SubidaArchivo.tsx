'use client';

import React, { useRef, useState } from 'react';
import { fileToBase64, isValidImageFile } from '@/utils/fileUtils';

interface SubidaArchivoProps {
  onFileSelect: (base64Data: string, fileName: string) => void;
  onFilesSelect?: (files: { base64Data: string; fileName: string }[]) => void;
  currentFile?: string;
  currentFileName?: string;
  label?: string;
  accept?: string;
  disabled?: boolean;
  multiple?: boolean;
}

const SubidaArchivo: React.FC<SubidaArchivoProps> = ({
  onFileSelect,
  onFilesSelect,
  currentFile,
  currentFileName,
  label = 'Subir archivo',
  accept = 'image/*',
  disabled = false,
  multiple = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validar archivos
    const validFiles = files.filter((f) => isValidImageFile(f));
    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsLoading(true);
    try {
      const results: { base64Data: string; fileName: string }[] = [];
      for (const file of validFiles) {
        const base64Data = await fileToBase64(file);
        results.push({ base64Data, fileName: file.name });
      }

      // Para compatibilidad, llamar onFileSelect con el primero
      if (results[0]) onFileSelect(results[0].base64Data, results[0].fileName);
      // Si el consumidor quiere múltiples, entregar todos
      if (onFilesSelect) onFilesSelect(results);
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      alert('Error al procesar el/los archivo/s');
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    onFileSelect('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isLoading}
          multiple={multiple}
        />
        
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled || isLoading}
          className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors ${
            disabled || isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </span>
          ) : (
            <>
              📎 {currentFile ? 'Cambiar archivo' : 'Seleccionar archivo'}
            </>
          )}
        </button>

        {currentFile && (
          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={disabled || isLoading}
            className="px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            🗑️ Quitar
          </button>
        )}
      </div>

      {currentFileName && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Archivo seleccionado:
          </span>
          <span className="font-medium">{currentFileName}</span>
        </div>
      )}

      {currentFile && (
        <div className="mt-2">
          <img
            src={currentFile}
            alt="Vista previa del DNI"
            className="max-w-xs max-h-32 object-contain border border-gray-300 rounded-md shadow-sm"
          />
        </div>
      )}

      <p className="text-xs text-gray-500">
        Formatos soportados: JPEG, PNG, GIF, WebP. Tamaño máximo: 5MB
      </p>
    </div>
  );
};

export default SubidaArchivo;
