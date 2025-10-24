import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface InformeRopaFiltros {
  contratista_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  elemento_id?: string;
  asociado_id?: string;
}

export interface InformeRopaItem {
  id: string;
  asociado_id: string;
  asociado_nombre: string;
  asociado_apellido: string;
  asociado_legajo: string;
  contratista_id: string;
  contratista_nombre: string;
  elemento_id: string;
  elemento_nombre: string;
  elemento_categoria: string;
  talla: string | null;
  cantidad: number;
  fecha_entrega: string;
  entregado_por: string | null;
  observaciones: string | null;
}

export interface ResumenInformeRopa {
  total_entregas: number;
  total_elementos: number;
  total_asociados: number;
  total_contratistas: number;
  resumen_por_contratista: Array<{
    contratista_id: string;
    contratista_nombre: string;
    total_entregas: number;
    total_elementos: number;
    total_asociados: number;
  }>;
  resumen_por_elemento: Array<{
    elemento_id: string;
    elemento_nombre: string;
    elemento_categoria: string;
    total_cantidad: number;
    total_entregas: number;
  }>;
}

class InformesRopaService {
  async obtenerInformeRopa(filtros: InformeRopaFiltros = {}): Promise<InformeRopaItem[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase no configurado, retornando array vacío');
      return [];
    }

