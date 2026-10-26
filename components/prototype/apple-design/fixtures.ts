/**
 * Fixtures de datos para el prototipo interactivo Apple Design & Break-UI.
 * Sigue los principios del catálogo de break-ui: datos realistas, casos límite,
 * nombres con diacríticos, correos continuos irrompibles y variaciones de conteo.
 */

import {
  formatPlural,
  formatMiembros,
  formatServicios,
  formatAportes,
  formatDias,
  formatAlertas,
  formatEventos,
  formatPlantas,
  formatCOP,
  formatCOPCompact,
  formatMemberCount,
  getSafeInitials,
} from '@/lib/formatters';

export {
  formatPlural,
  formatMiembros,
  formatServicios,
  formatAportes,
  formatDias,
  formatAlertas,
  formatEventos,
  formatPlantas,
  formatCOP,
  formatCOPCompact,
  formatMemberCount,
  getSafeInitials,
};

export interface MiembroPrototype {
  id: string;
  nombre: string;
  email: string;
  rol?: string;
  cuotaCOP: number;
  iniciales: string;
  avatarBgColor?: string;
  badge?: string;
}

export type BreakUiMode = 'demo' | 'worst' | 'single' | 'empty';

/** Datos estándar limpios (Demo data) */
export const DEMO_MEMBERS: MiembroPrototype[] = [
  {
    id: 'm-1',
    nombre: 'Sofía Gómez',
    email: 'sofia.gomez@ejemplo.com',
    rol: 'Propietaria',
    cuotaCOP: 180000,
    iniciales: 'SG',
    avatarBgColor: 'bg-terracotta text-white',
    badge: 'Al día',
  },
  {
    id: 'm-2',
    nombre: 'Carlos Mendoza',
    email: 'carlos.m@ejemplo.com',
    rol: 'Inquilino',
    cuotaCOP: 240000,
    iniciales: 'CM',
    avatarBgColor: 'bg-mint text-white',
    badge: 'Pendiente',
  },
  {
    id: 'm-3',
    nombre: 'Laura Pérez',
    email: 'laura.perez@ejemplo.com',
    rol: 'Residente',
    cuotaCOP: 120000,
    iniciales: 'LP',
    avatarBgColor: 'bg-brand-deep text-white',
    badge: 'Al día',
  },
];

/** Datos de estrés máximo realista (Worst-case data) */
export const WORST_CASE_MEMBERS: MiembroPrototype[] = [
  {
    id: 'w-1',
    nombre: 'Aleksandra Wiśniewska-Kowalczyk',
    email: 'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
    rol: 'Coordinadora General de Mantenimiento y Presupuesto Operativo',
    cuotaCOP: 148950000,
    iniciales: 'AW',
    avatarBgColor: 'bg-terracotta text-white',
    badge: 'Revisión prioritaria',
  },
  {
    id: 'w-2',
    nombre: '🌱 Jo',
    email: 'jo@x.co',
    rol: 'Pasante',
    cuotaCOP: 9999999,
    iniciales: 'J',
    avatarBgColor: 'bg-mint text-white',
    badge: 'Activo',
  },
  {
    id: 'w-3',
    nombre: 'Bartholomew Montgomery III',
    email: 'b.montgomery.iii@subdomain.really-long-organization-name.co.uk',
    rol: 'Auditor Externo',
    cuotaCOP: 35400000,
    iniciales: 'BM',
    avatarBgColor: 'bg-brand-deep text-white',
    badge: 'Exonerado',
  },
  {
    id: 'w-4',
    nombre: 'María José Nuñez',
    email: 'mj.nunez@bighouse.internal',
    rol: undefined,
    cuotaCOP: 0,
    iniciales: 'MN',
    avatarBgColor: 'bg-clay text-white',
    badge: 'Sin cuota',
  },
];

/** Caso de 1 solo miembro (prueba de pluralización gramatical estricta) */
export const SINGLE_MEMBER: MiembroPrototype[] = [
  {
    id: 's-1',
    nombre: 'Alejandro Soto',
    email: 'alejandro@hogar.app',
    rol: 'Administrador único',
    cuotaCOP: 150000,
    iniciales: 'AS',
    avatarBgColor: 'bg-terracotta text-white',
    badge: 'Principal',
  },
];

/** Caso de lista vacía */
export const EMPTY_MEMBERS: MiembroPrototype[] = [];


/* ==========================================================================
 * FIXTURES PARA MÓDULO FINANZAS (R3 & BREAK-UI)
 * ========================================================================== */

