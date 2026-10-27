import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getOAuth2Client, GOOGLE_CALENDAR_SCOPES } from '@/lib/google-auth';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const oauth2Client = getOAuth2Client();

    // 1. Generar state criptográfico aleatorio contra CSRF
    const state = crypto.randomBytes(32).toString('hex');

    // 2. Generar PKCE verifier y challenge (S256)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // 3. Guardar state y verifier en cookie segura httpOnly (10 minutos)
    const cookieStore = await cookies();
    cookieStore.set(
      'oauth_google_state',
      JSON.stringify({
        state,
        codeVerifier,
        userId: session.userId,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 10 * 60, // 10 minutos
      }
    );

    // 4. Generar URL de consentimiento con PKCE
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_CALENDAR_SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256' as any,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error al iniciar flujo OAuth de Google:', error);
    return NextResponse.redirect(new URL('/calendario?error=google_auth_init_failed', req.url));
  }
}
