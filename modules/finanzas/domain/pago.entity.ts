export interface PagoServicio {
  id: string;
  servicio_id: string;
  usuario_id: string;
  monto_pagado: number;
  fecha_pago: Date | null;
  comprobante_url: string | null;
  observaciones: string | null;
}

export interface PagoHistorialItem {
  id: string;
  monto_pagado: number;
  fecha_pago: string; // ISO
  comprobante_url: string | null;
  observaciones: string | null;
  usuario: {
    nombre: string;
    email: string;
  };
}
