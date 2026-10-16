export interface Habitante {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  pin_hash: string | null;
  pin_longitud: number | null;
  fecha_registro: Date | null;
}

export interface HabitanteSelectorItem {
  id: string;
  nombre: string;
  email: string;
  tienePin: boolean;
  pinLongitud: number;
}

export interface HabitanteListItem {
  id: string;
  nombre: string;
  email: string;
  tienePin: boolean;
  pinLongitud: number;
  fecha_registro: Date | null;
}
