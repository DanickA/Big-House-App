/**
 * Obtiene la clave secreta criptográfica para firmar y verificar tokens de sesión JWT.
 * 
 * Estrategia de resolución unificada:
 * 1. Prioriza SESSION_SECRET (convención del backend).
 * 2. Soporta JWT_SECRET (convención documentada en .env.example).
 * 3. En producción: Lanza un error explícito si ninguna variable está definida, impidiendo
 *    la falsificación de sesiones mediante secretos hardcodeados en el repositorio público.
 * 4. En desarrollo/test: Utiliza una clave local y emite una advertencia de seguridad.
 */
export function getAuthSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[Seguridad Crítica] Error de configuración: Ni SESSION_SECRET ni JWT_SECRET están definidos en el entorno de producción. ' +
        'Configura una clave criptográfica segura (ej. openssl rand -base64 32) para proteger las sesiones de los usuarios.'
      );
    }

    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[Seguridad] ADVERTENCIA: Ni SESSION_SECRET ni JWT_SECRET están definidos. Usando clave de desarrollo temporal no apta para producción.'
      );
    }

    return new TextEncoder().encode('bighouseapp_development_only_secret_key_2026');
  }

  return new TextEncoder().encode(secret);
}
