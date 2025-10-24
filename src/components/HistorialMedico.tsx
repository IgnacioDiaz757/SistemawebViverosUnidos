'use client';

import React, { useState, useCallback } from 'react';
import { HistorialMedico, historialMedicoDefault, Cirugia, Medicamento } from '@/types/medico';
import { generarIdUnico } from '@/utils/uuid';

interface HistorialMedicoProps {
  historialMedico: HistorialMedico;
  onChange: (updater: HistorialMedico | ((prev: HistorialMedico) => HistorialMedico)) => void;
  readonly?: boolean;
  showHabitos?: boolean;
}

const HistorialMedicoComponent: React.FC<HistorialMedicoProps> = React.memo(({
  historialMedico,
  onChange,
  readonly = false,
  showHabitos = true
}) => {
  const [activeTab, setActiveTab] = useState<string>('enfermedades');

  const updateHistorial = useCallback((updates: Partial<HistorialMedico>) => {
    onChange((prev: HistorialMedico) => ({
      ...prev,
      ...updates
    }));
  }, [onChange]);

  const updateHistorialWithDate = useCallback((updates: Partial<HistorialMedico>) => {
    onChange((prev: HistorialMedico) => ({
      ...prev,
      ...updates,
      fechaActualizacion: new Date().toISOString()
    }));
  }, [onChange]);

  const updateSection = useCallback((section: keyof HistorialMedico, updates: any) => {
    onChange((prev: HistorialMedico) => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        ...updates
      } as any
    }));
  }, [onChange]);

  const addCirugia = () => {
    const nuevaCirugia: Cirugia = {
      id: generarIdUnico(),
      tipo: '',
      fecha: '',
      hospital: '',
      observaciones: ''
    };
    updateHistorial({
      cirugias: [...(historialMedico.cirugias || []), nuevaCirugia]
    });
  };

  const updateCirugia = (id: string, updates: Partial<Cirugia>) => {
    const cirugias = (historialMedico.cirugias || []).map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    updateHistorial({ cirugias });
  };

  const removeCirugia = (id: string) => {
    const cirugias = (historialMedico.cirugias || []).filter(c => c.id !== id);
    updateHistorial({ cirugias });
  };

  const addMedicamento = () => {
    const nuevoMedicamento: Medicamento = {
      id: generarIdUnico(),
      nombre: '',
      dosis: '',
      frecuencia: '',
      fechaInicio: '',
      fechaFin: '',
      indicacion: ''
    };
    updateHistorial({
      medicamentos: [...(historialMedico.medicamentos || []), nuevoMedicamento]
    });
  };

  const updateMedicamento = (id: string, updates: Partial<Medicamento>) => {
    const medicamentos = (historialMedico.medicamentos || []).map(m => 
      m.id === id ? { ...m, ...updates } : m
    );
    updateHistorial({ medicamentos });
  };

  const removeMedicamento = (id: string) => {
    const medicamentos = (historialMedico.medicamentos || []).filter(m => m.id !== id);
    updateHistorial({ medicamentos });
  };

  const CheckboxField = ({ 
    label, 
    checked, 
    onChange, 
    disabled = readonly 
  }: { 
    label: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  const TextAreaField = ({ 
    label, 
    value, 
    onChange, 
    placeholder,
    disabled = readonly 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50"
      />
    </div>
  );

  const tabs = [
    { id: 'enfermedades', label: '🩺 Enfermedades' },
    { id: 'cirugias', label: '🏥 Cirugías' },
    { id: 'medicamentos', label: '💊 Medicamentos' },
    ...(showHabitos ? [{ id: 'habitos', label: '🏃 Hábitos' }] : [])
  ];

  const enfermedadesCheckList: Array<{ label: string; section: keyof HistorialMedico; key: string }> = [
    // Respiratorias
    { label: 'Tos', section: 'respiratorias', key: 'tos' },
    { label: 'Tuberculosis', section: 'respiratorias', key: 'tuberculosis' },
    { label: 'Falta de aire', section: 'respiratorias', key: 'faltaDeAire' },
    { label: 'Escupir sangre', section: 'respiratorias', key: 'escupirSangre' },
    { label: 'Asma', section: 'respiratorias', key: 'asma' },
    { label: 'Alergia', section: 'respiratorias', key: 'alergia' },
    // Cardiovasculares
    { label: 'Palpitaciones', section: 'cardiovasculares', key: 'palpitaciones' },
    { label: 'Dolor de pecho', section: 'cardiovasculares', key: 'dolorDePecho' },
    { label: 'Hipertensión', section: 'cardiovasculares', key: 'hipertension' },
    { label: 'Chagas', section: 'cardiovasculares', key: 'chagas' },
    { label: 'Enfermedades cardiovasculares', section: 'cardiovasculares', key: 'cardiovasculares' },
    // Digestivas
    { label: 'Úlcera gastroduodenal', section: 'digestivas', key: 'ulceraGastroduodenal' },
    { label: 'Diarreas', section: 'digestivas', key: 'diarreas' },
    { label: 'Reflujo', section: 'digestivas', key: 'reflujo' },
    { label: 'Acidez', section: 'digestivas', key: 'acidez' },
    { label: 'Parasitosis', section: 'digestivas', key: 'parasitosis' },
    { label: 'Antecedentes de hepatitis', section: 'digestivas', key: 'antecedenteHepatitis' },
    // Urinarias
    { label: 'Cólicos renales', section: 'urinarias', key: 'colicosRenales' },
    { label: 'Infecciones urinarias', section: 'urinarias', key: 'infeccionesUrinarias' },
    { label: 'Sangre en la orina', section: 'urinarias', key: 'sangreEnOrina' },
    // Neurológicas
    { label: 'Dolor de cabeza', section: 'neurologicas', key: 'dolorDeCabeza' },
    { label: 'Convulsiones', section: 'neurologicas', key: 'convulsiones' },
    { label: 'Temblores', section: 'neurologicas', key: 'temblores' },
    { label: 'Alteraciones del sueño', section: 'neurologicas', key: 'alteracionesSueño' },
    { label: 'Pérdida de conocimiento', section: 'neurologicas', key: 'perdidaConocimiento' },
    { label: 'Depresión', section: 'neurologicas', key: 'depresion' },
    // Óseas
    { label: 'Dolores óseos', section: 'oseas', key: 'doloresOseos' },
    { label: 'Fracturas', section: 'oseas', key: 'fracturas' },
    { label: 'Lumbalgias', section: 'oseas', key: 'lumbalgias' },
    { label: 'Hernias', section: 'oseas', key: 'hernias' },
    // Endocrinas
    { label: 'Diabetes', section: 'endocrinas', key: 'diabetes' },
    { label: 'Hipertiroidismo', section: 'endocrinas', key: 'hipertiroidismo' },
    { label: 'Hipotiroidismo', section: 'endocrinas', key: 'hipotiroidismo' },
    // Infecciosas
    { label: 'Dengue', section: 'infecciosas', key: 'dengue' },
    { label: 'COVID-19', section: 'infecciosas', key: 'covid19' },
    // Reumáticas
    { label: 'Reumas', section: 'reumaticas', key: 'reumas' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto px-6 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'enfermedades' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enfermedades</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enfermedadesCheckList.map((item) => (
                <CheckboxField
                  key={`${item.section}-${item.key}`}
                  label={item.label}
                  checked={((historialMedico as any)[item.section][item.key] as boolean) || false}
                  onChange={(checked) => updateSection(item.section, { [item.key]: checked })}
                />
              ))}
            </div>
            <div className="space-y-4">
              <TextAreaField
                label="Otras enfermedades (general)"
                value={historialMedico.otrasEnfermedades}
                onChange={(value) => updateSection('otrasEnfermedades', value)}
                placeholder="Especifique cualquier otra enfermedad no mencionada..."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextAreaField
                  label="Respiratorias - otras"
                  value={historialMedico.respiratorias.otras}
                  onChange={(value) => updateSection('respiratorias', { otras: value })}
                />
                <TextAreaField
                  label="Cardiovasculares - otras"
                  value={historialMedico.cardiovasculares.otras}
                  onChange={(value) => updateSection('cardiovasculares', { otras: value })}
                />
                <TextAreaField
                  label="Digestivas - otras"
                  value={historialMedico.digestivas.otras}
                  onChange={(value) => updateSection('digestivas', { otras: value })}
                />
                <TextAreaField
                  label="Urinarias - otras"
                  value={historialMedico.urinarias.otras}
                  onChange={(value) => updateSection('urinarias', { otras: value })}
                />
                <TextAreaField
                  label="Neurológicas - otras"
                  value={historialMedico.neurologicas.otras}
                  onChange={(value) => updateSection('neurologicas', { otras: value })}
                />
                <TextAreaField
                  label="Óseas - otras"
                  value={historialMedico.oseas.otras}
                  onChange={(value) => updateSection('oseas', { otras: value })}
                />
                <TextAreaField
                  label="Endocrinas - otras"
                  value={historialMedico.endocrinas.otras}
                  onChange={(value) => updateSection('endocrinas', { otras: value })}
                />
                <TextAreaField
                  label="Infecciosas - otras"
                  value={historialMedico.infecciosas.otras}
                  onChange={(value) => updateSection('infecciosas', { otras: value })}
                />
                <TextAreaField
                  label="Reumáticas - otras"
                  value={historialMedico.reumaticas.otras}
                  onChange={(value) => updateSection('reumaticas', { otras: value })}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cirugias' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Cirugías</h3>
              {!readonly && (
                <button
                  onClick={addCirugia}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  + Agregar Cirugía
                </button>
              )}
            </div>
            
            {(historialMedico.cirugias || []).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay cirugías registradas</p>
            ) : (
              <div className="space-y-4">
                {(historialMedico.cirugias || []).map((cirugia) => (
                  <div key={cirugia.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cirugía</label>
                        <input
                          type="text"
                          value={cirugia.tipo}
                          onChange={(e) => updateCirugia(cirugia.id, { tipo: e.target.value })}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={cirugia.fecha}
                          onChange={(e) => updateCirugia(cirugia.id, { fecha: e.target.value })}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                        <input
                          type="text"
                          value={cirugia.hospital || ''}
                          onChange={(e) => updateCirugia(cirugia.id, { hospital: e.target.value })}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div className="flex items-end">
                        {!readonly && (
                          <button
                            onClick={() => removeCirugia(cirugia.id)}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <textarea
                        value={cirugia.observaciones || ''}
                        onChange={(e) => updateCirugia(cirugia.id, { observaciones: e.target.value })}
                        disabled={readonly}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'medicamentos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Medicamentos</h3>
              {!readonly && (
                <button
                  onClick={addMedicamento}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  + Agregar Medicamento
                </button>
              )}
            </div>
            
            {(historialMedico.medicamentos || []).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay medicamentos registrados</p>
            ) : (
              <div className="space-y-4">
                {(historialMedico.medicamentos || []).map((medicamento) => (
                  <div key={medicamento.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={medicamento.nombre}
                          onChange={(e) => updateMedicamento(medicamento.id, { nombre: e.target.value })}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
                        <input
                          type="text"
                          value={medicamento.dosis}
                          onChange={(e) => updateMedicamento(medicamento.id, { dosis: e.target.value })}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                        <input
                          type="text"
                          value={medicamento.frecuencia}
                          onChange={(e) => updateMedicamento(medicamento.id, { frecuencia: e.target.value })}
                          disabled={readonly}
                          placeholder="Ej: 1 vez al día"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                        <input
                          type="date"
                          value={medicamento.fechaInicio}
                          onChange={(e) => updateMedicamento(medicamento.id, { fechaInicio: e.target.value })}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                        <input
                          type="date"
                          value={medicamento.fechaFin || ''}
                          onChange={(e) => updateMedicamento(medicamento.id, { fechaFin: e.target.value })}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div className="flex items-end">
                        {!readonly && (
                          <button
                            onClick={() => removeMedicamento(medicamento.id)}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Indicación</label>
                      <textarea
                        value={medicamento.indicacion}
                        onChange={(e) => updateMedicamento(medicamento.id, { indicacion: e.target.value })}
                        disabled={readonly}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showHabitos && activeTab === 'habitos' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Hábitos y Estilo de Vida</h3>
            
            {/* Actividad Física */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Actividad Física</h4>
              <div className="space-y-4">
                <CheckboxField
                  label="Practica actividad física"
                  checked={historialMedico.actividadFisica.practica}
                  onChange={(checked) => updateSection('actividadFisica', { practica: checked })}
                />
                
                {historialMedico.actividadFisica.practica && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <input
                        type="text"
                        value={historialMedico.actividadFisica.tipo}
                        onChange={(e) => updateSection('actividadFisica', { tipo: e.target.value })}
                        disabled={readonly}
                        placeholder="Ej: Caminar, correr, fútbol..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                      <input
                        type="text"
                        value={historialMedico.actividadFisica.frecuencia}
                        onChange={(e) => updateSection('actividadFisica', { frecuencia: e.target.value })}
                        disabled={readonly}
                        placeholder="Ej: 3 veces por semana"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Intensidad</label>
                      <select
                        value={historialMedico.actividadFisica.intensidad}
                        onChange={(e) => updateSection('actividadFisica', { intensidad: e.target.value as 'baja' | 'moderada' | 'alta' })}
                        disabled={readonly}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="baja">Baja</option>
                        <option value="moderada">Moderada</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>
                  </div>
                )}
                
                <TextAreaField
                  label="Observaciones sobre actividad física"
                  value={historialMedico.actividadFisica.observaciones}
                  onChange={(value) => updateSection('actividadFisica', { observaciones: value })}
                />
              </div>
            </div>

            {/* Otros Hábitos */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Otros Hábitos</h4>
              <div className="space-y-4">
                {/* Tabaco */}
                <div>
                  <CheckboxField
                    label="Consume tabaco"
                    checked={historialMedico.otrosHabitos.tabaco.consume}
                    onChange={(checked) => updateSection('otrosHabitos', { 
                      tabaco: { ...historialMedico.otrosHabitos.tabaco, consume: checked }
                    })}
                  />
                  {historialMedico.otrosHabitos.tabaco.consume && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                        <input
                          type="text"
                          value={historialMedico.otrosHabitos.tabaco.cantidad || ''}
                          onChange={(e) => updateSection('otrosHabitos', { 
                            tabaco: { ...historialMedico.otrosHabitos.tabaco, cantidad: e.target.value }
                          })}
                          disabled={readonly}
                          placeholder="Ej: 10 cigarrillos/día"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de consumo</label>
                        <input
                          type="text"
                          value={historialMedico.otrosHabitos.tabaco.tiempoConsumo || ''}
                          onChange={(e) => updateSection('otrosHabitos', { 
                            tabaco: { ...historialMedico.otrosHabitos.tabaco, tiempoConsumo: e.target.value }
                          })}
                          disabled={readonly}
                          placeholder="Ej: 5 años"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Alcohol */}
                <div>
                  <CheckboxField
                    label="Consume alcohol"
                    checked={historialMedico.otrosHabitos.alcohol.consume}
                    onChange={(checked) => updateSection('otrosHabitos', { 
                      alcohol: { ...historialMedico.otrosHabitos.alcohol, consume: checked }
                    })}
                  />
                  {historialMedico.otrosHabitos.alcohol.consume && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                        <input
                          type="text"
                          value={historialMedico.otrosHabitos.alcohol.frecuencia || ''}
                          onChange={(e) => updateSection('otrosHabitos', { 
                            alcohol: { ...historialMedico.otrosHabitos.alcohol, frecuencia: e.target.value }
                          })}
                          disabled={readonly}
                          placeholder="Ej: Fines de semana"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <input
                          type="text"
                          value={historialMedico.otrosHabitos.alcohol.tipo || ''}
                          onChange={(e) => updateSection('otrosHabitos', { 
                            alcohol: { ...historialMedico.otrosHabitos.alcohol, tipo: e.target.value }
                          })}
                          disabled={readonly}
                          placeholder="Ej: Cerveza, vino"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Drogas */}
                <div>
                  <CheckboxField
                    label="Consume drogas"
                    checked={historialMedico.otrosHabitos.drogas.consume}
                    onChange={(checked) => updateSection('otrosHabitos', { 
                      drogas: { ...historialMedico.otrosHabitos.drogas, consume: checked }
                    })}
                  />
                  {historialMedico.otrosHabitos.drogas.consume && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <input
                          type="text"
                          value={historialMedico.otrosHabitos.drogas.tipo || ''}
                          onChange={(e) => updateSection('otrosHabitos', { 
                            drogas: { ...historialMedico.otrosHabitos.drogas, tipo: e.target.value }
                          })}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                        <input
                          type="text"
                          value={historialMedico.otrosHabitos.drogas.observaciones || ''}
                          onChange={(e) => updateSection('otrosHabitos', { 
                            drogas: { ...historialMedico.otrosHabitos.drogas, observaciones: e.target.value }
                          })}
                          disabled={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <TextAreaField
                  label="Otros hábitos"
                  value={historialMedico.otrosHabitos.otros}
                  onChange={(value) => updateSection('otrosHabitos', { otros: value })}
                  placeholder="Especifique otros hábitos relevantes..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default HistorialMedicoComponent;
