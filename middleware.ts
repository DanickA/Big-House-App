import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.SESSION_SECRET || 'bighouseapp_secret_key_super_segura_para_hogar_app_2026';
const key = new TextEncoder().encode(SECRET_KEY);

const PUBLIC_PATHS = ['/login', '/register', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir archivos estáticos e imágenes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('hogar_session')?.value;

  let isValidSession = false;
  if (sessionCookie) {
    try {
      await jwtVerify(sessionCookie, key, { algorithms: ['HS256'] });
      isValidSession = true;
    } catch {
      isValidSession = false;
    }
  }

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // Si no está autenticado y la ruta es protegida -> Redirigir a /login
  if (!isValidSession && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
