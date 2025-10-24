'use client';

import React from 'react';
import { HistorialMedico } from '@/types/medico';

interface ResumenMedicoProps {
  historialMedico?: HistorialMedico;
  className?: string;
}

const ResumenMedico: React.FC<ResumenMedicoProps> = ({ historialMedico, className = '' }) => {
  if (!historialMedico) {
    return (
      <div className={`text-gray-400 text-xs ${className}`}>
        Sin historial médico
      </div>
    );
  }

  // Contar enfermedades activas
  const enfermedadesActivas = [];
  
  // Respiratorias
  if (historialMedico.respiratorias.tos) enfermedadesActivas.push('Tos');
  if (historialMedico.respiratorias.tuberculosis) enfermedadesActivas.push('Tuberculosis');
  if (historialMedico.respiratorias.asma) enfermedadesActivas.push('Asma');
  if (historialMedico.respiratorias.faltaDeAire) enfermedadesActivas.push('Falta de aire');
  
  // Cardiovasculares
  if (historialMedico.cardiovasculares.hipertension) enfermedadesActivas.push('Hipertensión');
  if (historialMedico.cardiovasculares.chagas) enfermedadesActivas.push('Chagas');
  if (historialMedico.cardiovasculares.palpitaciones) enfermedadesActivas.push('Palpitaciones');
  
  // Endocrinas
  if (historialMedico.endocrinas.diabetes) enfermedadesActivas.push('Diabetes');
  if (historialMedico.endocrinas.hipertiroidismo) enfermedadesActivas.push('Hipertiroidismo');
  if (historialMedico.endocrinas.hipotiroidismo) enfermedadesActivas.push('Hipotiroidismo');
  
  // Neurológicas
  if (historialMedico.neurologicas.depresion) enfermedadesActivas.push('Depresión');
  if (historialMedico.neurologicas.convulsiones) enfermedadesActivas.push('Convulsiones');
  
  // Infecciosas
  if (historialMedico.infecciosas.covid19) enfermedadesActivas.push('COVID-19');
  if (historialMedico.infecciosas.dengue) enfermedadesActivas.push('Dengue');

  const totalEnfermedades = enfermedadesActivas.length;
  const totalMedicamentos = historialMedico.medicamentos.length;
  const totalCirugias = historialMedico.cirugias.length;
  
  // Determinar el color del indicador según la cantidad de enfermedades
  const getColorIndicador = () => {
    if (totalEnfermedades === 0) return 'text-green-600 bg-green-100';
    if (totalEnfermedades <= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getIcono = () => {
    if (totalEnfermedades === 0) return '✅';
    if (totalEnfermedades <= 2) return '⚠️';
    return '🚨';
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColorIndicador()}`}>
        <span className="mr-1">{getIcono()}</span>
        {totalEnfermedades === 0 ? 'Sin enfermedades' : `${totalEnfermedades} enfermedad${totalEnfermedades > 1 ? 'es' : ''}`}
      </div>
      
      {(totalMedicamentos > 0 || totalCirugias > 0) && (
        <div className="flex space-x-2 text-xs text-gray-600">
          {totalMedicamentos > 0 && (
            <span className="inline-flex items-center">
              💊 {totalMedicamentos} med{totalMedicamentos > 1 ? 's' : ''}
            </span>
          )}
          {totalCirugias > 0 && (
            <span className="inline-flex items-center">
              🏥 {totalCirugias} cir{totalCirugias > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
      
      {totalEnfermedades > 0 && totalEnfermedades <= 3 && (
        <div className="text-xs text-gray-500">
          {enfermedadesActivas.slice(0, 3).join(', ')}
          {totalEnfermedades > 3 && ` +${totalEnfermedades - 3} más`}
        </div>
      )}
      
      {totalEnfermedades > 3 && (
        <div className="text-xs text-gray-500">
          {enfermedadesActivas.slice(0, 2).join(', ')} +{totalEnfermedades - 2} más
        </div>
      )}
    </div>
  );
};

export default ResumenMedico;
