import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type SessionPayload = {
  userId: string;
  nombre: string;
  email: string;
};

const SECRET_KEY = process.env.SESSION_SECRET || 'bighouseapp_secret_key_super_segura_para_hogar_app_2026';
const key = new TextEncoder().encode(SECRET_KEY);

const COOKIE_NAME = 'hogar_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 días en ms

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, nombre: string, email: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const sessionToken = await encryptSession({ userId, nombre, email });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  return { success: true };
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await decryptSession(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return { success: true };
}
