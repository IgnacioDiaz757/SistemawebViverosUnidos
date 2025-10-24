export interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
  userId?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 1000; // Máximo de logs en memoria

  log(level: 'error' | 'warning' | 'info', message: string, context?: Record<string, any>, error?: Error) {
    const log: ErrorLog = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      level,
      message,
      stack: error?.stack,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: this.getCurrentUserId(),
    };

    this.logs.unshift(log);
    
    // Mantener solo los últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Guardar en localStorage para persistencia
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('error_logs', JSON.stringify(this.logs.slice(0, 100))); // Solo los últimos 100
      } catch (e) {
        console.warn('No se pudo guardar logs en localStorage:', e);
      }
    }

    // Log en consola también
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
      `[${level.toUpperCase()}] ${message}`,
      context,
      error
    );
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log('error', message, context, error);
  }

  warning(message: string, context?: Record<string, any>) {
    this.log('warning', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  getLogs(level?: 'error' | 'warning' | 'info', limit = 50): ErrorLog[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(0, limit);
  }

  getErrorCount(): { total: number; errors: number; warnings: number; info: number } {
    return {
      total: this.logs.length,
      errors: this.logs.filter(log => log.level === 'error').length,
      warnings: this.logs.filter(log => log.level === 'warning').length,
      info: this.logs.filter(log => log.level === 'info').length,
    };
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error_logs');
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Intentar obtener el ID del usuario desde el contexto de auth
      if (typeof window !== 'undefined') {
        const authData = localStorage.getItem('auth_user');
        if (authData) {
          const user = JSON.parse(authData);
          return user.id;
        }
      }
    } catch (e) {
      // Ignorar errores
    }
    return undefined;
  }

  // Cargar logs desde localStorage al inicializar
  loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('error_logs');
        if (stored) {
          const parsedLogs = JSON.parse(stored);
          this.logs = parsedLogs;
        }
      } catch (e) {
        console.warn('No se pudieron cargar logs desde localStorage:', e);
      }
    }
  }
}

// Instancia singleton
export const errorLogger = new ErrorLogger();

// Cargar logs existentes al inicializar
if (typeof window !== 'undefined') {
  errorLogger.loadFromStorage();
}

// Hacer disponible globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).errorLogger = errorLogger;
}
