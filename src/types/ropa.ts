export interface ElementoRopa {
  id: string;
  nombre: string;
  categoria: CategoriaRopa;
  tallas?: string[]; // Tallas disponibles para este elemento
  activo: boolean;
}

export interface EntregaRopa {
  id: string;
  empleadoId: string;
  elementoRopaId: string;
  nombreElemento: string; // Para mantener el nombre aunque se elimine el elemento
  categoria: CategoriaRopa;
  talla?: string;
  cantidad: number;
  fechaEntrega: string;
  observaciones?: string;
  entregadoPor: string; // Persona que realizó la entrega
  adjuntos?: AdjuntarArchivo[]; // Planillas/fotos asociadas a la entrega
}

export interface AdjuntarArchivo {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'pdf';
  dataUrl: string; // Base64 para persistir en localStorage
  fechaSubida: string;
}

export interface FichaRopa {
  empleadoId: string;
  entregas: EntregaRopa[];
  ultimaActualizacion: string;
}

export type CategoriaRopa = 
  | 'uniformes'
  | 'calzado'
  | 'proteccion'
  | 'accesorios'
  | 'otros';

export const CATEGORIAS_ROPA: { value: CategoriaRopa; label: string }[] = [
  { value: 'proteccion', label: 'Protección' },
  { value: 'uniformes', label: 'Uniformes' },
  { value: 'calzado', label: 'Calzado' },
  { value: 'accesorios', label: 'Accesorios' },
  { value: 'otros', label: 'Otros' }
];

// Versión del catálogo de elementos para invalidar cache en localStorage cuando cambia
export const ELEMENTOS_ROPA_VERSION = 'v3';

export const ELEMENTOS_ROPA_DEFAULT: ElementoRopa[] = [
  // Proteccion
  { id: '16', nombre: 'Casco', categoria: 'proteccion', activo: true },
  { id: '17', nombre: 'Arnes', categoria: 'proteccion', activo: true },
  { id: '18', nombre: 'Chaleco', categoria: 'proteccion', tallas: ['S', 'M', 'L', 'XL', 'XXL'], activo: true },
  { id: '19', nombre: 'Guantes', categoria: 'proteccion', tallas: ['S', 'M', 'L', 'XL'], activo: true },
  { id: '20', nombre: 'Lentes', categoria: 'proteccion', activo: true },
  { id: '21', nombre: 'Sordina', categoria: 'proteccion', activo: true },
  { id: '22', nombre: 'Barbijo', categoria: 'proteccion', activo: true },
  { id: '23', nombre: 'Faja', categoria: 'proteccion', tallas: ['S', 'M', 'L', 'XL', 'XXL'], activo: true },

  // Uniformes
  { id: '24', nombre: 'Pantalon', categoria: 'uniformes', tallas: ['S', 'M', 'L', 'XL', 'XXL'], activo: true },
  { id: '25', nombre: 'Remera', categoria: 'uniformes', tallas: ['S', 'M', 'L', 'XL', 'XXL'], activo: true },
  { id: '26', nombre: 'Campera', categoria: 'uniformes', tallas: ['S', 'M', 'L', 'XL', 'XXL'], activo: true },

  // Calzado
  { id: '27', nombre: 'Borcego', categoria: 'calzado', tallas: ['39', '40', '41', '42', '43', '44', '45', '46'], activo: true },

  // Accesorios
  { id: '28', nombre: 'Gorra', categoria: 'accesorios', tallas: ['Única'], activo: true }
];
