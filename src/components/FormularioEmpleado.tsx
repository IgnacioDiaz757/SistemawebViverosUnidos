'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Asociado, Empleado, ArchivoAdjunto } from '@/types/asociado';
import { historialMedicoDefault, HistorialMedico } from '@/types/medico';
import SubidaArchivo from './SubidaArchivo';
import HistorialMedicoComponent from './HistorialMedico';
import { generateDniFileName } from '@/utils/fileUtils';
import { supabaseAsociadosService } from '@/services/supabaseAsociadosService';
import { supabaseContratistasService } from '@/services/supabaseContratistasService';
import { validarAsociadoDuplicado } from '@/utils/validacionAsociados';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseStorageService } from '@/services/supabaseStorageService';

interface FormularioEmpleadoProps {
  onSuccess?: () => void;
}

const FormularioEmpleado: React.FC<FormularioEmpleadoProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [mostrarNuevoContratista, setMostrarNuevoContratista] = useState(false);
  const [nuevoContratista, setNuevoContratista] = useState('');
  const [activeTab, setActiveTab] = useState<'datos' | 'medico'>('datos');
  const [historialMedico, setHistorialMedico] = useState<HistorialMedico>(historialMedicoDefault);
  const [otroBeneficio, setOtroBeneficio] = useState('');
  const [contratistas, setContratistas] = useState<{ id: string; nombre: string }[]>([]);
  
  const [formData, setFormData] = useState<Omit<Empleado, 'id' | 'activo' | 'fecha_carga'> & { cuil?: string; dni?: string; fotos_dni_multiple?: { base64: string; nombre: string }[] }>({
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    estado_civil: '',
    beneficio_plan_social: '',
    cuil: '',
    dni: '',
    telefono: '',
    email: '',
    fecha_ingreso: '',
    domicilio: '',
    barrio: '',
    codigo_postal: '',
    ciudad: '',
    provincia: '',
    mano_habil: undefined,
    legajo: '',
    nro_socio: '',
    monotributo: false,
    contratista: '',
    contratista_id: '',
    foto_dni: '',
    nombre_archivo_dni: '',
    archivos_adjuntos: [],
    fotos_dni_multiple: []
  });

  // Fecha de carga actual (automática) - solo para mostrar como sugerencia
  const fechaCargaActual = new Date().toISOString().split('T')[0];

  const [errores, setErrores] = useState<Record<string, string>>({});

  // Función optimizada para actualizar el historial médico
  const handleHistorialMedicoChange = useCallback((updater: HistorialMedico | ((prev: HistorialMedico) => HistorialMedico)) => {
    if (typeof updater === 'function') {
      setHistorialMedico(updater);
    } else {
      setHistorialMedico(updater);
    }
  }, []);

  useEffect(() => {
    supabaseContratistasService
      .listar()
      .then(setContratistas)
      .catch(() => setContratistas([]));
  }, []);

  const validarFormulario = async () => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) nuevosErrores.apellido = 'El apellido es requerido';
    if (!formData.cuil.trim()) nuevosErrores.cuil = 'El CUIL es requerido';
    if (!formData.dni.trim()) nuevosErrores.dni = 'El DNI es requerido';
    if (!formData.telefono.trim()) nuevosErrores.telefono = 'El teléfono es requerido';
    if (!formData.domicilio.trim()) nuevosErrores.domicilio = 'El domicilio es requerido';
    if (!formData.fecha_ingreso.trim()) nuevosErrores.fecha_ingreso = 'La fecha de ingreso es requerida';
    if (!formData.contratista_id) nuevosErrores.contratista_id = 'El contratista es requerido';

    const cuilRegex = /^\d{2}-\d{8}-\d{1}$/;
    if (formData.cuil && !cuilRegex.test(formData.cuil)) {
      nuevosErrores.cuil = 'El CUIL debe tener el formato XX-XXXXXXXX-X';
    }

    const dniRegex = /^\d{7,8}$/;
    if (formData.dni && !dniRegex.test(formData.dni)) {
      nuevosErrores.dni = 'El DNI debe tener 7 u 8 dígitos';
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        nuevosErrores.email = 'El formato del email no es válido';
      }
    }

    if (Object.keys(nuevosErrores).length === 0) {
      try {
        const cuilVal = await supabaseAsociadosService.validarCuilUnico(formData.cuil || '');
        if (!cuilVal.esValido) nuevosErrores.cuil = cuilVal.mensaje || 'CUIL inválido';
      } catch {}
      try {
        const dniVal = await supabaseAsociadosService.validarDniUnico(formData.dni || '');
        if (!dniVal.esValido) nuevosErrores.dni = dniVal.mensaje || 'DNI inválido';
      } catch {}
      // Solo validar legajo si no está vacío
      if (formData.legajo && formData.legajo.trim()) {
        try {
          const legajoVal = await supabaseAsociadosService.validarLegajoUnico(formData.legajo);
          if (!legajoVal.esValido) nuevosErrores.legajo = legajoVal.mensaje || 'Legajo inválido';
        } catch {}
      }
      // Solo validar nro_socio si no está vacío
      if (formData.nro_socio && formData.nro_socio.trim()) {
        try {
          const nro_socioVal = await supabaseAsociadosService.validarNroSocioUnico(formData.nro_socio);
          if (!nro_socioVal.esValido) nuevosErrores.nro_socio = nro_socioVal.mensaje || 'Número de socio inválido';
        } catch {}
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ok = await validarFormulario();
    if (!ok) return;

    try {
      const creadoPorId = user?.id || null;

      const asociadoInsert: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        cuil: formData.cuil,
        dni: formData.dni,
        telefono: formData.telefono,
        fecha_ingreso: formData.fecha_ingreso,
        domicilio: formData.domicilio,
        // Campos adicionales para mantener forma de datos
        fecha_nacimiento: formData.fecha_nacimiento || null,
        estado_civil: formData.estado_civil || null,
        email: formData.email || null,
        barrio: formData.barrio || null,
        codigo_postal: formData.codigo_postal || null,
        ciudad: formData.ciudad || null,
        provincia: formData.provincia || null,
        mano_habil: formData.mano_habil || null,
        legajo: formData.legajo?.trim() || null,
        nro_socio: formData.nro_socio?.trim() || null,
        monotributo: formData.monotributo,
        foto_dni: formData.foto_dni || null,
        nombre_archivo_dni: formData.nombre_archivo_dni || null,
        contratista_id: formData.contratista_id || null,
        creado_por_id: creadoPorId,
        beneficio_plan_social:
          formData.beneficio_plan_social === 'otro'
            ? (otroBeneficio || 'otro')
            : formData.beneficio_plan_social || null,
        // Historial médico completo (guardar en ambos formatos para compatibilidad)
        historial_medico: historialMedico,
        historialMedico: historialMedico,
      };

      if (formData.fotos_dni_multiple && formData.fotos_dni_multiple.length > 0) {
        const adj = mapFotosDniToAdjuntos(formData.fotos_dni_multiple);
        asociadoInsert.archivos_adjuntos = [
          ...(asociadoInsert.archivos_adjuntos || []),
          ...adj,
        ];
      }

      // Subir foto DNI a Storage si aplica
      if (isSupabaseConfigured && formData.foto_dni) {
        try {
          const tempId = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;
          const carpeta = `asociados/temp-${tempId}/dni`;
          const up = await supabaseStorageService.subirBase64(
            carpeta,
            formData.foto_dni,
            formData.nombre_archivo_dni ||
              generateDniFileName(
                formData.dni || '',
                formData.nombre,
                formData.apellido,
                formData.nombre_archivo_dni || 'dni.jpg'
              )
          );
          asociadoInsert.foto_dni = up.publicUrl || null;
          asociadoInsert.nombre_archivo_dni = formData.nombre_archivo_dni || 'dni.jpg';
        } catch (e) {
          console.warn('No se pudo subir foto DNI, continúo sin URL pública');
        }
      }

      // Subir adjuntos múltiples si existen
      if (isSupabaseConfigured && formData.fotos_dni_multiple && formData.fotos_dni_multiple.length > 0) {
        const adjuntos: any[] = [];
        for (const f of formData.fotos_dni_multiple) {
          try {
            const tempId = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;
            const carpeta = `asociados/temp-${tempId}`;
            const up = await supabaseStorageService.subirBase64(carpeta, f.base64, f.nombre);
            adjuntos.push({ id: up.path, nombre: f.nombre, url: up.publicUrl, path: up.path, categoria: 'identificacion', fecha_subida: new Date().toISOString() });
          } catch (_) {}
        }
        if (adjuntos.length > 0) {
          asociadoInsert.archivos_adjuntos = [...(asociadoInsert.archivos_adjuntos || []), ...adjuntos];
        }
      }

      await supabaseAsociadosService.crearAsociado(asociadoInsert);

      setFormData({
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        estado_civil: '',
        beneficio_plan_social: '',
        cuil: '',
        dni: '',
        telefono: '',
        email: '',
        fecha_ingreso: '',
        domicilio: '',
        barrio: '',
        codigo_postal: '',
        ciudad: '',
        provincia: '',
        mano_habil: undefined,
        legajo: '',
        nro_socio: '',
        monotributo: false,
        contratista: '',
        contratista_id: '',
        foto_dni: '',
        nombre_archivo_dni: '',
        archivos_adjuntos: [],
        fotos_dni_multiple: []
      });
      setHistorialMedico(historialMedicoDefault);
      setOtroBeneficio('');
      setErrores({});

      if (onSuccess) onSuccess();
      alert('Asociado registrado exitosamente');
    } catch (error: any) {
      alert(error?.message || 'Error al registrar asociado');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAgregarContratista = async () => {
    const nombre = nuevoContratista.trim();
    if (!nombre) return;
    try {
      const creado = await supabaseContratistasService.crear(nombre);
      setContratistas(prev => [...prev, creado].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      // Asignar el ID real del contratista recién creado
      setFormData(prev => ({ ...prev, contratista_id: creado.id }));
      setNuevoContratista('');
      setMostrarNuevoContratista(false);
      try { window.dispatchEvent(new CustomEvent('contratistasUpdated')); } catch {}
    } catch (e: any) {
      alert(e?.message || 'Error al crear contratista');
    }
  };

  const handleFileSelect = (base64Data: string, fileName: string) => {
    let finalFileName = fileName;
    
    // Generar nombre único si se seleccionó un archivo
    if (base64Data && fileName && formData.dni && formData.nombre && formData.apellido) {
      finalFileName = generateDniFileName(formData.dni, formData.nombre, formData.apellido, fileName);
    }
    
    setFormData(prev => ({
      ...prev,
      foto_dni: base64Data,
      nombre_archivo_dni: finalFileName
    }));
  };

  const handleFilesSelectMultiple = (files: { base64Data: string; fileName: string }[]) => {
    if (!files || files.length === 0) return;
    const mapped = files.map(({ base64Data, fileName }) => {
      const nombre = (formData.dni && formData.nombre && formData.apellido)
        ? generateDniFileName(formData.dni, formData.nombre, formData.apellido, fileName)
        : fileName;
      return { base64: base64Data, nombre };
    });
    const first = mapped[0];
    setFormData(prev => ({
      ...prev,
      foto_dni: first?.base64 || prev.foto_dni,
      nombre_archivo_dni: first?.nombre || prev.nombre_archivo_dni,
      fotos_dni_multiple: mapped
    }));
  };

  const mapFotosDniToAdjuntos = (fotos: { base64: string; nombre: string }[]): ArchivoAdjunto[] => {
    const hoy = new Date().toISOString();
    return fotos.map((f) => ({
      id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string,
      nombre: f.nombre,
      tipo: 'image',
      tamano: f.base64.length,
      contenido: f.base64,
      fecha_subida: hoy,
      categoria: 'identificacion',
      subido_por: user?.email || 'sistema'
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Registrar Nuevo Asociado</h2>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('datos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'datos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 Datos Personales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('medico')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'medico'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏥 Historial Médico
          </button>
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      {activeTab === 'datos' && (
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre (mostrar como Apellido) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.nombre ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ingrese el apellido"
            />
            {errores.nombre && <p className="text-red-500 text-sm mt-1">{errores.nombre}</p>}
          </div>

          {/* Apellido (mostrar como Nombre) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.apellido ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ingrese el nombre"
            />
            {errores.apellido && <p className="text-red-500 text-sm mt-1">{errores.apellido}</p>}
          </div>

          {/* Fecha de Nacimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errores.fecha_nacimiento && <p className="text-red-500 text-sm mt-1">{errores.fecha_nacimiento}</p>}
          </div>

          {/* Estado Civil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado Civil
            </label>
            <select
              name="estado_civil"
              value={formData.estado_civil}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.estado_civil ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar...</option>
              <option value="soltero">Soltero/a</option>
              <option value="casado">Casado/a</option>
              <option value="divorciado">Divorciado/a</option>
              <option value="viudo">Viudo/a</option>
              <option value="union_libre">Unión Libre</option>
              <option value="separado">Separado/a</option>
            </select>
            {errores.estado_civil && <p className="text-red-500 text-sm mt-1">{errores.estado_civil}</p>}
          </div>

          {/* Beneficio o Plan Social */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beneficio o Plan Social
            </label>
            <select
              name="beneficio_plan_social"
              value={formData.beneficio_plan_social}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar beneficio o plan social</option>
              <option value="ninguno">Ninguno</option>
              <option value="asignacion_universal_hijo">Asignación Universal por Hijo (AUH)</option>
              <option value="asignacion_universal_embarazo">Asignación Universal por Embarazo (AUE)</option>
              <option value="jubilacion_pension">Jubilación/Pensión</option>
              <option value="pension_no_contributiva">Pensión No Contributiva</option>
              <option value="plan_progresar">Plan Progresar</option>
              <option value="plan_argentina_trabaja">Plan Argentina Trabaja</option>
              <option value="plan_manos_a_la_obra">Plan Manos a la Obra</option>
              <option value="plan_ellos_hacen">Plan Ellos Hacen</option>
              <option value="plan_ingreso_social_trabajo">Plan de Ingreso Social con Trabajo</option>
              <option value="plan_social_de_empleo">Plan Social de Empleo</option>
              <option value="programa_hacemos_futuro">Programa Hacemos Futuro</option>
              <option value="programa_potenciar_trabajo">Programa Potenciar Trabajo</option>
              <option value="otro">Otro</option>
            </select>
            
            {/* Campo de texto para "Otro" */}
            {formData.beneficio_plan_social === 'otro' && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especificar beneficio o plan social
                </label>
                <input
                  type="text"
                  value={otroBeneficio}
                  onChange={(e) => setOtroBeneficio(e.target.value)}
                  placeholder="Escriba el beneficio o plan social específico"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* CUIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CUIL *
            </label>
            <input
              type="text"
              name="cuil"
              value={formData.cuil}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.cuil ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="XX-XXXXXXXX-X"
            />
            {errores.cuil && (
              <p className={`error-message ${errores.cuil.includes('ya está registrado') ? 'duplicate' : ''}`}>
                {errores.cuil}
              </p>
            )}
          </div>

          {/* DNI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DNI *
            </label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.dni ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="12345678"
            />
            {errores.dni && (
              <p className={`error-message ${errores.dni.includes('ya está registrado') ? 'duplicate' : ''}`}>
                {errores.dni}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.telefono ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="11-1234-5678"
            />
            {errores.telefono && <p className="text-red-500 text-sm mt-1">{errores.telefono}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ejemplo@correo.com"
            />
            {errores.email && <p className="text-red-500 text-sm mt-1">{errores.email}</p>}
          </div>

          {/* Fecha de Ingreso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Ingreso *
            </label>
            <input
              type="date"
              name="fecha_ingreso"
              value={formData.fecha_ingreso || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.fecha_ingreso ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, fecha_ingreso: fechaCargaActual }))}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Usar fecha actual ({fechaCargaActual})
              </button>
            </div>
            {errores.fecha_ingreso && <p className="text-red-500 text-sm mt-1">{errores.fecha_ingreso}</p>}
          </div>

          {/* Legajo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Legajo
            </label>
            <input
              type="text"
              name="legajo"
              value={formData.legajo}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.legajo ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="LEG-001 (opcional)"
            />
            {errores.legajo && (
              <p className={`error-message ${errores.legajo.includes('ya está registrado') ? 'duplicate' : ''}`}>
                {errores.legajo}
              </p>
            )}
          </div>

          {/* Número de Socio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Socio
            </label>
            <input
              type="text"
              name="nro_socio"
              value={formData.nro_socio}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.nro_socio ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="SOC-001 (opcional)"
            />
            {errores.nro_socio && (
              <p className={`error-message ${errores.nro_socio.includes('ya está registrado') ? 'duplicate' : ''}`}>
                {errores.nro_socio}
              </p>
            )}
          </div>
        </div>

        {/* Domicilio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Domicilio *
          </label>
          <input
            type="text"
            name="domicilio"
            value={formData.domicilio}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errores.domicilio ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Calle y número"
          />
          {errores.domicilio && <p className="text-red-500 text-sm mt-1">{errores.domicilio}</p>}
        </div>

        {/* Barrio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Barrio
          </label>
          <input
            type="text"
            name="barrio"
            value={formData.barrio}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errores.barrio ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nombre del barrio"
          />
          {errores.barrio && <p className="text-red-500 text-sm mt-1">{errores.barrio}</p>}
        </div>

        {/* Código Postal y Ciudad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Código Postal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código Postal
            </label>
            <input
              type="text"
              name="codigo_postal"
              value={formData.codigo_postal}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.codigo_postal ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="1234"
            />
            {errores.codigo_postal && <p className="text-red-500 text-sm mt-1">{errores.codigo_postal}</p>}
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.ciudad ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nombre de la ciudad"
            />
            {errores.ciudad && <p className="text-red-500 text-sm mt-1">{errores.ciudad}</p>}
          </div>
        </div>

        {/* Provincia y Mano Hábil */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Provincia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provincia
            </label>
            <select
              name="provincia"
              value={formData.provincia}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.provincia ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar provincia...</option>
              <option value="Buenos Aires">Buenos Aires</option>
              <option value="Catamarca">Catamarca</option>
              <option value="Chaco">Chaco</option>
              <option value="Chubut">Chubut</option>
              <option value="Córdoba">Córdoba</option>
              <option value="Corrientes">Corrientes</option>
              <option value="Entre Ríos">Entre Ríos</option>
              <option value="Formosa">Formosa</option>
              <option value="Jujuy">Jujuy</option>
              <option value="La Pampa">La Pampa</option>
              <option value="La Rioja">La Rioja</option>
              <option value="Mendoza">Mendoza</option>
              <option value="Misiones">Misiones</option>
              <option value="Neuquén">Neuquén</option>
              <option value="Río Negro">Río Negro</option>
              <option value="Salta">Salta</option>
              <option value="San Juan">San Juan</option>
              <option value="San Luis">San Luis</option>
              <option value="Santa Cruz">Santa Cruz</option>
              <option value="Santa Fe">Santa Fe</option>
              <option value="Santiago del Estero">Santiago del Estero</option>
              <option value="Tierra del Fuego">Tierra del Fuego</option>
              <option value="Tucumán">Tucumán</option>
            </select>
            {errores.provincia && <p className="text-red-500 text-sm mt-1">{errores.provincia}</p>}
          </div>

          {/* Mano Hábil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mano Hábil
            </label>
            <select
              name="mano_habil"
              value={formData.mano_habil || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.mano_habil ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar...</option>
              <option value="derecha">Diestro (Mano derecha)</option>
              <option value="izquierda">Zurdo (Mano izquierda)</option>
              <option value="ambidiestro">Ambidiestro</option>
            </select>
            {errores.mano_habil && <p className="text-red-500 text-sm mt-1">{errores.mano_habil}</p>}
          </div>
        </div>

        {/* Contratista */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contratista *
          </label>
          <div className="flex gap-2">
            <select
              name="contratista_id"
              value={formData.contratista_id}
              onChange={handleInputChange}
              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errores.contratista_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccione un contratista</option>
              {contratistas.map(contratista => (
                <option key={contratista.id} value={contratista.id}>
                  {contratista.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setMostrarNuevoContratista(!mostrarNuevoContratista)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              +
            </button>
          </div>
          {errores.contratista && <p className="text-red-500 text-sm mt-1">{errores.contratista}</p>}
          
          {mostrarNuevoContratista && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={nuevoContratista}
                onChange={(e) => setNuevoContratista(e.target.value)}
                placeholder="Nombre del nuevo contratista"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAgregarContratista}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Agregar
              </button>
            </div>
          )}
        </div>

        {/* Monotributo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="monotributo"
            checked={formData.monotributo}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Monotributo
          </label>
        </div>

        {/* Foto del DNI (múltiples) */}
        <div>
          <SubidaArchivo
            onFileSelect={handleFileSelect}
            onFilesSelect={handleFilesSelectMultiple}
            currentFile={formData.foto_dni}
            currentFileName={formData.nombre_archivo_dni}
            label="Foto del DNI"
            accept="image/*"
            multiple
          />
          {formData.fotos_dni_multiple && formData.fotos_dni_multiple.length > 1 && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {formData.fotos_dni_multiple.map((f, idx) => (
                <div key={idx} className="border rounded p-1 bg-white">
                  <img src={f.base64} alt={`DNI ${idx + 1}`} className="w-full h-24 object-contain" />
                  <div className="text-[10px] text-gray-600 truncate" title={f.nombre}>{f.nombre}</div>
                </div>
              ))}
            </div>
          )}
        </div>

          {/* Botón Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Registrar Asociado
            </button>
          </div>
        </form>
      )}

      {activeTab === 'medico' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-blue-400 mr-3">ℹ️</div>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Completar Historial Médico</p>
                <p className="mt-1">
                  Aquí puedes registrar todas las enfermedades, medicamentos, cirugías y hábitos del nuevo asociado. 
                  Esta información será parte de su ficha médica completa.
                </p>
              </div>
            </div>
          </div>
          
          <HistorialMedicoComponent
            historialMedico={historialMedico}
            onChange={handleHistorialMedicoChange}
            showHabitos={false}
          />
          
          {/* Botones para la sección médica */}
          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setActiveTab('datos')}
              className="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              ← Volver a Datos Personales
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  // Guardar solo el historial médico por ahora
                  alert('Historial médico guardado. Continúa completando los datos personales.');
                }}
                className="px-4 py-2 text-white font-medium rounded-md focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: '#C70CB9',
                  '--tw-ring-color': '#C70CB9'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#A00A9A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#C70CB9';
                }}
              >
                Guardar Historial Médico
              </button>
              <button
                type="button"
                onClick={() => {
                  // Validar que al menos los datos básicos estén completos
                  if (!formData.nombre || !formData.apellido || !formData.dni || !formData.cuil) {
                    alert('Por favor completa primero los datos personales básicos (nombre, apellido, DNI, CUIL)');
                    setActiveTab('datos');
                    return;
                  }
                  
                  // Crear el asociado con historial médico
                  (async () => {
                    try {
                      const creadoPorId = user?.id || null;

                      const payload: any = {
                        nombre: formData.nombre,
                        apellido: formData.apellido,
                        cuil: formData.cuil,
                        dni: formData.dni,
                        telefono: formData.telefono,
                        fecha_ingreso: formData.fecha_ingreso,
                        domicilio: formData.domicilio,
                        legajo: formData.legajo?.trim() || null,
                        nro_socio: formData.nro_socio?.trim() || null,
                        monotributo: formData.monotributo,
                        foto_dni: formData.foto_dni || null,
                        nombre_archivo_dni: formData.nombre_archivo_dni || null,
                        contratista_id: formData.contratista_id || null,
                        creado_por_id: creadoPorId,
                        // Campos adicionales del formulario
                        fecha_nacimiento: formData.fecha_nacimiento || null,
                        estado_civil: formData.estado_civil || null,
                        barrio: formData.barrio || null,
                        codigo_postal: formData.codigo_postal || null,
                        ciudad: formData.ciudad || null,
                        provincia: formData.provincia || null,
                        mano_habil: formData.mano_habil || null,
                        email: formData.email || null,
                        beneficio_plan_social:
                          formData.beneficio_plan_social === 'otro'
                            ? (otroBeneficio || 'otro')
                            : formData.beneficio_plan_social || null,
                        archivos_adjuntos: formData.archivos_adjuntos || [],
                        // Historial médico completo
                        historial_medico: historialMedico,
                      };

                      await supabaseAsociadosService.crearAsociado(payload);

                      // Resetear formularios
                      setFormData({
                        nombre: '',
                        apellido: '',
                        fecha_nacimiento: '',
                        estado_civil: '',
                        beneficio_plan_social: '',
                        cuil: '',
                        dni: '',
                        telefono: '',
                        email: '',
                        fecha_ingreso: '',
                        domicilio: '',
                        barrio: '',
                        codigo_postal: '',
                        ciudad: '',
                        provincia: '',
                        mano_habil: undefined,
                        legajo: '',
                        nro_socio: '',
                        monotributo: false,
                        contratista: '',
                        contratista_id: '',
                        foto_dni: '',
                        nombre_archivo_dni: '',
                        archivos_adjuntos: [],
                        fotos_dni_multiple: []
                      });
                      setHistorialMedico(historialMedicoDefault);
                      setOtroBeneficio('');
                      setErrores({});

                      if (onSuccess) {
                        onSuccess();
                      }

                      alert('Asociado registrado exitosamente con historial médico completo');
                    } catch (error: any) {
                      alert(error?.message || 'Error al registrar asociado');
                    }
                  })();
                }}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Registrar Asociado Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormularioEmpleado;
