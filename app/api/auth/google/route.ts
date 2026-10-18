import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, GOOGLE_CALENDAR_SCOPES } from '@/lib/google-auth';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const oauth2Client = getOAuth2Client();

    // Generar URL de consentimiento con access_type=offline y prompt=consent para asegurar refresh_token
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_CALENDAR_SCOPES,
      state: session.userId,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error al iniciar flujo OAuth de Google:', error);
    return NextResponse.redirect(new URL('/calendario?error=google_auth_init_failed', req.url));
  }
}
