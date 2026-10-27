import { PagoServicio, PagoHistorialItem, GastoHogar } from './pago.entity';

export interface CreatePagoData {
  servicio_id: string;
  usuario_id: string;
  monto_pagado: number;
  monto_presupuestado?: number | null;
  fecha_pago: Date;
  comprobante_url?: string | null;
  observaciones?: string | null;
}

export interface CreateGastoData {
  descripcion: string;
  monto: number;
  fecha: Date;
  categoria: string;
  usuario_id: string;
  servicio_id?: string | null;
}

export interface IPagoRepository {
  findRecentDuplicate(servicioId: string, monto: number, ventanaSegundos: number): Promise<boolean>;
  createPago(data: CreatePagoData): Promise<PagoServicio>;
  createGasto(data: CreateGastoData): Promise<void>;
  findHistorialByServicio(servicioId: string): Promise<PagoHistorialItem[]>;
  findGastosByMonth?(year: number, month: number): Promise<GastoHogar[]>;
  deleteGasto?(id: string): Promise<void>;
}
