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
 * 2. Sin sesión válida no existe fallback:
 *    la operación se rechaza para no atribuir registros a otro habitante.
 * 3. Se verifica que el usuario siga existiendo en la base de datos, cubriendo el caso
 *    de un JWT aún vigente cuyo usuario fue eliminado.
 */

export const SESION_INVALIDA_MSG =
  'Tu sesión expiró o no es válida. Vuelve a iniciar sesión para continuar.';

export type SessionUser = {
  userId: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'MIEMBRO';
};

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string; code: 'UNAUTHENTICATED' | 'FORBIDDEN' };

/**
 * Memoizado por request con `cache()` de React: si una página o acción invoca varias
 * Server Actions protegidas (p. ej. el Lobby), la verificación contra la BD se ejecuta
 * una sola vez por request en lugar de una por acción.
 */
export const resolveSessionUser = cache(async (): Promise<AuthResult> => {
  const session = await getSession();

  if (!session?.userId) {
    return { ok: false, error: SESION_INVALIDA_MSG, code: 'UNAUTHENTICATED' };
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { id: session.userId },
    select: { id: true, rol: true, token_version: true, activo: true },
  });

  if (!usuario || !usuario.activo) {
    console.warn(
      `[Auth] Sesión con userId=${session.userId} rechazada: usuario inexistente o inactivo.`
    );
    return { ok: false, error: SESION_INVALIDA_MSG, code: 'UNAUTHENTICATED' };
  }

  if (
    typeof session.tokenVersion === 'number' &&
    usuario.token_version !== session.tokenVersion
  ) {
    console.warn(
      `[Auth] Sesión con userId=${session.userId} rechazada: token_version no coincide (sesión revocada).`
    );
    return { ok: false, error: SESION_INVALIDA_MSG, code: 'UNAUTHENTICATED' };
  }

  return {
    ok: true,
    user: {
      userId: usuario.id,
      nombre: session.nombre,
      email: session.email,
      rol: (usuario.rol as 'ADMIN' | 'MIEMBRO') || session.rol || 'MIEMBRO',
    },
  };
});

/** Respuesta estándar para acciones invocadas sin sesión válida. */
export type UnauthenticatedResponse = {
  success: false;
  error: string;
  code: 'UNAUTHENTICATED' | 'FORBIDDEN';
  data?: never;
};

export type ForbiddenResponse = {
  success: false;
  error: string;
  code: 'FORBIDDEN';
  data?: never;
};

export function unauthenticated(auth: Extract<AuthResult, { ok: false }>): UnauthenticatedResponse {
  return { success: false, error: auth.error, code: auth.code };
}

export function forbidden(
  error: string = 'No tienes permisos de administrador para realizar esta acción.'
): ForbiddenResponse {
  return { success: false, error, code: 'FORBIDDEN' };
}
