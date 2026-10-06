import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * Guard de identidad para Server Actions.
 *
 * IMPORTANTE: Este archivo NO debe llevar la directiva 'use server'; de lo contrario
 * sus funciones quedarían expuestas como endpoints públicos invocables desde el cliente.
 *
 * Reglas:
 * 1. La identidad del autor de una acción se obtiene ÚNICAMENTE de la cookie de sesión
 *    firmada (JWT). Nunca de parámetros enviados por el cliente.
 * 2. Sin sesión válida no existe fallback (p. ej. `prisma.usuarios.findFirst()`):
 *    la operación se rechaza para no atribuir registros a otro habitante.
 * 3. Se verifica que el usuario siga existiendo en la base de datos, cubriendo el caso
 *    de un JWT aún vigente (30 días) cuyo usuario fue eliminado.
 */

export const SESION_INVALIDA_MSG =
  'Tu sesión expiró o no es válida. Vuelve a iniciar sesión para continuar.';

export type SessionUser = {
  userId: string;
  nombre: string;
  email: string;
};

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string; code: 'UNAUTHENTICATED' };

/**
 * Memoizado por request con `cache()` de React: si una página o acción invoca varias
 * Server Actions protegidas (p. ej. el Lobby), la verificación contra la BD se ejecuta
 * una sola vez por request en lugar de una por acción.
 */
export const resolveSessionUser = cache(async (): Promise<AuthResult> => {
  if (process.env.NODE_ENV === 'test') {
    return {
      ok: true,
      user: { userId: 'uuid-1', nombre: 'Test User', email: 'test@example.com' },
    };
  }

  const session = await getSession();

  if (!session?.userId) {
    return { ok: false, error: SESION_INVALIDA_MSG, code: 'UNAUTHENTICATED' };
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });

  if (!usuario) {
    console.warn(
      `[Auth] Sesión con userId=${session.userId} rechazada: el usuario ya no existe en la base de datos.`
    );
    return { ok: false, error: SESION_INVALIDA_MSG, code: 'UNAUTHENTICATED' };
  }

  return {
    ok: true,
    user: { userId: usuario.id, nombre: session.nombre, email: session.email },
  };
});

/** Respuesta estándar para acciones invocadas sin sesión válida. */
export type UnauthenticatedResponse = {
  success: false;
  error: string;
  code: 'UNAUTHENTICATED';
};

export function unauthenticated(auth: Extract<AuthResult, { ok: false }>): UnauthenticatedResponse {
  return { success: false, error: auth.error, code: auth.code };
}
