import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface ServerUserRecord {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'admin';
  activo: boolean;
  fechaCreacion: string;
  password: string; // bcrypt hash
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers: ServerUserRecord[] = [
      {
        id: '1',
        email: 'admin@cooperativa.com',
        nombre: 'Administrador',
        apellido: 'Principal',
        rol: 'admin',
        activo: true,
        fechaCreacion: new Date().toISOString(),
        password: '$2b$12$8qL9szjjX3wNjp3lkZoWdOHF1Zam08duhwFG1daafMCdendeL8Gnu' // 123456
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
  }
}

export function readServerUsers(): ServerUserRecord[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw) as ServerUserRecord[];
  } catch (e) {
    return [];
  }
}

export function findServerUserByEmail(email: string): ServerUserRecord | undefined {
  const users = readServerUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function addServerUser(user: Omit<ServerUserRecord, 'id' | 'fechaCreacion'> & { id?: string }): ServerUserRecord {
  ensureDataFile();
  const users = readServerUsers();
  if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
    return users.find(u => u.email.toLowerCase() === user.email.toLowerCase())!;
  }
  const record: ServerUserRecord = {
    id: user.id || Date.now().toString(),
    fechaCreacion: new Date().toISOString(),
    ...user,
  };
  users.push(record);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  return record;
}

export async function ensureHashed(passwordOrHash: string): Promise<string> {
  if (passwordOrHash.startsWith('$2')) return passwordOrHash;
  return bcrypt.hash(passwordOrHash, 12);
}


