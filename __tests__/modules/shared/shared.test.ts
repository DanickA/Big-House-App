import {
  ok,
  err,
  isOk,
  isErr,
  ValidationError,
  NotFoundError,
  ConcurrencyError,
  toActionResponse,
  calcularProximaFechaVencimientoPura,
} from '@/modules/shared';

describe('Shared Module - Clean Architecture Primitives', () => {
  describe('Result Type', () => {
    it('debe crear un resultado exitoso con ok()', () => {
      const result = ok({ id: '123', nombre: 'Test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123', nombre: 'Test' });
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
    });

    it('debe crear un resultado fallido con err()', () => {
      const error = new NotFoundError('Recurso no encontrado');
      const result = err(error);
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(isOk(result)).toBe(false);
      expect(isErr(result)).toBe(true);
    });
  });

  describe('Error Hierarchy & Action Response', () => {
    it('debe serializar un resultado exitoso a ActionResponse', () => {
      const result = ok({ total: 100 });
      const response = toActionResponse(result);
      expect(response).toEqual({
        success: true,
        data: { total: 100 },
      });
    });

    it('debe serializar un ValidationError con su código a ActionResponse', () => {
      const error = new ValidationError('Datos inválidos');
      const response = toActionResponse(err(error));
      expect(response).toEqual({
        success: false,
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
      });
    });

    it('debe serializar un ConcurrencyError preservando metadatos', () => {
      const error = new ConcurrencyError('Conflicto de concurrencia', {
        proximoVencimiento: '2026-11-01T00:00:00.000Z',
        estado: 'PAGADO',
      });
      const response = toActionResponse(err(error));
      expect(response).toEqual({
        success: false,
        error: 'Conflicto de concurrencia',
        code: 'CONCURRENCY_CYCLE_MISMATCH',
        proximoVencimiento: '2026-11-01T00:00:00.000Z',
        estado: 'PAGADO',
      });
    });
  });

  describe('Cálculo de Próxima Fecha de Vencimiento', () => {
    it('debe sumar un mes manteniendo el día de corte deseado', () => {
      const fechaPago = new Date(2026, 9, 15); // 15 de Octubre 2026
      const proxima = calcularProximaFechaVencimientoPura(fechaPago, 1, 20);
      expect(proxima.getFullYear()).toBe(2026);
      expect(proxima.getMonth()).toBe(10); // Noviembre
      expect(proxima.getDate()).toBe(20);
    });

    it('debe ajustar al último día del mes en meses más cortos (ej. Febrero)', () => {
      const fechaPago = new Date(2026, 0, 15); // 15 de Enero 2026
      const proxima = calcularProximaFechaVencimientoPura(fechaPago, 1, 31);
      expect(proxima.getFullYear()).toBe(2026);
      expect(proxima.getMonth()).toBe(1); // Febrero
      expect(proxima.getDate()).toBe(28); // 2026 no es bisiesto
    });
  });
});
