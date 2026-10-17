export interface AporteFondoComun {
  id: string;
  usuario_id: string;
  usuario?: {
    id: string;
    nombre: string;
  } | null;
  monto: number;
  fecha: string; // ISO string
  periodo_mes: string; // YYYY-MM
  descripcion: string;
  comprobante_url: string | null;
}

export interface ResumenHabitanteFondo {
  usuario_id: string;
  nombre: string;
  totalAportado: number;
  cantidadAportes: number;
  ultimoAporte: AporteFondoComun | null;
}

export interface ResumenFondoComunMes {
  periodoMes: string; // YYYY-MM
  presupuestoMesRecaudado: number; // Suma de todos los aportes del mes
  aportes: AporteFondoComun[];
  porHabitante: ResumenHabitanteFondo[];
}
