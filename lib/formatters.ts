/**
 * Utilidades universales de formateo para BigHouseApp.
 * Cumple con los estándares de Apple Design y blindaje Break-UI.
 */

/**
 * Helper universal de pluralización en español.
 * Garantiza estrictamente:
 * - 0 -> "0 {plural}"
 * - 1 -> "1 {singular}"
 * - N -> "N {plural}"
 * - Cero ocurrencias de "1 miembros" o "1 servicios".
 */
export function formatPlural(
  count: number,
  singular: string,
  plural: string
): string {
  const safeCount = Number.isFinite(count) ? count : 0;
  const isSingular = safeCount === 1;
  return `${safeCount} ${isSingular ? singular : plural}`;
}

/** Formateador específico para conteo de habitantes/miembros */
export function formatMiembros(count: number): string {
  return formatPlural(count, 'miembro', 'miembros');
}

/** Formateador específico para conteo de servicios */
export function formatServicios(count: number): string {
  return formatPlural(count, 'servicio', 'servicios');
}

/** Formateador específico para conteo de aportes */
export function formatAportes(count: number): string {
  return formatPlural(count, 'aporte', 'aportes');
}

/** Formateador específico para conteo de días */
export function formatDias(count: number): string {
  return formatPlural(count, 'día', 'días');
}

/** Formateador específico para conteo de alertas */
export function formatAlertas(count: number): string {
  return formatPlural(count, 'alerta', 'alertas');
}

/** Formateador específico para conteo de eventos */
export function formatEventos(count: number): string {
  return formatPlural(count, 'evento', 'eventos');
}

/** Formateador específico para conteo de plantas */
export function formatPlantas(count: number): string {
  return formatPlural(count, 'planta', 'plantas');
}

/** Alias canónico para compatibilidad total con código existente */
export const formatMemberCount = formatMiembros;

/**
 * Formateador de moneda colombiana (COP) con formato tabular oficial.
 */
export function formatCOP(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

/**
 * Formateador compacto de moneda colombiana (ej. "$ 1,2 M" o "$ 500 mil").
 */
export function formatCOPCompact(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(safeAmount);
}

/**
 * Extractor seguro de iniciales para avatares (estándares Break-UI).
 * Protege contra:
 * - Nombres vacíos o undefined ("??")
 * - Prefijos de emojis sin romper caracteres Unicode (surrogate pairs)
 * - Nombres de una sola palabra (primeros 2 caracteres)
 * - Nombres compuestos (inicial de primer y último nombre)
 */
export function getSafeInitials(name: string): string {
  if (!name || typeof name !== 'string') return '??';
  const cleanName = name.replace(/^[\p{Emoji}\s]+/u, '').trim();
  if (!cleanName) {
    const codePoints = Array.from(name.trim());
    return codePoints.length > 0 ? codePoints[0].toUpperCase() : '??';
  }

  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const singleCodePoints = Array.from(parts[0]);
    return singleCodePoints.slice(0, 2).join('').toUpperCase();
  }
  const first = Array.from(parts[0])[0] || '';
  const last = Array.from(parts[parts.length - 1])[0] || '';
  return (first + last).toUpperCase();
}

