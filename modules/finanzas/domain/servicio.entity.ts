export type EstadoVencimiento = 'VENCIDO' | 'POR_VENCER' | 'AL_DIA' | 'PAGADO';

export interface ResponsableServicioDTO {
  id: string;
  nombre: string;
}

export interface Servicio {
  id: string;
  nombre_servicio: string;
  numero_cuenta: string | null;
  numero_factura: string | null;
  monto: number;
  fecha_vencimiento: Date;
  estado: string;
  periodicidad_meses: number;
  dia_vencimiento: number | null;
  responsable_id?: string | null;
  responsable?: ResponsableServicioDTO | null;
}

export interface UltimoPagoDTO {
  id?: string;
  fecha_pago: string;
  monto_pagado: number;
  monto_presupuestado?: number | null;
  diferencia_presupuesto?: number;
  comprobante_url: string | null;
  observaciones?: string | null;
  pagado_por?: string;
}

export interface ServicioConEstado {
  id: string;
  nombre_servicio: string;
  numero_cuenta: string | null;
  numero_factura: string | null;
  monto: number;
  fecha_vencimiento: string; // ISO string
  estado: string;
  periodicidad_meses: number;
  dia_vencimiento: number | null;
  responsable_id?: string | null;
  responsable?: ResponsableServicioDTO | null;
  diasRestantes: number;
  enMora?: boolean;
  diasEnMora?: number;
  estadoVencimiento: EstadoVencimiento;
  ultimoPago?: UltimoPagoDTO | null;
  pagadoEnMesConsultado?: boolean;
  pagoMesConsultado?: UltimoPagoDTO | null;
  diferenciaPresupuestoMes?: number | null;
}

export interface ResumenServicios {
  totalServicios: number;
  totalPresupuestoMensual: number;
  totalProximosVencimientos: number;
  cuentasVencidas: number;
  cuentasPorVencer: number;
  cuentasAlDia: number;
  totalRealPagadoMes?: number;
  totalPorPagarMes?: number;
  diferenciaPresupuestoGlobal?: number;
}
