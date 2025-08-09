import type { Session } from '@supabase/supabase-js';

// Nombre del token de sesión utilizado por Supabase
export const AUTH_COOKIE_NAME = 'sb-auth-token';

// Configuración base para todas las cookies de autenticación
const BASE_COOKIE_OPTIONS = 'Path=/; SameSite=Lax; Secure';

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; ${BASE_COOKIE_OPTIONS}`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1] : null;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; ${BASE_COOKIE_OPTIONS}`;
}

// Implementación de almacenamiento compatible con Supabase que utiliza cookies
export const cookieStorage = {
  async getItem(key: string) {
    const value = getCookie(key);
    return value ? decodeURIComponent(value) : null;
  },
  async setItem(key: string, value: string) {
    setCookie(key, encodeURIComponent(value));
  },
  async removeItem(key: string) {
    removeCookie(key);
  }
};

// Helpers específicos para manejar la sesión de Supabase
export function setAuthSession(session: Session) {
  setCookie(AUTH_COOKIE_NAME, encodeURIComponent(JSON.stringify(session)));
}

export function getAuthSession(): Session | null {
  const raw = getCookie(AUTH_COOKIE_NAME);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  removeCookie(AUTH_COOKIE_NAME);
}

