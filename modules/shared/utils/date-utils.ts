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
