export interface Planta {
  id: string;
  nombre_comun: string;
  especie: string | null;
  ubicacion: string;
  foto_url: string | null;
}

export interface PlantaConEstado extends Planta {
  diasRestantes: number | null;
  frecuencia_dias: number;
  requiereRiego: boolean;
}

export interface TareaCuidado {
  id: string;
  planta_id: string;
  tipo_tarea: string;
  frecuencia_dias: number;
  proxima_fecha: Date;
}

export interface HistorialCuidado {
  id: string;
  tarea_id: string;
  usuario_id: string;
  fecha_realizada: Date | null;
  observaciones: string | null;
  usuarios?: { nombre: string } | null;
  tareas_cuidado?: { tipo_tarea: string; frecuencia_dias?: number; planta_id?: string } | null;
}
