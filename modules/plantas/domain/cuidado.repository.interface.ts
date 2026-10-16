import { TareaCuidado, HistorialCuidado } from './planta.entity';

export interface ICuidadoRepository {
  findTarea(plantaId: string, tipoTarea: string): Promise<TareaCuidado | null>;
  createTarea(plantaId: string, tipoTarea: string, frecuenciaDias: number, proximaFecha: Date): Promise<TareaCuidado>;
  updateTareaProximaFecha(tareaId: string, nuevaFecha: Date, frecuenciaDias?: number): Promise<void>;
  createHistorial(tareaId: string, usuarioId: string, observaciones?: string | null): Promise<HistorialCuidado>;
  findHistorialByPlanta(plantaId: string): Promise<HistorialCuidado[]>;
  findHistorialById(historialId: string): Promise<HistorialCuidado | null>;
  findUltimoCuidadoAnterior(tareaId: string, excludeHistorialId: string): Promise<HistorialCuidado | null>;
  deshacerCuidado(historialId: string, tareaId: string, nuevaProximaFecha: Date): Promise<void>;
}
