import { Servicio, ServicioConEstado, ResumenServicios } from './servicio.entity';

export interface CreateServicioData {
  nombre_servicio: string;
  monto: number;
  fecha_vencimiento: Date;
  periodicidad_meses?: number;
  dia_vencimiento?: number | null;
  numero_cuenta?: string | null;
  numero_factura?: string | null;
  responsable_id?: string | null;
  estado?: string;
}

export interface UpdateServicioData {
  nombre_servicio?: string;
  monto?: number;
  fecha_vencimiento?: Date;
  periodicidad_meses?: number;
  dia_vencimiento?: number | null;
  numero_cuenta?: string | null;
  numero_factura?: string | null;
  responsable_id?: string | null;
  estado?: string;
}

export interface IServicioRepository {
  findById(id: string): Promise<Servicio | null>;
  findAndLockById(id: string): Promise<Servicio | null>;
  findServiciosConEstado(periodoMes?: string): Promise<{
    servicios: ServicioConEstado[];
    resumen: ResumenServicios;
  }>;
  create(data: CreateServicioData): Promise<Servicio>;
  update(id: string, data: UpdateServicioData): Promise<Servicio>;
  delete(id: string): Promise<void>;
}
