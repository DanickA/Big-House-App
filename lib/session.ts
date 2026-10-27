import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getAuthSecret } from './auth-secret';

export type SessionPayload = {
  userId: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'MIEMBRO';
  tokenVersion: number;
};

export const COOKIE_NAME =
  process.env.NODE_ENV === 'production' ? '__Host-hogar_session' : 'hogar_session';
export const LEGACY_COOKIE_NAME = 'hogar_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días en ms

export async function encryptSession(payload: SessionPayload): Promise<string> {
  const key = getAuthSecret();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const key = getAuthSecret();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  nombre: string,
  email: string,
  rol: 'ADMIN' | 'MIEMBRO' = 'MIEMBRO',
  tokenVersion: number = 1
) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const sessionToken = await encryptSession({ userId, nombre, email, rol, tokenVersion });
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Host-hogar_session' : 'hogar_session';

  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isProd,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  return { success: true };
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('__Host-hogar_session')?.value ||
    cookieStore.get(LEGACY_COOKIE_NAME)?.value;
  if (!token) return null;
  return await decryptSession(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('__Host-hogar_session');
  cookieStore.delete(LEGACY_COOKIE_NAME);
  return { success: true };
}
