import { AporteFondoComun } from './aporte-fondo.entity';

export interface CreateAporteFondoData {
  usuario_id: string;
  monto: number;
  fecha: Date;
  descripcion: string;
  comprobante_url?: string | null;
}

export interface IAporteFondoRepository {
  findByMonth(year: number, month: number): Promise<AporteFondoComun[]>;
  create(data: CreateAporteFondoData): Promise<AporteFondoComun>;
  delete(id: string): Promise<void>;
}
