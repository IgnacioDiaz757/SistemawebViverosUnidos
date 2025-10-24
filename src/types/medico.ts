export interface EnfermedadesRespiratorias {
  tos: boolean;
  tuberculosis: boolean;
  faltaDeAire: boolean;
  escupirSangre: boolean;
  asma: boolean;
  alergia: boolean;
  otras: string;
}

export interface EnfermedadesCardiovasculares {
  palpitaciones: boolean;
  dolorDePecho: boolean;
  hipertension: boolean;
  chagas: boolean;
  cardiovasculares: boolean;
  otras: string;
}

export interface EnfermedadesPeso {
  aumentoDePeso: boolean;
  descensoDePeso: boolean;
  observaciones: string;
}

export interface EnfermedadesDigestivas {
  ulceraGastroduodenal: boolean;
  diarreas: boolean;
  reflujo: boolean;
  acidez: boolean;
  parasitosis: boolean;
  antecedenteHepatitis: boolean;
  otras: string;
}

export interface EnfermedadesUrinarias {
  colicosRenales: boolean;
  infeccionesUrinarias: boolean;
  sangreEnOrina: boolean;
  otras: string;
}

export interface EnfermedadesNeurologicas {
  dolorDeCabeza: boolean;
  convulsiones: boolean;
  temblores: boolean;
  alteracionesSueño: boolean;
  perdidaConocimiento: boolean;
  depresion: boolean;
  otras: string;
}

export interface EnfermedadesOseas {
  doloresOseos: boolean;
  fracturas: boolean;
  lumbalgias: boolean;
  hernias: boolean;
  otras: string;
}

export interface EnfermedadesEndocrinas {
  diabetes: boolean;
  hipertiroidismo: boolean;
  hipotiroidismo: boolean;
  otras: string;
}

export interface EnfermedadesInfecciosas {
  dengue: boolean;
  covid19: boolean;
  otras: string;
}

export interface EnfermedadesReumaticas {
  reumas: boolean;
  otras: string;
}

export interface Cirugia {
  id: string;
  tipo: string;
  fecha: string;
  hospital?: string;
  observaciones?: string;
}

export interface Medicamento {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  fechaInicio: string;
  fechaFin?: string;
  indicacion: string;
}

export interface ActividadFisica {
  practica: boolean;
  tipo: string;
  frecuencia: string;
  intensidad: 'baja' | 'moderada' | 'alta';
  observaciones: string;
}

export interface OtrosHabitos {
  tabaco: {
    consume: boolean;
    cantidad?: string;
    tiempoConsumo?: string;
  };
  alcohol: {
    consume: boolean;
    frecuencia?: string;
    tipo?: string;
  };
  drogas: {
    consume: boolean;
    tipo?: string;
    observaciones?: string;
  };
  otros: string;
}

export interface HistorialMedico {
  // Enfermedades por categorías
  respiratorias: EnfermedadesRespiratorias;
  cardiovasculares: EnfermedadesCardiovasculares;
  peso: EnfermedadesPeso;
  digestivas: EnfermedadesDigestivas;
  urinarias: EnfermedadesUrinarias;
  neurologicas: EnfermedadesNeurologicas;
  oseas: EnfermedadesOseas;
  endocrinas: EnfermedadesEndocrinas;
  infecciosas: EnfermedadesInfecciosas;
  reumaticas: EnfermedadesReumaticas;
  
  // Otras secciones
  otrasEnfermedades: string;
  cirugias: Cirugia[];
  medicamentos: Medicamento[];
  actividadFisica: ActividadFisica;
  otrosHabitos: OtrosHabitos;
  
  // Metadatos
  fechaActualizacion: string;
  actualizadoPor: string;
}

// Valores por defecto para inicializar el historial médico
export const historialMedicoDefault: HistorialMedico = {
  respiratorias: {
    tos: false,
    tuberculosis: false,
    faltaDeAire: false,
    escupirSangre: false,
    asma: false,
    alergia: false,
    otras: ''
  },
  cardiovasculares: {
    palpitaciones: false,
    dolorDePecho: false,
    hipertension: false,
    chagas: false,
    cardiovasculares: false,
    otras: ''
  },
  peso: {
    aumentoDePeso: false,
    descensoDePeso: false,
    observaciones: ''
  },
  digestivas: {
    ulceraGastroduodenal: false,
    diarreas: false,
    reflujo: false,
    acidez: false,
    parasitosis: false,
    antecedenteHepatitis: false,
    otras: ''
  },
  urinarias: {
    colicosRenales: false,
    infeccionesUrinarias: false,
    sangreEnOrina: false,
    otras: ''
  },
  neurologicas: {
    dolorDeCabeza: false,
    convulsiones: false,
    temblores: false,
    alteracionesSueño: false,
    perdidaConocimiento: false,
    depresion: false,
    otras: ''
  },
  oseas: {
    doloresOseos: false,
    fracturas: false,
    lumbalgias: false,
    hernias: false,
    otras: ''
  },
  endocrinas: {
    diabetes: false,
    hipertiroidismo: false,
    hipotiroidismo: false,
    otras: ''
  },
  infecciosas: {
    dengue: false,
    covid19: false,
    otras: ''
  },
  reumaticas: {
    reumas: false,
    otras: ''
  },
  otrasEnfermedades: '',
  cirugias: [],
  medicamentos: [],
  actividadFisica: {
    practica: false,
    tipo: '',
    frecuencia: '',
    intensidad: 'baja',
    observaciones: ''
  },
  otrosHabitos: {
    tabaco: {
      consume: false,
      cantidad: '',
      tiempoConsumo: ''
    },
    alcohol: {
      consume: false,
      frecuencia: '',
      tipo: ''
    },
    drogas: {
      consume: false,
      tipo: '',
      observaciones: ''
    },
    otros: ''
  },
  fechaActualizacion: new Date().toISOString(),
  actualizadoPor: ''
};
