import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-auth';
import { prisma } from '@/lib/prisma';
import { sincronizarEventosGoogle } from '@/actions/google-calendar';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const usuarioId = searchParams.get('state');

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (errorParam || !code || !usuarioId) {
    console.warn('OAuth cancelado o fallido:', { errorParam, codePresent: !!code, usuarioIdPresent: !!usuarioId });
    return NextResponse.redirect(new URL('/calendario?google_sync=cancelled', appBaseUrl));
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('Google no devolvió un access_token válido');
    }

    const tokenExpira = new Date(Date.now() + (tokens.expiry_date ?? 3600 * 1000));

    // Guardar o actualizar la conexión en la base de datos
    await prisma.conexiones_google.upsert({
      where: { usuario_id: usuarioId },
      update: {
        access_token: tokens.access_token,
        ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
        token_expira: tokenExpira,
      },
      create: {
        usuario_id: usuarioId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        token_expira: tokenExpira,
        calendar_id: 'primary',
      },
    });

    // Ejecutar primera sincronización
    try {
      await sincronizarEventosGoogle(usuarioId);
    } catch (syncErr) {
      console.error('Primera sincronización falló pero la conexión se guardó:', syncErr);
    }

    return NextResponse.redirect(new URL('/calendario?google_sync=success', appBaseUrl));
  } catch (error) {
    console.error('Error procesando callback OAuth de Google:', error);
    return NextResponse.redirect(new URL('/calendario?google_sync=error', appBaseUrl));
  }
}
