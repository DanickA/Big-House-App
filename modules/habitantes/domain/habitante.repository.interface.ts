import { Habitante, HabitanteSelectorItem, HabitanteListItem, RolUsuario } from './habitante.entity';

export interface CreateHabitanteData {
  nombre: string;
  email: string;
  password_hash: string;
  pin_hash?: string | null;
  pin_longitud?: number | null;
  rol?: RolUsuario;
  token_version?: number;
  activo?: boolean;
}

export interface UpdateHabitanteData {
  nombre?: string;
  email?: string;
  password_hash?: string;
  pin_hash?: string | null;
  pin_longitud?: number | null;
  rol?: RolUsuario;
  token_version?: number;
  activo?: boolean;
  incrementTokenVersion?: boolean;
}

export interface IHabitanteRepository {
  findById(id: string): Promise<Habitante | null>;
  findByEmail(email: string): Promise<Habitante | null>;
  findAll(): Promise<Habitante[]>;
  count(): Promise<number>;
  findForSelector(): Promise<HabitanteSelectorItem[]>;
  findAllWithDetails(): Promise<HabitanteListItem[]>;
  create(data: CreateHabitanteData): Promise<Habitante>;
  update(id: string, data: UpdateHabitanteData): Promise<Habitante>;
  delete(id: string): Promise<void>;
}
