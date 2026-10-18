import { Planta, PlantaConEstado } from './planta.entity';

export interface CreatePlantaData {
  nombre_comun: string;
  ubicacion: string;
  especie?: string | null;
  foto_url?: string | null;
  frecuencia_dias: number;
  nivel_luz?: string | null;
  nivel_agua?: string | null;
  estado_salud?: string | null;
  notas_cuidado?: string | null;
}

export interface UpdatePlantaData {
  nombre_comun?: string;
  ubicacion?: string;
  especie?: string | null;
  foto_url?: string | null;
  nivel_luz?: string | null;
  nivel_agua?: string | null;
  estado_salud?: string | null;
  notas_cuidado?: string | null;
}

export interface IPlantaRepository {
  findById(id: string): Promise<Planta | null>;
  findAllWithStatus(): Promise<PlantaConEstado[]>;
  create(data: CreatePlantaData): Promise<Planta>;
  update(id: string, data: UpdatePlantaData): Promise<Planta>;
  delete(id: string): Promise<void>;
}
