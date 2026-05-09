import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';

import { AUTH_ROUTES, PROTECTED_ROUTES, TOKEN_KEYS } from '@/constants/auth';
import { routing } from '@/i18n/routing';

const handleI18n = createMiddleware(routing);

/**
 * Strip the locale prefix from a pathname to get the canonical route.
 * Only non-default locales have a URL prefix (localePrefix: 'as-needed').
 */
function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(`/${locale}`.length);
    if (pathname === `/${locale}`) return '/';
  }
  return pathname;
}

/**
 * Derive locale from the URL pathname.
 * Returns defaultLocale when the pathname has no explicit prefix.
 */
function getLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) return locale;
  }
  return routing.defaultLocale;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

export default function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  const cleanPathname = stripLocalePrefix(pathname);
  const locale = getLocale(pathname);
  const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const token = req.cookies.get(TOKEN_KEYS.ACCESS)?.value;

  // Unauthenticated user hitting a protected route → redirect to login
  if (isProtectedRoute(cleanPathname) && !token) {
    const loginUrl = new URL(`${localePrefix}${AUTH_ROUTES.LOGIN}`, req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting the login page → redirect to dashboard
  if (cleanPathname === AUTH_ROUTES.LOGIN && token) {
    return NextResponse.redirect(new URL(`${localePrefix}/dashboard`, req.url));
  }

  // Delegate to next-intl for locale detection and routing
  return handleI18n(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
