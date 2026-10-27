import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes recomendados para GCM
const PREFIX = 'enc:v1:';

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.AUTH_SECRET || 'bighouse-fallback-secret-key-32b-min';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Cifra un texto sensible (como tokens OAuth) usando AES-256-GCM.
 * Si ya está cifrado o está vacío, lo devuelve directamente.
 */
export function encryptToken(text?: string | null): string {
  if (!text) return '';
  if (text.startsWith(PREFIX)) return text;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(text, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${PREFIX}${iv.toString('hex')}:${authTag}:${ciphertext}`;
}

/**
 * Descifra un texto previamente cifrado con AES-256-GCM.
 * Si el texto no tiene el prefijo de cifrado, asume que es un token plano heredado
 * y lo devuelve directamente para mantener compatibilidad hacia atrás.
 */
export function decryptToken(encryptedText?: string | null): string {
  if (!encryptedText) return '';
  if (!encryptedText.startsWith(PREFIX)) {
    // Compatibilidad con registros antiguos en texto plano
    return encryptedText;
  }

  try {
    const parts = encryptedText.slice(PREFIX.length).split(':');
    if (parts.length !== 3) {
      return encryptedText;
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Crypto] Error al descifrar token:', error);
    return '';
  }
}