    try {
      let query = supabase
        .from('entregas_ropa')
        .select(`
          id,
          asociado_id,
          elemento_id,
          talla,
          cantidad,
          fecha_entrega,
          entregado_por,
          observaciones,
          asociados!inner(
            id,
            nombre,
            apellido,
            legajo,
            contratista_id,
            contratistas!inner(
              id,
              nombre
            )
          )
        `);

      // Aplicar filtros
      if (filtros.contratista_id) {
        query = query.eq('asociados.contratista_id', filtros.contratista_id);
      }

      if (filtros.fecha_desde) {
        query = query.gte('fecha_entrega', filtros.fecha_desde);
      }

      if (filtros.fecha_hasta) {
        query = query.lte('fecha_entrega', filtros.fecha_hasta);
      }

      if (filtros.elemento_id) {
        query = query.eq('elemento_id', filtros.elemento_id);
      }

      if (filtros.asociado_id) {
        query = query.eq('asociado_id', filtros.asociado_id);
      }

      // Ordenar por fecha de entrega descendente
      query = query.order('fecha_entrega', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo informe de ropa:', error);
        throw error;
      }

      // Mapear los datos a la estructura del informe
      const informeItems: InformeRopaItem[] = (data || []).map((item: any) => {
        // Obtener información del elemento desde la lista estática
        const elementoInfo = this.obtenerInfoElemento(item.elemento_id);
        
        return {
          id: item.id,
          asociado_id: item.asociado_id,
          asociado_nombre: item.asociados.nombre,
          asociado_apellido: item.asociados.apellido,
          asociado_legajo: item.asociados.legajo || '',
          contratista_id: item.asociados.contratista_id,
          contratista_nombre: item.asociados.contratistas.nombre,
          elemento_id: item.elemento_id,
          elemento_nombre: elementoInfo.nombre,
          elemento_categoria: elementoInfo.categoria,
          talla: item.talla,
          cantidad: item.cantidad,
          fecha_entrega: item.fecha_entrega,
          entregado_por: item.entregado_por,
          observaciones: item.observaciones,
        };
      });

      return informeItems;
    } catch (error) {
      console.error('Error en obtenerInformeRopa:', error);
      throw error;
    }
  }

  async obtenerResumenInformeRopa(filtros: InformeRopaFiltros = {}): Promise<ResumenInformeRopa> {
    const items = await this.obtenerInformeRopa(filtros);

    // Calcular totales generales
    const total_entregas = items.length;
    const total_elementos = items.reduce((sum, item) => sum + item.cantidad, 0);
    const total_asociados = new Set(items.map(item => item.asociado_id)).size;
    const total_contratistas = new Set(items.map(item => item.contratista_id)).size;

    // Resumen por contratista
    const resumen_por_contratista = items.reduce((acc, item) => {
      const key = item.contratista_id;
      if (!acc[key]) {
        acc[key] = {
          contratista_id: item.contratista_id,
          contratista_nombre: item.contratista_nombre,
          total_entregas: 0,
          total_elementos: 0,
          total_asociados: new Set(),
        };
      }
      acc[key].total_entregas += 1;
      acc[key].total_elementos += item.cantidad;
      acc[key].total_asociados.add(item.asociado_id);
      return acc;
    }, {} as Record<string, any>);

    // Convertir Set a número para total_asociados
    Object.values(resumen_por_contratista).forEach((item: any) => {
      item.total_asociados = item.total_asociados.size;
    });

    // Resumen por elemento
    const resumen_por_elemento = items.reduce((acc, item) => {
      const key = item.elemento_id;
      if (!acc[key]) {
        acc[key] = {
          elemento_id: item.elemento_id,
          elemento_nombre: item.elemento_nombre,
          elemento_categoria: item.elemento_categoria,
          total_cantidad: 0,
          total_entregas: 0,
        };
      }
      acc[key].total_cantidad += item.cantidad;
      acc[key].total_entregas += 1;
      return acc;
    }, {} as Record<string, any>);

    return {
      total_entregas,
      total_elementos,
      total_asociados,
      total_contratistas,
      resumen_por_contratista: Object.values(resumen_por_contratista),
      resumen_por_elemento: Object.values(resumen_por_elemento),
    };
  }

  private obtenerInfoElemento(elementoId: string): { nombre: string; categoria: string } {
    // Lista estática de elementos (debe coincidir con GestionRopa.tsx)
    const elementos: Record<string, { nombre: string; categoria: string }> = {
      // Protección Personal
      'casco': { nombre: 'Casco', categoria: 'proteccion' },
      'arnes': { nombre: 'Arnés', categoria: 'proteccion' },
      'chaleco': { nombre: 'Chaleco', categoria: 'proteccion' },
      'guantes': { nombre: 'Guantes', categoria: 'proteccion' },
      'lentes': { nombre: 'Lentes', categoria: 'proteccion' },
      'sordina': { nombre: 'Sordina', categoria: 'proteccion' },
      'barbijo': { nombre: 'Barbijo', categoria: 'proteccion' },
      'faja': { nombre: 'Faja', categoria: 'proteccion' },
      
      // Uniformes
      'pantalon': { nombre: 'Pantalón', categoria: 'uniformes' },
      'remera': { nombre: 'Remera', categoria: 'uniformes' },
      'campera': { nombre: 'Campera', categoria: 'uniformes' },
      'camisa': { nombre: 'Camisa', categoria: 'uniformes' },
      'buzo': { nombre: 'Buzo', categoria: 'uniformes' },
      
      // Calzado
      'botas': { nombre: 'Botas', categoria: 'calzado' },
      'zapatillas': { nombre: 'Zapatillas', categoria: 'calzado' },
      'zapatos': { nombre: 'Zapatos', categoria: 'calzado' },
      'borcegos': { nombre: 'Borcegos', categoria: 'calzado' },
      
      // Accesorios
      'gorra': { nombre: 'Gorra', categoria: 'accesorios' },
      'cinturon': { nombre: 'Cinturón', categoria: 'accesorios' },
      'medias': { nombre: 'Medias', categoria: 'accesorios' },
    };

    return elementos[elementoId] || { nombre: elementoId, categoria: 'otros' };
  }

  async obtenerContratistas(): Promise<Array<{ id: string; nombre: string }>> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('contratistas')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');

      if (error) {
        console.error('Error obteniendo contratistas:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en obtenerContratistas:', error);
      throw error;
    }
  }
}

export const informesRopaService = new InformesRopaService();
export default informesRopaService;
