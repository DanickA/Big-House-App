import { TipoPlantilla, CanalRecordatorio, EstadoEvento } from '@prisma/client';
export { TipoPlantilla, CanalRecordatorio, EstadoEvento };
import { EventoUnificado } from '@/actions/eventos';
import {
  Calendar as CalendarIcon,
  HeartHandshake,
  ListTodo,
  Stethoscope,
  ShoppingCart,
  LucideIcon,
} from 'lucide-react';

export interface EventoContextModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  eventosDelDia: EventoUnificado[];
  miembros: { id: string; nombre: string; email?: string }[];
  usuarioActualId?: string;
  modoInicial?: 'agenda' | 'formulario';
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

export interface PlantillaConfig {
  tipo: TipoPlantilla;
  label: string;
  icon: LucideIcon;
  color: string;
  placeholder: string;
}

export const PLANTILLAS_CONFIG: PlantillaConfig[] = [
  {
    tipo: TipoPlantilla.EVENTO,
    label: 'Evento Estándar',
    icon: CalendarIcon,
    color: '#AA4B50', // Terracota Rojizo de la paleta
    placeholder: 'Ej. Reunión familiar, cena con amigos...',
  },
  {
    tipo: TipoPlantilla.CUMPLEANOS,
    label: 'Cumpleaños',
    icon: HeartHandshake,
    color: '#A13842', // Carmín Profundo de la paleta
    placeholder: 'Ej. Cumpleaños de...',
  },
  {
    tipo: TipoPlantilla.TAREA,
    label: 'Tarea',
    icon: ListTodo,
    color: '#BD7471', // Rosa Arcilla de la paleta
    placeholder: 'Ej. Limpiar filtros, organizar despensa...',
  },
  {
    tipo: TipoPlantilla.CITA_MEDICA,
    label: 'Cita Médica',
    icon: Stethoscope,
    color: '#B25D5D', // Terracota Medio de la paleta
    placeholder: 'Ej. Control odontológico, pediatra...',
  },
  {
    tipo: TipoPlantilla.MERCADO,
    label: 'Mercado',
    icon: ShoppingCart,
    color: '#6EB5A5', // Salvia Menta de la paleta
    placeholder: 'Ej. Mercado quincenal...',
  },
];

export const PALETA_COLORES = [
  '#AA4B50', // Terracota Primario
  '#A13842', // Carmín Profundo
  '#6EB5A5', // Salvia Menta
  '#BD7471', // Rosa Arcilla
  '#B25D5D', // Terracota Medio
  '#98CABA', // Salvia Suave
];

export const MESES_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const DIAS_MINI = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export interface SubtareaItem {
  id: string;
  descripcion: string;
  completado: boolean;
}
