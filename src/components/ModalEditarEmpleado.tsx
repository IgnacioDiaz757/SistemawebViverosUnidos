'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEmpleados } from '@/context/EmpleadosContext';
import { useServicios } from '@/context/ServiciosContext';
import { Asociado, Empleado } from '@/types/asociado';
import SubidaArchivo from './SubidaArchivo';
import { generateDniFileName } from '@/utils/fileUtils';
import { supabaseAsociadosService } from '@/services/supabaseAsociadosService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseStorageService } from '@/services/supabaseStorageService';
import { supabaseHistorialMedicoService } from '@/services/supabaseHistorialMedicoService';
// Servicios de Supabase eliminados: usaremos localStorage para historial y ropa
import AlertBanner from '@/components/AlertBanner';

interface ModalEditarEmpleadoProps {
  empleado: Empleado | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ModalEditarEmpleado: React.FC<ModalEditarEmpleadoProps> = ({
  empleado,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { state, editarEmpleado, editarEmpleadoConCambioContratista, agregarContratista } = useEmpleados();
  const servicios = useServicios();
  const [mostrarNuevoContratista, setMostrarNuevoContratista] = useState(false);
  const [nuevoContratista, setNuevoContratista] = useState('');
  const [mostrarModalCambioContratista, setMostrarModalCambioContratista] = useState(false);
  const [datosParaGuardar, setDatosParaGuardar] = useState<Empleado | null>(null);
  const [responsableCambio, setResponsableCambio] = useState('');
  const [motivoCambio, setMotivoCambio] = useState('');
  const [activeTab, setActiveTab] = useState<'datos'>('datos');
  // Beneficio ahora es texto libre; removemos selector "otro"
  const [historialContratistas, setHistorialContratistas] = useState<any[]>([]);
  const [ropaEntregada, setRopaEntregada] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [catalogoContratistas, setCatalogoContratistas] = useState<{ id: string; nombre: string }[]>([]);
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  // Normaliza una fecha a formato YYYY-MM-DD para inputs type="date"
  const toYmd = (value: any): string => {
    if (!value) return '';
    const raw = String(value);
    // Si ya viene como YYYY-MM-DD, devolver tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    // Intentar parsear y formatear
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    // Fallback: tomar parte antes de 'T'
    return raw.split('T')[0] || '';
  };

  const handleAdjuntosSeleccionados = (files: { base64Data: string; fileName: string }[]) => {
    // Mapear a estructura ArchivoAdjunto con datos mínimos
    const subir = async () => {
      const nuevos: any[] = [];
      for (const f of files) {
        if (isSupabaseConfigured && empleado?.id) {
          const carpeta = `asociados/${empleado.id}`;
          const up = await supabaseStorageService.subirBase64(carpeta, f.base64Data, f.fileName);
          // Registrar metadatos en tabla 'archivos' (no bloquear si falla)
          try {
            await (supabaseStorageService as any).registrarMetadatosArchivo?.({
              entidad_tipo: 'asociado',
              entidad_id: String(empleado.id),
              nombre: f.fileName,
              path: up.path,
              url: up.publicUrl,
              tipo: 'image/*',
              tamano: 0,
              categoria: 'identificacion',
              extra: { fuente: 'modal-editar-empleado' },
            });
          } catch {}
          nuevos.push({
            id: up.path,
            nombre: f.fileName,
            tipo: 'image/*',
            tamano: 0,
            url: up.publicUrl,
            path: up.path,
            fecha_subida: new Date().toISOString(),
            categoria: 'identificacion',
            subido_por: user?.email || user?.nombre || 'usuario'
          });
        } else {
          nuevos.push({
            id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string,
            nombre: f.fileName,
            tipo: 'image/*',
            tamano: 0,
            contenido: f.base64Data,
            fecha_subida: new Date().toISOString(),
            categoria: 'identificacion',
            subido_por: user?.email || user?.nombre || 'usuario'
          });
        }
      }
      setFormData((prev) => ({
        ...prev,
        archivos_adjuntos: [...(prev.archivos_adjuntos || []), ...nuevos]
      }));
    };
    subir();
  };
  const renderNombreContratista = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val?.nombre || '';
  };

  const contratistaActualResuelto = useMemo(() => {
    if (!empleado) return null as any;
    const currentId = (empleado as any).contratista_id || (empleado as any).id_contratista || (typeof (empleado as any).contratista === 'object' && (empleado as any).contratista?.id) || '';
    const currentName = ((): string => {
      const direct = (empleado as any).contratista;
      if (typeof direct === 'string') return direct;
      return (empleado as any).contratista?.nombre || '';
    })();
    const byId = currentId ? catalogoContratistas.find(c => String(c.id) === String(currentId)) : undefined;
    const byName = !byId && currentName ? catalogoContratistas.find(c => c.nombre?.trim().toLowerCase() === currentName.trim().toLowerCase()) : undefined;
    return byId || byName || null;
  }, [empleado, catalogoContratistas]);


  const handleFileSelect = async (base64Data: string, fileName: string) => {
    try {
      if (isSupabaseConfigured && empleado?.id) {
        const carpeta = `asociados/${empleado.id}/dni`;
        const nombreArchivo = fileName || generateDniFileName(String((empleado as any)?.dni || ''), empleado.nombre || '', empleado.apellido || '', 'dni.jpg');
        const up = await supabaseStorageService.subirBase64(carpeta, base64Data, nombreArchivo);
        setFormData((prev) => ({
          ...prev,
          foto_dni: up.publicUrl || '',
          nombre_archivo_dni: nombreArchivo,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          foto_dni: base64Data,
          nombre_archivo_dni: fileName || 'dni.jpg',
        }));
      }
    } catch (e) {
      console.error('No se pudo subir la foto del DNI', e);
      setBanner({ type: 'error', message: 'No se pudo subir la foto del DNI' });
    }
  };

  const handleEliminarAdjunto = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      archivos_adjuntos: (prev.archivos_adjuntos || []).filter((a: any) => a.id !== id)
    }));
  };

  const handleDescargarAdjunto = (adj: any) => {
    try {
      const link = document.createElement('a');
      link.href = adj.url || adj.contenido;
      link.download = adj.nombre || 'archivo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('No se pudo descargar el adjunto', e);
      setBanner({ type: 'error', message: 'No se pudo descargar el adjunto' });
    }
  };

  // Historial médico eliminado del modal de edición

  // Función para validar duplicados usando Supabase
  const validarEmpleadoDuplicadoSupabase = async (
    empleadoData: { cuil: any; dni: any; legajo: any; nro_socio: any },
    empleadoActualId: string
  ): Promise<Record<string, string>> => {
    const errores: Record<string, string> = {};

    try {
      const toStr = (v: any): string => (v == null ? '' : String(v));
      const cuilStr = toStr(empleadoData.cuil).trim();
      const dniStr = toStr(empleadoData.dni).trim();
      const legajoStr = toStr(empleadoData.legajo).trim();
      const nroSocioStr = toStr(empleadoData.nro_socio).trim();

      // Validar CUIL
      if (cuilStr) {
        const cuilValido = await supabaseAsociadosService.validarCuilUnico(cuilStr, empleadoActualId);
        if (!cuilValido.esValido) {
          errores.cuil = cuilValido.mensaje || 'CUIL ya existe';
        }
      }

      // Validar DNI
      if (dniStr) {
        const dniValido = await supabaseAsociadosService.validarDniUnico(dniStr, empleadoActualId);
        if (!dniValido.esValido) {
          errores.dni = dniValido.mensaje || 'DNI ya existe';
        }
      }

      // Validar Legajo
      if (legajoStr) {
        const legajoValido = await supabaseAsociadosService.validarLegajoUnico(legajoStr, empleadoActualId);
        if (!legajoValido.esValido) {
          errores.legajo = legajoValido.mensaje || 'Legajo ya existe';
        }
      }

      // Validar Número de Socio
      if (nroSocioStr) {
        const nro_socioValido = await supabaseAsociadosService.validarNroSocioUnico(nroSocioStr, empleadoActualId);
        if (!nro_socioValido.esValido) {
          errores.nro_socio = nro_socioValido.mensaje || 'Número de socio ya existe';
        }
      }
    } catch (error) {
      console.error('Error validando duplicados en Supabase:', error);
    }

    return errores;
  };
  
  const [formData, setFormData] = useState<Omit<Empleado, 'id' | 'activo' | 'fecha_baja' | 'responsable_baja' | 'fecha_carga'> & { fecha_ingreso: string }>({
    nombre: '',
    apellido: '',
    beneficio: '',
    cuil: '',
    dni: '',
    telefono: '',
    fecha_ingreso: '',
    domicilio: '',
    legajo: '',
    nro_socio: '',
    monotributo: false,
    contratista: '',
    foto_dni: '',
    nombre_archivo_dni: '',
    archivos_adjuntos: []
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  // Función para cargar historial de contratistas y ropa entregada
  const cargarHistorialYropa = async (asociadoId: string) => {
    setCargandoHistorial(true);
    try {
      // Cargar historial de contratistas desde localStorage
      const keyHist = `historial_contratistas_${asociadoId}`;
      const histLocal = JSON.parse(localStorage.getItem(keyHist) || '[]');
      setHistorialContratistas(Array.isArray(histLocal) ? histLocal : []);

      // Cargar ropa entregada desde localStorage
      const entregas = JSON.parse(localStorage.getItem('entregas_ropa') || '[]');
      const ropa = (Array.isArray(entregas) ? entregas : []).filter((e: any) => e.asociado_id === asociadoId);
      setRopaEntregada(ropa);
    } catch (error) {
      console.error('Error cargando historial y ropa:', error);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Derivados: fechas de alta/carga
  const fechaRegistroInicial = useMemo(() => {
    return String(empleado?.fecha_carga || '');
  }, [empleado]);

  const fechaAltaContratistaActual = useMemo(() => {
    // Buscar el último movimiento de cambio/alta que tengamos
    const normalizarFecha = (f: any): string | null => {
      if (!f) return null;
      try { return new Date(f).toISOString().split('T')[0]; } catch { return null; }
    };
    const movimientos = (historialContratistas || [])
      .map((m: any) => ({
        tipo: m?.tipo || m?.tipo_movimiento,
        fecha: m?.fecha || m?.fecha_movimiento,
        contratista_nuevo: m?.contratista_nuevo,
      }))
      .filter((m: any) => m.tipo === 'cambio_contratista' || m.tipo === 'reactivacion' || m.tipo === 'alta');
    if (movimientos.length === 0) return null;
    const ult = movimientos.reduce((a: any, b: any) => {
      const fa = new Date(a.fecha as string).getTime();
      const fb = new Date(b.fecha as string).getTime();
      return fb > fa ? b : a;
    });
    return normalizarFecha(ult?.fecha);
  }, [historialContratistas]);

  // Cargar datos del empleado cuando se abre el modal
  useEffect(() => {
    if (empleado && isOpen) {
      // Cargar catálogo de contratistas desde servicios o fallback
      (async () => {
        try {
          if ((servicios as any)?.contratistas?.listar) {
            const lista = await (servicios as any).contratistas.listar();
            const normalizada = (lista || []).map((c: any) => ({ id: String(c.id), nombre: String(c.nombre) }));
            setCatalogoContratistas(normalizada);
          } else if (state.contratistas && state.contratistas.length) {
            setCatalogoContratistas(state.contratistas.map((c: any) => ({ id: String(c.id), nombre: String(c.nombre) })));
          } else {
            try {
              const raw = localStorage.getItem('contratistas');
              const parsed = raw ? JSON.parse(raw) : [];
              const normalizada = (parsed || []).map((c: any) => ({ id: String(c.id), nombre: String(c.nombre) }));
              setCatalogoContratistas(normalizada);
            } catch {
              setCatalogoContratistas([]);
            }
          }
        } catch {
          setCatalogoContratistas([]);
        }
      })();
      setFormData({
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        beneficio: (empleado as any).beneficio || empleado.beneficio_plan_social || '',
        cuil: String(empleado.cuil || ''),
        dni: String(empleado.dni || ''),
        telefono: empleado.telefono || '',
        fecha_ingreso: String(empleado.fecha_ingreso || ''),
        domicilio: empleado.domicilio || '',
        legajo: String(empleado.legajo || ''),
        nro_socio: String(empleado.nro_socio || ''),
        monotributo: empleado.monotributo,
        contratista: ((): any => {
          const id = (empleado as any).contratista_id || (empleado as any).id_contratista || (typeof (empleado as any).contratista === 'object' && (empleado as any).contratista?.id) || '';
          const nombre = (typeof (empleado as any).contratista === 'string')
            ? (empleado as any).contratista
            : (empleado as any).contratista?.nombre || '';
          return id || nombre ? { id, nombre } : '';
        })(),
        foto_dni: empleado.foto_dni || '',
        nombre_archivo_dni: empleado.nombre_archivo_dni || '',
        archivos_adjuntos: empleado.archivos_adjuntos || []
      });

      // Cargar historial de contratistas y ropa entregada
      cargarHistorialYropa(empleado.id);
      
      // Historial médico removido en edición

      // Beneficio como texto libre; sin estado auxiliar
      
      setErrores({});
    }
  }, [empleado, isOpen]);

  // Cuando el catálogo de contratistas está disponible, normalizar el contratista actual en el form
  useEffect(() => {
    if (!empleado || !isOpen) return;
    if (!catalogoContratistas || catalogoContratistas.length === 0) return;
    const currentId = (empleado as any).contratista_id || (empleado as any).id_contratista || (typeof (empleado as any).contratista === 'object' && (empleado as any).contratista?.id) || '';
    const currentName = ((): string => {
      const direct = (empleado as any).contratista;
      if (typeof direct === 'string') return direct;
      return (empleado as any).contratista?.nombre || '';
    })();
    const byId = currentId ? catalogoContratistas.find(c => String(c.id) === String(currentId)) : undefined;
    const byName = !byId && currentName ? catalogoContratistas.find(c => c.nombre?.trim().toLowerCase() === currentName.trim().toLowerCase()) : undefined;
    const resolved = byId || byName;
    if (resolved) {
      setFormData(prev => ({ ...prev, contratista: { id: resolved.id, nombre: resolved.nombre } } as any));
    }
  }, [catalogoContratistas, empleado, isOpen]);

  const validarFormulario = async () => {
    const nuevosErrores: Record<string, string> = {};
    // En edición permitimos guardar cambios puntuales sin requerir todos los campos

    // Validar formato CUIL (XX-XXXXXXXX-X)
    const cuilRegex = /^\d{2}-\d{8}-\d{1}$/;
    if (formData.cuil && !cuilRegex.test(formData.cuil)) {
      nuevosErrores.cuil = 'El CUIL debe tener el formato XX-XXXXXXXX-X';
    }

    // Validar DNI (solo números)
    const dniRegex = /^\d{7,8}$/;
    if (formData.dni && !dniRegex.test(formData.dni)) {
      nuevosErrores.dni = 'El DNI debe tener 7 u 8 dígitos';
    }

    // Validar duplicados solo si los campos básicos están correctos
    if (!nuevosErrores.cuil && !nuevosErrores.dni && empleado) {
      try {
        // Usar validación de Supabase que excluye automáticamente el empleado actual
        const erroresDuplicados = await validarEmpleadoDuplicadoSupabase(
          {
            cuil: formData.cuil,
            dni: formData.dni,
            legajo: formData.legajo || '',
            nro_socio: formData.nro_socio || ''
          },
          empleado.id // Excluir el empleado actual de la validación
        );

        // Combinar errores de duplicados
        Object.assign(nuevosErrores, erroresDuplicados);
      } catch (error) {
        console.error('Error validando duplicados:', error);
        // Si hay error en la validación, continuar sin validar duplicados
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!empleado || !(await validarFormulario())) {
      return;
    }

    const empleadoActualizado: Empleado = {
      ...empleado,
      ...formData,
      // Compatibilidad de claves eliminada: usar campo 'beneficio' como texto
      beneficio_plan_social: undefined as any
    };

    // Verificar si cambió el contratista (comparar por ID normalizado)
    const getId = (val: any): string => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      return String(val.id || '');
    };
    const idActual = ((): string => {
      const c = (empleado as any).contratista;
      if (typeof c === 'object') return String(c?.id || '');
      return String((empleado as any).contratista_id || (empleado as any).id_contratista || '');
    })();
    const idNuevo = getId((formData as any).contratista);
    if (idNuevo && String(idNuevo) !== String(idActual)) {
      // Mostrar modal para registrar el cambio
      setDatosParaGuardar(empleadoActualizado);
      setMostrarModalCambioContratista(true);
      return;
    }

    // No hay cambio de contratista, actualizar normalmente
    try {
      // Persistir en Supabase si está configurado
      if (isSupabaseConfigured) {
        const updatePayload: any = {
          nombre: empleadoActualizado.nombre,
          apellido: empleadoActualizado.apellido,
          beneficio: (empleadoActualizado as any).beneficio || null,
          cuil: empleadoActualizado.cuil || null,
          dni: empleadoActualizado.dni || null,
          telefono: empleadoActualizado.telefono || null,
          fecha_ingreso: empleadoActualizado.fecha_ingreso || null,
          domicilio: empleadoActualizado.domicilio || null,
          legajo: empleadoActualizado.legajo || null,
          nro_socio: empleadoActualizado.nro_socio || null,
          monotributo: Boolean(empleadoActualizado.monotributo),
          foto_dni: empleadoActualizado.foto_dni || null,
          nombre_archivo_dni: empleadoActualizado.nombre_archivo_dni || null,
        };
        // Si el contratista en el form es objeto, no es cambio (mismo), pero podemos reafirmar
        if ((empleadoActualizado as any)?.contratista && typeof (empleadoActualizado as any).contratista === 'object') {
          const cid = (empleadoActualizado as any).contratista?.id;
          if (cid) updatePayload.contratista_id = cid;
        }
        await supabaseAsociadosService.actualizarAsociado(empleado.id, updatePayload);
      }
      // Actualizar estado local
      editarEmpleado(empleadoActualizado);
      
      // Historial médico no se guarda desde el modal de edición
      
      if (onSuccess) {
        onSuccess();
      }
      setBanner({ type: 'success', message: 'Empleado actualizado exitosamente' });
      onClose();
    } catch (error) {
      setBanner({ type: 'error', message: 'Error al actualizar empleado' });
    }
  };

  const handleConfirmarCambioContratista = async () => {
    if (!datosParaGuardar || !responsableCambio.trim() || !empleado) {
      setBanner({ type: 'warning', message: 'Debe indicar quién autoriza el cambio de contratista' });
      return;
    }

    try {
      // Normalizar y buscar contratistas por nombre u id (soporta string u objeto)
      const getNombre = (val: any) => (typeof val === 'string' ? val : val?.nombre || '');
      const getId = (val: any) => (typeof val === 'string' ? val : val?.id || '');

      const anteriorNombre = getNombre(empleado.contratista);
      const anteriorId = getId(empleado.contratista);
      const nuevoNombre = getNombre(datosParaGuardar.contratista);
      const nuevoId = getId(datosParaGuardar.contratista);

      const norm = (s: string) => (s || '').trim().toLowerCase();
      const listaContratistas = (catalogoContratistas && catalogoContratistas.length)
        ? catalogoContratistas
        : ((): any[] => {
            if (state.contratistas && state.contratistas.length) return state.contratistas;
            try {
              const raw = localStorage.getItem('contratistas');
              return raw ? JSON.parse(raw) : [];
            } catch { return []; }
          })();

      const contratistaAnterior = listaContratistas.find((c: any) =>
        (anteriorId && String(c.id) === String(anteriorId)) || norm(c.nombre) === norm(anteriorNombre)
      );
      const contratistaNuevo = listaContratistas.find((c: any) =>
        (nuevoId && String(c.id) === String(nuevoId)) || norm(c.nombre) === norm(nuevoNombre)
      );

      if (!contratistaNuevo) {
        // eslint-disable-next-line no-console
        console.warn('[CambioContratista] No se encontró contratista NUEVO', {
          nuevoRaw: datosParaGuardar.contratista,
          nuevoNormalizado: { nombre: nuevoNombre, id: nuevoId },
          listado: listaContratistas
        });
        setBanner({ type: 'warning', message: 'Debe seleccionar un contratista válido.' });
        return;
      }
      // Si no se encuentra el anterior, continuamos igual (no bloquea el cambio)

      // Obtener ID del responsable (usuario actual)
      const responsableId = user?.id;
      if (!responsableId) {
        setBanner({ type: 'error', message: 'Error: No se pudo identificar al responsable' });
        return;
      }

      // Actualizar el empleado en Supabase si está configurado y existe el método
      if (isSupabaseConfigured && (servicios as any)?.asociados?.actualizarAsociado) {
        try {
          await (servicios as any).asociados.actualizarAsociado(empleado.id, {
            contratista_id: contratistaNuevo.id,
            // Otros campos que puedan haber cambiado
            nombre: datosParaGuardar.nombre,
            apellido: datosParaGuardar.apellido,
          });
        } catch (error) {
          console.error('Error actualizando asociado en Supabase:', error);
        }
      }
      // Registrar el cambio en historial vía endpoint server (evita RLS)
      try {
        const resp = await fetch('/api/historial-contratistas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asociado_id: empleado.id,
            tipo_movimiento: 'cambio_contratista',
            contratista_anterior: contratistaAnterior?.nombre || null,
            contratista_nuevo: contratistaNuevo.nombre,
            responsable: responsableCambio,
            motivo: motivoCambio || undefined,
            contratista_id: contratistaNuevo.id,
          }),
        });
        if (!resp.ok) {
          const j = await resp.json().catch(() => ({}));
          throw new Error(j.error || 'Error registrando historial de contratistas');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('No se pudo registrar historial de contratistas en server, se mantiene fallback local.');
      }
      
      // Actualizar el empleado en contexto local
      editarEmpleadoConCambioContratista(datosParaGuardar, responsableCambio, motivoCambio || undefined);
      
      // Registrar el cambio en historial localStorage (fallback)
      const keyHist = `historial_contratistas_${empleado.id}`;
      const histLocal = JSON.parse(localStorage.getItem(keyHist) || '[]');
      const nuevoMovimiento = {
        id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string,
        tipo_movimiento: 'cambio_contratista',
        contratista_anterior: contratistaAnterior?.nombre || null,
        contratista_nuevo: contratistaNuevo.nombre,
        fecha_movimiento: new Date().toISOString(),
        responsable: { nombre: responsableCambio, apellido: '' },
        observaciones: motivoCambio || undefined,
        contratista: { nombre: contratistaNuevo.nombre },
      };
      const actualizado = Array.isArray(histLocal) ? [...histLocal, nuevoMovimiento] : [nuevoMovimiento];
      localStorage.setItem(keyHist, JSON.stringify(actualizado));
      
      // Recargar el historial y ropa
      await cargarHistorialYropa(empleado.id);
      
      // Limpiar estados del modal de cambio
      setMostrarModalCambioContratista(false);
      setDatosParaGuardar(null);
      setResponsableCambio('');
      setMotivoCambio('');
      
      if (onSuccess) {
        onSuccess();
      }
      setBanner({ type: 'success', message: 'Asociado actualizado exitosamente. Cambio de contratista registrado.' });
      onClose();
    } catch (error) {
      console.error('Error al actualizar asociado:', error);
      setBanner({ type: 'error', message: 'Error al actualizar asociado' });
    }
  };

  const handleCancelarCambioContratista = () => {
    setMostrarModalCambioContratista(false);
    setDatosParaGuardar(null);
    setResponsableCambio('');
    setMotivoCambio('');
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

  const handleAgregarContratista = () => {
    if (nuevoContratista.trim()) {
      agregarContratista(nuevoContratista.trim());
      setFormData(prev => ({ ...prev, contratista: nuevoContratista.trim() }));
      setNuevoContratista('');
      setMostrarNuevoContratista(false);
    }
  };

  // Eliminado duplicado legacy de handleFileSelect (conservar la versión asíncrona de arriba)

  if (!isOpen || !empleado) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        {banner && (
          <div className="mb-4">
            <AlertBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Editar Empleado: {empleado.nombre} {empleado.apellido}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Sin tabs: solo datos personales en edición */}

        {/* Contenido de las pestañas */}
        {true && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingrese el nombre"
              />
              {errores.nombre && <p className="text-red-500 text-sm mt-1">{errores.nombre}</p>}
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.apellido ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingrese el apellido"
              />
              {errores.apellido && <p className="text-red-500 text-sm mt-1">{errores.apellido}</p>}
            </div>

            {/* Beneficio o Plan Social (texto libre) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beneficio o Plan Social
              </label>
              <input
                type="text"
                name="beneficio"
                value={(formData as any).beneficio || ''}
                onChange={handleInputChange}
                placeholder="Ingrese beneficio o plan social (texto)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* CUIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

            {/* Fecha de Ingreso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Ingreso *
              </label>
              <input
                type="date"
                value={formData.fecha_ingreso}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Fecha en que ingresó el asociado a la cooperativa
              </p>
            </div>

            {/* Alta con contratista actual */}
            {fechaAltaContratistaActual && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alta con contratista actual
                </label>
                <input
                  type="date"
                  value={fechaAltaContratistaActual}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Fecha del último cambio/alta de contratista</p>
              </div>
            )}

            {/* Legajo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                placeholder="LEG-001"
              />
              {errores.legajo && (
                <p className={`error-message ${errores.legajo.includes('ya está registrado') ? 'duplicate' : ''}`}>
                  {errores.legajo}
                </p>
              )}
            </div>

            {/* Número de Socio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                placeholder="SOC-001"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              placeholder="Calle Falsa 123, Ciudad, Provincia"
            />
            {errores.domicilio && <p className="text-red-500 text-sm mt-1">{errores.domicilio}</p>}
          </div>

          {/* Contratista */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contratista *
            </label>
            <div className="flex gap-2">
              <select
                name="contratista"
                value={(formData as any)?.contratista?.id || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const cSel = catalogoContratistas.find((c: any) => String(c.id) === String(selectedId));
                  const nuevo = cSel ? { id: cSel.id, nombre: cSel.nombre } : '' as any;
                  const anteriorId = ((): string => {
                    const c = (empleado as any).contratista;
                    if (typeof c === 'object') return String(c?.id || '');
                    return String((empleado as any).contratista_id || (empleado as any).id_contratista || '');
                  })();
                  if (empleado && String(selectedId) !== String(anteriorId)) {
                    setDatosParaGuardar({
                      ...empleado,
                      ...formData,
                      contratista: nuevo,
                    } as any);
                    setMostrarModalCambioContratista(true);
                  }
                  // Actualizar formulario con objeto {id,nombre}
                  setFormData(prev => ({ ...prev, contratista: nuevo } as any));
                  // Limpiar error si existía
                  if (errores.contratista) setErrores(prev => ({ ...prev, contratista: '' }));
                }}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.contratista ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione un contratista</option>
                {catalogoContratistas.map((contratista: any) => (
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

            {/* Historial de Contratistas */}
            {historialContratistas.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Historial de Contratistas:</h4>
                <div className="space-y-2">
                  {historialContratistas.map((movimiento, index) => (
                    <div key={index} className="text-xs text-gray-600 border-l-2 border-blue-200 pl-2">
                      <span className="font-medium">
                        {new Date(movimiento.fecha).toLocaleDateString()}
                      </span>
                      {' - '}
                      <span className="capitalize">{movimiento.tipo_movimiento.replace('_', ' ')}</span>
                      {movimiento.contratista_anterior && (
                        <span> desde {movimiento.contratista_anterior}</span>
                      )}
                      {movimiento.contratista_nuevo && (
                        <span> a {movimiento.contratista_nuevo}</span>
                      )}
                      {movimiento.motivo && (
                        <span> - {movimiento.motivo}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ropa Entregada */}
            {ropaEntregada.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ropa Entregada:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ropaEntregada.map((entrega, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-white p-2 rounded border">
                      <div className="font-medium">{entrega.elemento?.nombre}</div>
                      <div>Cantidad: {entrega.cantidad}</div>
                      {entrega.talla && <div>Talla: {entrega.talla}</div>}
                      <div className="text-gray-500">
                        {new Date(entrega.fecha_entrega).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
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

          {/* Foto del DNI */}
          <div>
            <SubidaArchivo
              onFileSelect={handleFileSelect}
              onFilesSelect={handleAdjuntosSeleccionados}
              currentFile={formData.foto_dni}
              currentFileName={formData.nombre_archivo_dni}
              label="Foto del DNI"
              accept="image/*"
              multiple
            />
          </div>

          {/* Archivos adjuntos múltiples */}
          <div>
            <SubidaArchivo
              onFileSelect={() => {}}
              onFilesSelect={handleAdjuntosSeleccionados}
              label="Archivos adjuntos (múltiples)"
              accept="image/*"
              multiple
            />

            {(formData.archivos_adjuntos || []).length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {(formData.archivos_adjuntos || []).map((adj: any) => (
                  <div key={adj.id} className="border rounded p-2 flex flex-col items-center gap-2">
                    <img 
                      src={adj.url || adj.contenido} 
                      alt={adj.nombre} 
                      className="w-full h-24 object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="text-xs text-gray-700 truncate w-full" title={adj.nombre}>{adj.nombre}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDescargarAdjunto(adj)}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Descargar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarAdjunto(adj.id)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Guardar Cambios
            </button>
            </div>
          </form>
        )}

        {false && <div />}
      </div>

      {/* Modal de confirmación de cambio de contratista */}
      {mostrarModalCambioContratista && datosParaGuardar && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                Confirmar Cambio de Contratista
              </h3>
              
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="text-yellow-400 mr-2">⚠️</div>
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Se detectó un cambio de contratista:</p>
                    <p className="text-yellow-700 mt-1">
                      <span className="font-medium">De:</span> {renderNombreContratista(contratistaActualResuelto)}
                    </p>
                    <p className="text-yellow-700">
                      <span className="font-medium">A:</span> {renderNombreContratista(datosParaGuardar.contratista)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsable del cambio *
                  </label>
                  <input
                    type="text"
                    value={responsableCambio}
                    onChange={(e) => setResponsableCambio(e.target.value)}
                    placeholder="Nombre de quien autoriza el cambio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo del cambio (opcional)
                  </label>
                  <textarea
                    value={motivoCambio}
                    onChange={(e) => setMotivoCambio(e.target.value)}
                    placeholder="Razón del cambio de contratista..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancelarCambioContratista}
                  className="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarCambioContratista}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Confirmar Cambio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalEditarEmpleado;
