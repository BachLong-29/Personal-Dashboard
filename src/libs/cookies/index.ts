interface CookieOptions {
  maxAge?: number;
  path?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
}

const DEFAULT_OPTIONS: CookieOptions = {
  path: '/',
  sameSite: 'Strict',
  // Secure flag is set only in production so local dev (http) still works
  secure: process.env.NODE_ENV === 'production',
};

export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.secure) parts.push('Secure');

  document.cookie = parts.join('; ');
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const key = `${encodeURIComponent(name)}=`;
  const found = document.cookie.split('; ').find((c) => c.startsWith(key));
  return found ? decodeURIComponent(found.slice(key.length)) : null;
}

export function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/`;
}
