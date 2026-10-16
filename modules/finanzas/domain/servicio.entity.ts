export type EstadoVencimiento = 'VENCIDO' | 'POR_VENCER' | 'AL_DIA' | 'PAGADO';

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
}

export interface UltimoPagoDTO {
  fecha_pago: string;
  monto_pagado: number;
  comprobante_url: string | null;
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
  diasRestantes: number;
  estadoVencimiento: EstadoVencimiento;
  ultimoPago?: UltimoPagoDTO | null;
}

export interface ResumenServicios {
  totalServicios: number;
  totalPresupuestoMensual: number;
  totalProximosVencimientos: number;
  cuentasVencidas: number;
  cuentasPorVencer: number;
  cuentasAlDia: number;
}
