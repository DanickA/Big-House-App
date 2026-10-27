/**
 * Calcula la próxima fecha de vencimiento después de registrar un pago.
 * Regla de negocio:
 * 1. Fecha base: Tomamos la fecha del pago realizado (o fecha actual).
 * 2. Avance del ciclo: Sumamos la cantidad de periodicidadMeses.
 * 3. Ajuste de corte: Si el servicio tiene un diaVencimiento fijado, se fija ese día
 *    específico en el mes resultante (protegiendo meses más cortos como febrero o meses de 30 días).
 */
export function calcularProximaFechaVencimientoPura(
  fechaPago: Date,
  periodicidadMeses: number = 1,
  diaVencimiento?: number | null
): Date {
  const meses = Math.max(1, periodicidadMeses || 1);
  const base = new Date(fechaPago);
  base.setHours(0, 0, 0, 0);

  const targetYear = base.getFullYear();
  const targetMonth = base.getMonth() + meses;

  // Si tiene un día de vencimiento asignado, usarlo; de lo contrario el día de la fecha de pago
  const diaDeseado =
    diaVencimiento && diaVencimiento >= 1 && diaVencimiento <= 31
      ? diaVencimiento
      : base.getDate();

  // Obtener el último día del mes destino para evitar desbordamientos
  const ultimoDiaMesDestino = new Date(targetYear, targetMonth + 1, 0).getDate();
  const diaFinal = Math.min(diaDeseado, ultimoDiaMesDestino);

  return new Date(targetYear, targetMonth, diaFinal);
}

/**
 * Redondea montos monetarios a 2 decimales evitando errores de punto flotante IEEE 754 (F-21).
 */
export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Parsea una fecha 'YYYY-MM-DD' en medianoche de hora local (00:00:00) sin desplazamiento UTC (F-06, F-22).
 */
export function parseLocalDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return new Date(
      dateInput.getFullYear(),
      dateInput.getMonth(),
      dateInput.getDate(),
      0,
      0,
      0,
      0
    );
  }
  const trimmed = dateInput.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return new Date(NaN);
  }
  return parsed;
}

/**
 * Proyecta una fecha recurrente anual al año objetivo manejando años bisiestos (29 Feb -> 28 Feb) (F-06).
 */
export function projectAnnualDate(originalDate: Date, targetYear: number): Date {
  const origMonth = originalDate.getMonth();
  const origDay = originalDate.getDate();
  const maxDaysInMonth = new Date(targetYear, origMonth + 1, 0).getDate();
  const clampedDay = Math.min(origDay, maxDaysInMonth);
  return new Date(
    targetYear,
    origMonth,
    clampedDay,
    originalDate.getHours(),
    originalDate.getMinutes(),
    originalDate.getSeconds(),
    originalDate.getMilliseconds()
  );
}

/**
 * Proyecta una fecha recurrente mensual al año y mes (0-11) objetivo ajustando fin de mes (31 -> 28/29/30) (F-04).
 */
export function projectMonthlyDate(
  originalDate: Date,
  targetYear: number,
  targetMonthIndex: number
): Date {
  const origDay = originalDate.getDate();
  const maxDaysInMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
  const clampedDay = Math.min(origDay, maxDaysInMonth);
  return new Date(
    targetYear,
    targetMonthIndex,
    clampedDay,
    originalDate.getHours(),
    originalDate.getMinutes(),
    originalDate.getSeconds(),
    originalDate.getMilliseconds()
  );
}

/**
 * Normaliza una fecha o string a su representación calendario 'YYYY-MM-DD' sin desfase por zona horaria (F-01).
 */
export function toCalendarYMD(dateInput: string | Date): string {
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  if (dateInput instanceof Date) {
    // Si la fecha fue creada como medianoche UTC pura (00:00:00.000Z), usar sus componentes UTC
    if (
      dateInput.getUTCHours() === 0 &&
      dateInput.getUTCMinutes() === 0 &&
      dateInput.getUTCSeconds() === 0 &&
      dateInput.getUTCMilliseconds() === 0
    ) {
      const year = dateInput.getUTCFullYear();
      const month = String(dateInput.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  const d = parseLocalDate(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

