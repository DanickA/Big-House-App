import { Planta, PlantaConEstado } from './planta.entity';

export interface CreatePlantaData {
  nombre_comun: string;
  ubicacion: string;
  especie?: string | null;
  foto_url?: string | null;
  frecuencia_dias: number;
}

export interface UpdatePlantaData {
  nombre_comun?: string;
  ubicacion?: string;
  especie?: string | null;
  foto_url?: string | null;
}

export interface IPlantaRepository {
  findById(id: string): Promise<Planta | null>;
  findAllWithStatus(): Promise<PlantaConEstado[]>;
  create(data: CreatePlantaData): Promise<Planta>;
  update(id: string, data: UpdatePlantaData): Promise<Planta>;
  delete(id: string): Promise<void>;
}
