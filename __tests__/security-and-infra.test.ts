import { encryptToken, decryptToken } from '@/lib/crypto';
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearLoginRateLimit,
} from '@/lib/rate-limit';
import { toActionResponse, UnexpectedError, ConcurrencyError } from '@/modules/shared';

describe('Phase 4 & 5 - Seguridad en Reposo, Rate Limiting y Sanitización de Errores (S-05, S-08, Q-01, Q-07)', () => {
  describe('Cifrado AES-256-GCM en Reposo (S-05)', () => {
    it('cifra y descifra tokens OAuth preservando integridad con prefijo enc:v1:', () => {
      const rawToken = 'ya29.a0AfH6SMBx-secret-google-oauth-token';
      const encrypted = encryptToken(rawToken);

      expect(encrypted).not.toBe(rawToken);
      expect(encrypted.startsWith('enc:v1:')).toBe(true);
      expect(decryptToken(encrypted)).toBe(rawToken);
    });

    it('es idempotente si recibe un texto ya cifrado con enc:v1:', () => {
      const raw = '1//0g-refresh-token-secreto';
      const enc1 = encryptToken(raw);
      const enc2 = encryptToken(enc1);
      expect(enc2).toBe(enc1);
      expect(decryptToken(enc2)).toBe(raw);
    });
  });

  describe('Rate Limiting Anti Brute-Force en Login (S-08)', () => {
    const testKey = 'pin-test-user-brute';

    beforeEach(() => {
      clearLoginRateLimit(testKey);
    });

    it('permite hasta 4 intentos fallidos y bloquea en el 5to intento por 15 minutos', () => {
      expect(checkLoginRateLimit(testKey).allowed).toBe(true);

      for (let i = 0; i < 4; i++) {
        recordFailedLoginAttempt(testKey);
        expect(checkLoginRateLimit(testKey).allowed).toBe(true);
      }

      // 5to intento fallido dispara bloqueo
      recordFailedLoginAttempt(testKey);
      const status = checkLoginRateLimit(testKey);
      expect(status.allowed).toBe(false);
      expect(status.lockoutRemainingSeconds).toBeGreaterThan(0);

      // Al limpiar tras login exitoso, vuelve a permitir
      clearLoginRateLimit(testKey);
      expect(checkLoginRateLimit(testKey).allowed).toBe(true);
    });
  });

  describe('Sanitización de Errores Internos en toActionResponse (Q-07)', () => {
    it('oculta detalles internos (original, stack, cause) al serializar hacia el cliente', () => {
      const errResult = {
        success: false as const,
        error: new UnexpectedError('No se pudo actualizar el servicio', {
          original: 'PrismaClientKnownRequestError: Invalid prisma.servicios.update() invocation',
          stack: 'Error at Prisma...',
        }),
      };

      const actionRes = toActionResponse(errResult);
      expect(actionRes.success).toBe(false);
      if (!actionRes.success) {
        expect(actionRes.error).toBe('No se pudo actualizar el servicio');
        expect((actionRes as Record<string, unknown>).original).toBeUndefined();
        expect((actionRes as Record<string, unknown>).stack).toBeUndefined();
      }
    });

    it('preserva metadatos seguros de dominio (ej. proximoVencimiento en ConcurrencyError)', () => {
      const errResult = {
        success: false as const,
        error: new ConcurrencyError('Ciclo desactualizado', {
          proximoVencimiento: '2026-11-15T00:00:00.000Z',
          estado: 'PENDIENTE',
        }),
      };

      const actionRes = toActionResponse(errResult);
      expect(actionRes.success).toBe(false);
      if (!actionRes.success) {
        expect((actionRes as Record<string, unknown>).proximoVencimiento).toBe(
          '2026-11-15T00:00:00.000Z'
        );
      }
    });
  });
});
