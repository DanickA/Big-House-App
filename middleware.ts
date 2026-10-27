import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getAuthSecret } from '@/lib/auth-secret';

const PUBLIC_PATHS = ['/login', '/register', '/favicon.ico'];
const STATIC_FILE_REGEX = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|eot)$/i;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Bloquear prototipos y utilidades internas de red en producción
  if (isProduction) {
    if (pathname.startsWith('/prototype') || pathname.startsWith('/api/network-ip')) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // 2. Permitir archivos estáticos del framework o extensiones seguras
  if (
    pathname.startsWith('/_next') ||
    STATIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 3. Rutas API: permitir cron recordatorios (protegido con CRON_SECRET) y autenticación OAuth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 4. Verificar validez de la sesión JWT (soporta __Host- prefix en producción y cookie de desarrollo)
  const sessionCookie =
    request.cookies.get('__Host-hogar_session')?.value ||
    request.cookies.get('hogar_session')?.value;
  let isValidSession = false;

  if (sessionCookie) {
    try {
      const key = getAuthSecret();
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

  // Si está autenticado e intenta acceder a login o register -> Redirigir al home
  if (isValidSession && (pathname === '/login' || pathname === '/register')) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto internas de Next.js
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
