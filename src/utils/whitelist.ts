import { ADMIN_GENERAL_EMAIL } from '@/config/admin';

// Claves de storage unificadas
const STORAGE_WHITELIST = 'usuarios_whitelist';
const STORAGE_EMAILS_KEY = 'emails_autorizados';
const STORAGE_USUARIOS_KEY = 'usuarios_autorizados_detalle';

// Tipos y datos base
export interface UsuarioAutorizado {
  email: string;
  nombre: string;
  apellido: string;
  autorizadoPor: string;
  fechaAutorizacion: string;
  activo: boolean;
}

const EMAILS_AUTORIZADOS_BASE: string[] = ['admin@cooperativa.com', ADMIN_GENERAL_EMAIL];
const USUARIOS_AUTORIZADOS_BASE: UsuarioAutorizado[] = [
  {
    email: 'admin@cooperativa.com',
    nombre: 'Administrador',
    apellido: 'Principal',
    autorizadoPor: 'sistema',
    fechaAutorizacion: new Date().toISOString(),
    activo: true,
  }
];

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function normalizarEmail(email: string) {
  return (email || '').trim().toLowerCase();
}

// API mínima de whitelist (lista simple)
export function obtenerWhitelist(): string[] {
  if (!isBrowser()) return EMAILS_AUTORIZADOS_BASE;
  try {
    const raw = localStorage.getItem(STORAGE_WHITELIST);
    const legacy = raw ? JSON.parse(raw) : [];
    const alt = localStorage.getItem(STORAGE_EMAILS_KEY);
    const arrAlt = alt ? JSON.parse(alt) : [];
    const merged = Array.isArray(legacy) ? legacy : [];
    for (const e of Array.isArray(arrAlt) ? arrAlt : []) merged.push(e);
    const únicos = Array.from(new Set(merged.map(normalizarEmail)));
    if (únicos.length === 0) return EMAILS_AUTORIZADOS_BASE;
    return únicos;
  } catch {
    return EMAILS_AUTORIZADOS_BASE;
  }
}

export function guardarWhitelist(emails: string[]) {
  if (!isBrowser()) return;
  const únicos = Array.from(new Set((emails || []).map(normalizarEmail)));
  localStorage.setItem(STORAGE_WHITELIST, JSON.stringify(únicos));
  localStorage.setItem(STORAGE_EMAILS_KEY, JSON.stringify(únicos));
}

export function esAdminGeneral(email: string) {
  return normalizarEmail(email) === normalizarEmail(ADMIN_GENERAL_EMAIL);
}

export function estaAutorizado(email: string) {
  const e = normalizarEmail(email);
  if (esAdminGeneral(e)) return true;
  const lista = obtenerWhitelist().map(normalizarEmail);
  return lista.includes(e);
}

export function seedDefaultWhitelist() {
  if (!isBrowser()) return;
  const base = obtenerWhitelist().map(normalizarEmail);
  let changed = false;
  const add = (e: string) => {
    const n = normalizarEmail(e);
    if (n && !base.includes(n)) { base.push(n); changed = true; }
  };
  for (const e of EMAILS_AUTORIZADOS_BASE) add(e);
  if (changed) guardarWhitelist(base);
}

// API avanzada compatible con GestionAdministradores
function loadUsuariosAutorizados(): UsuarioAutorizado[] {
  if (!isBrowser()) return USUARIOS_AUTORIZADOS_BASE;
  const raw = localStorage.getItem(STORAGE_USUARIOS_KEY);
  if (raw) {
    try {
      const arr: UsuarioAutorizado[] = JSON.parse(raw);
      // Garantiza admin principal presente
      if (!arr.find(u => normalizarEmail(u.email) === 'admin@cooperativa.com')) {
        arr.push(USUARIOS_AUTORIZADOS_BASE[0]);
      }
      return arr;
    } catch {}
  }
  localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(USUARIOS_AUTORIZADOS_BASE));
  return USUARIOS_AUTORIZADOS_BASE;
}

function saveUsuariosAutorizados(usuarios: UsuarioAutorizado[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(usuarios));
}

export const esEmailAutorizado = (email: string): boolean => {
  const lista = obtenerWhitelist();
  return lista.includes(normalizarEmail(email));
};

export const obtenerUsuarioAutorizado = (email: string): UsuarioAutorizado | null => {
  const lista = loadUsuariosAutorizados();
  return (
    lista.find(u => normalizarEmail(u.email) === normalizarEmail(email) && u.activo) || null
  );
};

export const autorizarNuevoEmail = (
  nuevoEmail: string,
  nombre: string,
  apellido: string,
  autorizadoPor: string
): boolean => {
  try {
    const emails = obtenerWhitelist();
    const usuarios = loadUsuariosAutorizados();
    const nEmail = normalizarEmail(nuevoEmail);
    if (emails.includes(nEmail)) return false;
    const nuevos = Array.from(new Set([...emails, nEmail]));
    guardarWhitelist(nuevos);
    usuarios.push({
      email: nEmail,
      nombre,
      apellido,
      autorizadoPor,
      fechaAutorizacion: new Date().toISOString(),
      activo: true,
    });
    saveUsuariosAutorizados(usuarios);
    return true;
  } catch (error) {
    console.error('Error al autorizar email:', error);
    return false;
  }
};

export const desautorizarEmail = (email: string, _desautorizadoPor: string): boolean => {
  try {
    const usuarios = loadUsuariosAutorizados();
    const usuario = usuarios.find(u => normalizarEmail(u.email) === normalizarEmail(email));
    if (!usuario) return false;
    if (normalizarEmail(email) === 'admin@cooperativa.com') return false;
    usuario.activo = false;
    saveUsuariosAutorizados(usuarios);
    const emails = obtenerWhitelist().filter(e => normalizarEmail(e) !== normalizarEmail(email));
    guardarWhitelist(emails);
    return true;
  } catch (error) {
    console.error('Error al desautorizar email:', error);
    return false;
  }
};

export const obtenerUsuariosAutorizados = (): UsuarioAutorizado[] => {
  const lista = loadUsuariosAutorizados();
  return lista.filter(u => u.activo);
};


