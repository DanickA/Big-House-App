import { ValidationError } from '../domain/errors';

const SAFE_ID_REGEX = /^[a-zA-Z0-9_.:-]{1,100}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Verifica que un identificador sea una cadena segura (UUID o ID sintético de test)
 * bloqueando vacíos, espacios, path traversal (..) o inyección SQL (F-08).
 */
export function isValidId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (!trimmed || trimmed.includes('..') || trimmed.includes('--')) return false;
  return SAFE_ID_REGEX.test(trimmed);
}

/**
 * Verifica formato UUID estricto (RFC 4122).
 */
export function isValidUuid(id: unknown): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

/**
 * Lanza ValidationError si el ID proporcionado es vacío o inválido (F-08).
 */
export function assertValidId(id: unknown, fieldLabel = 'Identificador'): string {
  if (!isValidId(id)) {
    throw new ValidationError(`${fieldLabel} inválido o malformado`);
  }
  return id.trim();
}