export interface ServicioPrototype {
  id: string;
  nombre_servicio: string;
  proveedor?: string;
  categoria: 'energia' | 'gas' | 'agua' | 'internet' | 'administracion' | 'streaming' | 'otro';
  monto: number;
  fecha_vencimiento: string;
  dia_vencimiento: number;
  periodicidad_meses: number;
  numero_cuenta: string;
  numero_factura?: string;
  estadoVencimiento: 'AL_DIA' | 'POR_VENCER' | 'VENCIDO' | 'PAGADO';
  diasRestantes: number;
  responsableNombre: string;
  responsableIniciales: string;
  responsableAvatarBg?: string;
  ultimoPago?: {
    fecha: string;
    monto: number;
    pagadoPor: string;
  };
}

export interface AporteFondoPrototype {
  id: string;
  habitanteNombre: string;
  habitanteIniciales: string;
  monto: number;
  fecha: string;
  concepto: string;
  avatarBgColor?: string;
}

export interface FinanzasDataset {
  servicios: ServicioPrototype[];
  aportes: AporteFondoPrototype[];
  totalFondoRecaudado: number;
  metaFondoMensual: number;
}

export const DEMO_FINANZAS: FinanzasDataset = {
  servicios: [
    {
      id: 'srv-1',
      nombre_servicio: 'EPM Energía y Gas',
      proveedor: 'Empresas Públicas de Medellín E.S.P.',
      categoria: 'energia',
      monto: 185000,
      fecha_vencimiento: '2026-10-24',
      dia_vencimiento: 24,
      periodicidad_meses: 1,
      numero_cuenta: '62211753',
      numero_factura: 'FAC-2026-9912',
      estadoVencimiento: 'POR_VENCER',
      diasRestantes: 3,
      responsableNombre: 'Carlos Mendoza',
      responsableIniciales: 'CM',
      responsableAvatarBg: 'bg-mint text-white',
    },
    {
      id: 'srv-2',
      nombre_servicio: 'Internet Fibra Óptica 500MB',
      proveedor: 'Movistar Colombia',
      categoria: 'internet',
      monto: 95000,
      fecha_vencimiento: '2026-11-08',
      dia_vencimiento: 8,
      periodicidad_meses: 1,
      numero_cuenta: '0098471201',
      estadoVencimiento: 'AL_DIA',
      diasRestantes: 18,
      responsableNombre: 'Sofía Gómez',
      responsableIniciales: 'SG',
      responsableAvatarBg: 'bg-terracotta text-white',
    },
    {
      id: 'srv-3',
      nombre_servicio: 'Acueducto y Alcantarillado',
      proveedor: 'EPM Aguas del Valle',
      categoria: 'agua',
      monto: 68000,
      fecha_vencimiento: '2026-11-14',
      dia_vencimiento: 14,
      periodicidad_meses: 1,
      numero_cuenta: '77301928',
      estadoVencimiento: 'AL_DIA',
      diasRestantes: 24,
      responsableNombre: 'Laura Pérez',
      responsableIniciales: 'LP',
      responsableAvatarBg: 'bg-brand-deep text-white',
    },
    {
      id: 'srv-4',
      nombre_servicio: 'Cuota de Administración Edificio',
      proveedor: 'Administraciones del Poblado S.A.S.',
      categoria: 'administracion',
      monto: 220000,
      fecha_vencimiento: '2026-10-17',
      dia_vencimiento: 17,
      periodicidad_meses: 1,
      numero_cuenta: 'EDIF-APTO-402',
      numero_factura: 'ADM-OCT-402',
      estadoVencimiento: 'VENCIDO',
      diasRestantes: -4,
      responsableNombre: 'Carlos Mendoza',
      responsableIniciales: 'CM',
      responsableAvatarBg: 'bg-mint text-white',
    },
  ],
  aportes: [
    {
      id: 'ap-1',
      habitanteNombre: 'Sofía Gómez',
      habitanteIniciales: 'SG',
      monto: 180000,
      fecha: '2026-10-05',
      concepto: 'Aporte mensual ordinario',
      avatarBgColor: 'bg-terracotta text-white',
    },
    {
      id: 'ap-2',
      habitanteNombre: 'Carlos Mendoza',
      habitanteIniciales: 'CM',
      monto: 240000,
      fecha: '2026-10-06',
      concepto: 'Aporte cuota y fondo reserva',
      avatarBgColor: 'bg-mint text-white',
    },
    {
      id: 'ap-3',
      habitanteNombre: 'Laura Pérez',
      habitanteIniciales: 'LP',
      monto: 120000,
      fecha: '2026-10-07',
      concepto: 'Aporte servicios comunes',
      avatarBgColor: 'bg-brand-deep text-white',
    },
  ],
  totalFondoRecaudado: 540000,
  metaFondoMensual: 600000,
};

