import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOAuth2Client } from '@/lib/google-auth';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { encryptToken } from '@/lib/crypto';
import { sincronizarEventosGoogle } from '@/actions/google-calendar';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const stateParam = searchParams.get('state');

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const cookieStore = await cookies();

  if (errorParam || !code || !stateParam) {
    console.warn('OAuth cancelado o faltan parámetros requeridos:', {
      errorParam,
      codePresent: !!code,
      statePresent: !!stateParam,
    });
    return NextResponse.redirect(new URL('/calendario?google_sync=cancelled', appBaseUrl));
  }

  try {
    // 1. Validar sesión del usuario
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.redirect(new URL('/login', appBaseUrl));
    }

    // 2. Verificar state criptográfico y PKCE en la cookie
    const stateCookie = cookieStore.get('oauth_google_state')?.value;
    if (!stateCookie) {
      console.warn('[OAuth] Cookie de state inexistente o expirada.');
      return NextResponse.redirect(new URL('/calendario?google_sync=state_expired', appBaseUrl));
    }

    let cookieData: { state: string; codeVerifier: string; userId: string };
    try {
      cookieData = JSON.parse(stateCookie);
    } catch {
      return NextResponse.redirect(new URL('/calendario?google_sync=state_corrupt', appBaseUrl));
    }

    if (cookieData.state !== stateParam || cookieData.userId !== session.userId) {
      console.warn('[OAuth] Fallo de validación CSRF en state o userId.');
      return NextResponse.redirect(new URL('/calendario?google_sync=csrf_detected', appBaseUrl));
    }

    // Limpiar cookie de state inmediatamente tras su uso
    cookieStore.delete('oauth_google_state');

    // 3. Intercambiar código por tokens utilizando el codeVerifier de PKCE
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken({
      code,
      codeVerifier: cookieData.codeVerifier,
    });

    if (!tokens.access_token) {
      throw new Error('Google no devolvió un access_token válido');
    }

    // Corrección de cálculo: expiry_date ya es timestamp absoluto en ms
    const tokenExpira = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    // Cifrar tokens en reposo con AES-256-GCM
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined;

    // 4. Guardar conexión cifrada en BD
    await prisma.conexiones_google.upsert({
      where: { usuario_id: session.userId },
      update: {
        access_token: encryptedAccessToken,
        ...(encryptedRefreshToken ? { refresh_token: encryptedRefreshToken } : {}),
        token_expira: tokenExpira,
      },
      create: {
        usuario_id: session.userId,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken || '',
        token_expira: tokenExpira,
        calendar_id: 'primary',
      },
    });

    // 5. Ejecutar primera sincronización inicial
    try {
      await sincronizarEventosGoogle(session.userId);
    } catch (syncErr) {
      console.error('Primera sincronización falló pero la conexión se guardó:', syncErr);
    }

    return NextResponse.redirect(new URL('/calendario?google_sync=success', appBaseUrl));
  } catch (error) {
    console.error('Error procesando callback OAuth de Google:', error);
    return NextResponse.redirect(new URL('/calendario?google_sync=error', appBaseUrl));
  }
}
