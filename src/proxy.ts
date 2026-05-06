import { type NextRequest, NextResponse } from 'next/server';

import { TOKEN_KEYS, AUTH_ROUTES, PROTECTED_ROUTES } from '@/constants/auth';

const publicRoutes = [AUTH_ROUTES.LOGIN, AUTH_ROUTES.REGISTER, '/'];

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isPublicRoute(pathname: string) {
  return publicRoutes.includes(pathname as (typeof publicRoutes)[number]);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Reads the access_token cookie set by setTokens() after login
  const token = req.cookies.get(TOKEN_KEYS.ACCESS)?.value;

  if (isProtectedRoute(pathname) && !token) {
    const loginUrl = new URL(AUTH_ROUTES.LOGIN, req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicRoute(pathname) && token && pathname === AUTH_ROUTES.LOGIN) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
