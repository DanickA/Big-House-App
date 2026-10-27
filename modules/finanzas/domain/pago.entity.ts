export interface PagoServicio {
  id: string;
  servicio_id: string;
  usuario_id: string;
  monto_pagado: number;
  monto_presupuestado?: number | null;
  fecha_pago: Date | null;
  comprobante_url: string | null;
  observaciones: string | null;
}

export interface PagoHistorialItem {
  id: string;
  monto_pagado: number;
  monto_presupuestado?: number | null;
  diferencia_presupuesto?: number;
  fecha_pago: string; // ISO
  comprobante_url: string | null;
  observaciones: string | null;
  usuario: {
    nombre: string;
    email: string;
  };
}

export type CategoriaGastoHogar =
  | 'SERVICIOS'
  | 'MERCADO'
  | 'ASEO'
  | 'MANTENIMIENTO'
  | 'MASCOTAS'
  | 'OTROS';

export interface GastoHogar {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string; // ISO
  categoria: string;
  usuario_id: string;
  servicio_id?: string | null;
  usuario?: {
    id: string;
    nombre: string;
  } | null;
}
