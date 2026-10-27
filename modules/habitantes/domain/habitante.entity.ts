export type RolUsuario = 'ADMIN' | 'MIEMBRO';

export interface Habitante {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  pin_hash: string | null;
  pin_longitud: number | null;
  rol: RolUsuario;
  token_version: number;
  activo: boolean;
  fecha_registro: Date | null;
}

export interface HabitanteSelectorItem {
  id: string;
  nombre: string;
  email?: string;
  tienePin: boolean;
  pinLongitud: number;
}

export interface HabitanteListItem {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  tienePin: boolean;
  pinLongitud: number;
  fecha_registro: Date | null;
}