export const WORST_CASE_FINANZAS: FinanzasDataset = {
  servicios: [
    {
      id: 'srv-w1',
      nombre_servicio: 'Consorcio Metropolitano de Acueducto, Alcantarillado y Tratamiento de Aguas Residuales del Valle de Aburrá E.S.P. — Planta San Fernando',
      proveedor: 'Consorcio Aguas del Norte Internacional Holding Group S.A. Sucursal Colombia',
      categoria: 'agua',
      monto: 148950000,
      fecha_vencimiento: '2026-10-09',
      dia_vencimiento: 9,
      periodicidad_meses: 1,
      numero_cuenta: 'REF-998847291048201948201948201948-CTA-88392019482019',
      numero_factura: 'FACTURA-ELECTRÓNICA-DIAN-SEF-99201948201948201948',
      estadoVencimiento: 'VENCIDO',
      diasRestantes: -12,
      responsableNombre: 'Aleksandra Wiśniewska-Kowalczyk',
      responsableIniciales: 'AW',
      responsableAvatarBg: 'bg-terracotta text-white',
    },
    {
      id: 'srv-w2',
      nombre_servicio: '⚡ G',
      proveedor: 'E',
      categoria: 'energia',
      monto: 9999999,
      fecha_vencimiento: '2026-10-21',
      dia_vencimiento: 21,
      periodicidad_meses: 1,
      numero_cuenta: '0',
      estadoVencimiento: 'POR_VENCER',
      diasRestantes: 0,
      responsableNombre: '🌱 Jo',
      responsableIniciales: 'J',
      responsableAvatarBg: 'bg-mint text-white',
    },
    {
      id: 'srv-w3',
      nombre_servicio: 'Compañía Energética y Distribución Eléctrica de Occidente S.A.S. E.S.P. III',
      proveedor: 'Grupo Empresarial Energético Latinoamericano',
      categoria: 'energia',
      monto: 35400000,
      fecha_vencimiento: '2026-11-19',
      dia_vencimiento: 19,
      periodicidad_meses: 1,
      numero_cuenta: 'NL-88492018492018',
      estadoVencimiento: 'AL_DIA',
      diasRestantes: 29,
      responsableNombre: 'Bartholomew Montgomery III',
      responsableIniciales: 'BM',
      responsableAvatarBg: 'bg-brand-deep text-white',
    },
  ],
  aportes: [
    {
      id: 'ap-w1',
      habitanteNombre: 'Aleksandra Wiśniewska-Kowalczyk',
      habitanteIniciales: 'AW',
      monto: 148950000,
      fecha: '2026-10-01',
      concepto: 'Fondo extraordinario de infraestructura y mantenimiento general del inmueble patrimonial',
      avatarBgColor: 'bg-terracotta text-white',
    },
    {
      id: 'ap-w2',
      habitanteNombre: 'Bartholomew Montgomery III',
      habitanteIniciales: 'BM',
      monto: 35400000,
      fecha: '2026-10-02',
      concepto: 'Cuota de amortización de deuda eléctrica consolidada',
      avatarBgColor: 'bg-brand-deep text-white',
    },
  ],
  totalFondoRecaudado: 184350000,
  metaFondoMensual: 200000000,
};

export const SINGLE_FINANZAS: FinanzasDataset = {
  servicios: [
    {
      id: 'srv-s1',
      nombre_servicio: 'Servicio de Energía Eléctrica',
      proveedor: 'EPM',
      categoria: 'energia',
      monto: 150000,
      fecha_vencimiento: '2026-10-22',
      dia_vencimiento: 22,
      periodicidad_meses: 1,
      numero_cuenta: '12345678',
      estadoVencimiento: 'POR_VENCER',
      diasRestantes: 1,
      responsableNombre: 'Alejandro Soto',
      responsableIniciales: 'AS',
      responsableAvatarBg: 'bg-terracotta text-white',
    },
  ],
  aportes: [
    {
      id: 'ap-s1',
      habitanteNombre: 'Alejandro Soto',
      habitanteIniciales: 'AS',
      monto: 150000,
      fecha: '2026-10-10',
      concepto: 'Aporte único mensual',
      avatarBgColor: 'bg-terracotta text-white',
    },
  ],
  totalFondoRecaudado: 150000,
  metaFondoMensual: 150000,
};

export const EMPTY_FINANZAS: FinanzasDataset = {
  servicios: [],
  aportes: [],
  totalFondoRecaudado: 0,
  metaFondoMensual: 500000,
};
