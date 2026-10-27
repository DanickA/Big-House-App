'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';
import {
  getServicios,
  createServicio,
  updateServicio,
  deleteServicio,
  registrarPagoServicio,
  getHistorialPagos,
  getFondoComunMes,
  registrarAporteFondo,
  deleteAporteFondo,
  getGastosMes,
  registrarGastoGeneral,
  deleteGastoGeneral,
  ServicioConEstado,
  ResumenServicios,
  ResumenFondoComunMes,
  PagoHistorialItem,
  GastoHogar,
} from '@/actions/pagos';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  History,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Upload,
  Wallet,
  X,
} from 'lucide-react';

export interface HabitanteOption {
  id: string;
  nombre: string;
  email?: string;
}

interface FinanzasViewProps {
  initialServicios: ServicioConEstado[];
  initialResumen: ResumenServicios;
  initialFondoComun?: ResumenFondoComunMes;
  initialGastos?: GastoHogar[];
  initialHabitantes?: HabitanteOption[];
  currentUserId?: string;
}

const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const AVATAR_COLORS = [
  'bg-[#3e6190] text-[#fcf7ef]',
  'bg-[#54749d] text-[#fcf7ef]',
  'bg-[#6b87a9] text-[#fcf7ef]',
  'bg-[#8599b2] text-[#0f1e32]',
  'bg-[#f9deaf] text-[#0f1e32]',
];

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nombre.slice(0, 2).toUpperCase();
}

function formatCOP(val: number): string {
  return '$' + Math.round(val).toLocaleString('es-CO');
}

function formatCompact(val: number): string {
  if (Math.abs(val) >= 1000) {
    return '$' + Math.round(val / 1000) + 'k';
  }
  return '$' + Math.round(val);
}

function getCurrentPeriodoMes(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftPeriodoMes(periodoMes: string, deltaMonths: number): string {
  const [y, m] = periodoMes.split('-').map(Number);
  const d = new Date(y, m - 1 + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatPeriodoLabels(periodoMes: string): { largo: string; corto: string } {
  const [y, m] = periodoMes.split('-').map(Number);
  const nombreMes = NOMBRES_MESES[(m - 1 + 12) % 12] || 'Mes';
  return {
    largo: `${nombreMes} ${y}`,
    corto: nombreMes,
  };
}

export default function FinanzasView({
  initialServicios,
  initialResumen,
  initialFondoComun,
  initialGastos = [],
  initialHabitantes = [],
  currentUserId,
}: FinanzasViewProps) {
  const [periodoMes, setPeriodoMes] = useState<string>(() => getCurrentPeriodoMes());
  const [tab, setTab] = useState<'recibos' | 'fondo'>('recibos');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Hoja deslizable de gestión integral del servicio
  const [servicioActivo, setServicioActivo] = useState<ServicioConEstado | null>(null);
  const [sheetTab, setSheetTab] = useState<'pagar' | 'historico' | 'configurar'>('pagar');

  // Estado Pestaña Pagar
  const [montoPagoInput, setMontoPagoInput] = useState<string>('');
  const [fechaPagoInput, setFechaPagoInput] = useState<string>('');
  const [observacionesPago, setObservacionesPago] = useState<string>('');
  const [comprobantePagoFile, setComprobantePagoFile] = useState<File | null>(null);

  // Estado Pestaña Histórico
  const [historialServicio, setHistorialServicio] = useState<PagoHistorialItem[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);

  // Estado Pestaña Configurar (Editar / Eliminar)
  const [editNombre, setEditNombre] = useState<string>('');
  const [editMontoPresupuesto, setEditMontoPresupuesto] = useState<string>('');
  const [editDiaVencimiento, setEditDiaVencimiento] = useState<string>('');
  const [editFechaVencimiento, setEditFechaVencimiento] = useState<string>('');
  const [editPeriodicidad, setEditPeriodicidad] = useState<string>('1');
  const [editReferencia, setEditReferencia] = useState<string>('');
  const [editResponsableId, setEditResponsableId] = useState<string>('');
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<boolean>(false);

  // Modal Nuevo Servicio
  const [modalNuevoServicio, setModalNuevoServicio] = useState<boolean>(false);
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevoMonto, setNuevoMonto] = useState<string>('');
  const [nuevaFechaVenc, setNuevaFechaVenc] = useState<string>(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [nuevoDia, setNuevoDia] = useState<string>('15');
  const [nuevaPeriodicidad, setNuevaPeriodicidad] = useState<string>('1');
  const [nuevaReferencia, setNuevaReferencia] = useState<string>('');
  const [nuevoResponsableId, setNuevoResponsableId] = useState<string>(
    currentUserId || initialHabitantes[0]?.id || ''
  );

  // Modal Nuevo Aporte al Fondo Común
  const [modalAporteOpen, setModalAporteOpen] = useState<boolean>(false);
  const [aporteHabId, setAporteHabId] = useState<string>(
    currentUserId || initialHabitantes[0]?.id || ''
  );
  const [aporteMonto, setAporteMonto] = useState<string>('');
  const [aporteNota, setAporteNota] = useState<string>('');
  const [aporteFile, setAporteFile] = useState<File | null>(null);

  // Modal Vista Previa de Comprobante
  const [comprobantePreview, setComprobantePreview] = useState<{
    titulo: string;
    url: string;
    monto: number;
    extra?: string;
  } | null>(null);

  // Estado Gastos Generales del Hogar (F-19)
  const [gastoDescripcion, setGastoDescripcion] = useState<string>('');
  const [gastoMonto, setGastoMonto] = useState<string>('');
  const [gastoCategoria, setGastoCategoria] = useState<string>('GENERAL');

  const esMesInicial = periodoMes === getCurrentPeriodoMes();

  const { data, mutate } = useSWR(
    ['finanzas-mes', periodoMes],
    async () => {
      const [resServ, resFondo, resGastos] = await Promise.all([
        getServicios(periodoMes),
        getFondoComunMes(periodoMes),
        typeof getGastosMes === 'function'
          ? getGastosMes(periodoMes)
          : Promise.resolve({ success: true as const, gastos: initialGastos, totalGastosMes: 0 }),
      ]);
      return {
        servicios: resServ.success ? resServ.servicios : initialServicios,
        resumen: resServ.success ? resServ.resumen : initialResumen,
        fondo: resFondo.success && resFondo.data ? resFondo.data : initialFondoComun,
        gastos: resGastos && resGastos.success ? resGastos.gastos : initialGastos,
      };
    },
    {
      fallbackData: esMesInicial
        ? {
            servicios: initialServicios,
            resumen: initialResumen,
            fondo: initialFondoComun,
            gastos: initialGastos,
          }
        : undefined,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const servicios = data?.servicios ?? initialServicios;
  const gastosMes: GastoHogar[] = (data?.gastos ?? initialGastos).filter(
    (g: GastoHogar) => !g.servicio_id
  );
  const fondo = data?.fondo ??
    initialFondoComun ?? {
      periodoMes,
      presupuestoMesRecaudado: 0,
      aportes: [],
      porHabitante: [],
    };

  function notificarExito(msg: string) {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 3500);
  }

  function notificarError(msg: string) {
    setMensajeError(msg);
    setTimeout(() => setMensajeError(null), 4000);
  }

  // Cargar historial cuando se abre la pestaña 'historico'
  useEffect(() => {
    if (!servicioActivo || sheetTab !== 'historico') return;
    let cancelado = false;
    setCargandoHistorial(true);
    getHistorialPagos(servicioActivo.id)
      .then((res) => {
        if (cancelado) return;
        if (res.success) {
          setHistorialServicio(res.data);
        } else {
          setHistorialServicio([]);
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoHistorial(false);
      });
    return () => {
      cancelado = true;
    };
  }, [servicioActivo, sheetTab]);

  const { largo: mesLabelLargo, corto: mesLabelCorto } = formatPeriodoLabels(periodoMes);

  // Clasificación de servicios para el mes consultado
  const pagadosDelMes = servicios.filter(
    (s) => s.pagadoEnMesConsultado || s.estadoVencimiento === 'PAGADO'
  );
  const pendientesDelMes = servicios
    .filter((s) => !s.pagadoEnMesConsultado && s.estadoVencimiento !== 'PAGADO')
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  const totalFondoMes = fondo.presupuestoMesRecaudado;
  const totalEstimadoServicios = servicios.reduce((acc, s) => acc + s.monto, 0);
  const totalRealPagado = pagadosDelMes.reduce(
    (acc, s) =>
      acc + (s.pagoMesConsultado?.monto_pagado ?? s.ultimoPago?.monto_pagado ?? s.monto),
    0
  );
  const porPagarEstimado = pendientesDelMes.reduce((acc, s) => acc + s.monto, 0);

  function handleOpenServicio(
    s: ServicioConEstado,
    tabInicial: 'pagar' | 'historico' | 'configurar' = 'pagar'
  ) {
    setServicioActivo(s);
    setSheetTab(tabInicial);
    setConfirmandoEliminar(false);

    const hoyISO = new Date().toISOString().split('T')[0];
    setMontoPagoInput(String(s.pagoMesConsultado?.monto_pagado ?? s.monto));
    setFechaPagoInput(hoyISO);
    setObservacionesPago('');
    setComprobantePagoFile(null);

    setEditNombre(s.nombre_servicio);
    setEditMontoPresupuesto(String(s.monto));
    setEditDiaVencimiento(String(s.dia_vencimiento ?? new Date(s.fecha_vencimiento).getDate()));
    setEditFechaVencimiento(s.fecha_vencimiento.split('T')[0]);
    setEditPeriodicidad(String(s.periodicidad_meses || 1));
    setEditReferencia(s.numero_cuenta || '');
    setEditResponsableId(s.responsable_id || '');
  }

  async function handleConfirmarPago(e: React.FormEvent) {
    e.preventDefault();
    if (!servicioActivo || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set('servicio_id', servicioActivo.id);
      fd.set('monto_pagado', montoPagoInput || String(servicioActivo.monto));
      if (fechaPagoInput) fd.set('fecha_pago', fechaPagoInput);
      if (observacionesPago.trim()) fd.set('observaciones', observacionesPago.trim());
      fd.set('fecha_vencimiento_esperada', servicioActivo.fecha_vencimiento);
      if (comprobantePagoFile) {
        fd.set('comprobante', comprobantePagoFile);
      }

      const res = await registrarPagoServicio(fd);
      if (res.success) {
        notificarExito(`Pago de ${servicioActivo.nombre_servicio} registrado`);
        setServicioActivo(null);
        await mutate();
      } else {
        notificarError(res.error || 'No se pudo registrar el pago');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGuardarEdicionServicio(e: React.FormEvent) {
    e.preventDefault();
    if (!servicioActivo || !editNombre.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set('nombre_servicio', editNombre.trim());
      fd.set('monto', editMontoPresupuesto);
      fd.set('periodicidad_meses', editPeriodicidad);
      if (editDiaVencimiento) fd.set('dia_vencimiento', editDiaVencimiento);
      if (editFechaVencimiento) fd.set('fecha_vencimiento', editFechaVencimiento);
      if (editReferencia.trim()) fd.set('numero_cuenta', editReferencia.trim());
      fd.set('responsable_id', editResponsableId || '');

      const res = await updateServicio(servicioActivo.id, fd);
      if (res.success) {
        notificarExito('Servicio actualizado correctamente');
        setServicioActivo(null);
        await mutate();
      } else {
        notificarError(res.error || 'No se pudo actualizar el servicio');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmarEliminarServicio() {
    if (!servicioActivo || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await deleteServicio(servicioActivo.id);
      if (res.success) {
        notificarExito('Servicio eliminado');
        setServicioActivo(null);
        await mutate();
      } else {
        notificarError(res.error || 'No se pudo eliminar el servicio');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCrearNuevoServicio(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoMonto || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set('nombre_servicio', nuevoNombre.trim());
      fd.set('monto', nuevoMonto);
      fd.set('fecha_vencimiento', nuevaFechaVenc);
      fd.set('periodicidad_meses', nuevaPeriodicidad);
      if (nuevoDia) fd.set('dia_vencimiento', nuevoDia);
      if (nuevaReferencia.trim()) fd.set('numero_cuenta', nuevaReferencia.trim());
      if (nuevoResponsableId) fd.set('responsable_id', nuevoResponsableId);

      const res = await createServicio(fd);
      if (res.success) {
        notificarExito('Servicio creado correctamente');
        setNuevoNombre('');
        setNuevoMonto('');
        setNuevaReferencia('');
        setModalNuevoServicio(false);
        await mutate();
      } else {
        notificarError(res.error || 'No se pudo crear el servicio');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGuardarAporte(e: React.FormEvent) {
    e.preventDefault();
    if (!aporteMonto || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      if (aporteHabId) fd.set('usuario_id', aporteHabId);
      fd.set('monto', aporteMonto);
      fd.set('periodo_mes', periodoMes);
      if (aporteNota.trim()) fd.set('descripcion', aporteNota.trim());
      if (aporteFile) fd.set('comprobante', aporteFile);

      const res = await registrarAporteFondo(fd);
      if (res.success) {
        notificarExito('Aporte registrado en el Fondo Común');
        setAporteMonto('');
        setAporteNota('');
        setAporteFile(null);
        setModalAporteOpen(false);
        await mutate();
      } else {
        notificarError(res.error || 'No se pudo registrar el aporte');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEliminarAporte(aporteId: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await deleteAporteFondo(aporteId);
      if (res.success) {
        notificarExito('Aporte eliminado');
        await mutate();
      } else {
        notificarError(res.error || 'No se pudo eliminar el aporte');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegistrarGastoGeneral(e: React.FormEvent) {
    e.preventDefault();
    if (!gastoDescripcion.trim() || !gastoMonto || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set('descripcion', gastoDescripcion.trim());
      fd.set('monto', gastoMonto);
      fd.set('categoria', gastoCategoria);
      const res = await registrarGastoGeneral(fd);
      if (res.success) {
        notificarExito('Gasto general registrado');
        setGastoDescripcion('');
        setGastoMonto('');
        await mutate();
      } else {
        notificarError(res.error || 'No se pudo registrar el gasto');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEliminarGastoGeneral(gastoId: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await deleteGastoGeneral(gastoId);
      if (res.success) {
        notificarExito('Gasto eliminado');
        await mutate();
      } else {
        notificarError(res.error || 'No se pudo eliminar el gasto');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-system text-label-primary">
      {/* Notificaciones Flotantes */}
      {mensajeExito && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#282321] text-[#F9F3DB] text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 size={15} className="text-mint shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}
      {mensajeError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-terracotta text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-in-up">
          <AlertCircle size={15} className="shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-5">
        {/* Encabezado + Selector de Mes + Segmented Control */}
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-label-primary tracking-tight">
              Finanzas del Hogar
            </h1>
            <button
              type="button"
              onClick={() => setModalNuevoServicio(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-terracotta text-white text-xs font-semibold shadow-2xs hover:opacity-95 transition-opacity"
            >
              <Plus size={14} />
              <span>Nuevo servicio</span>
            </button>
          </div>

          {/* Selector de Mes (< Mes Año >) */}
          <div className="flex items-center justify-between bg-secondary px-3.5 py-2 rounded-2xl border border-separator">
            <button
              type="button"
              onClick={() => setPeriodoMes((prev) => shiftPeriodoMes(prev, -1))}
              className="p-1 rounded-lg text-label-secondary hover:text-label-primary transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-label-primary">{mesLabelLargo}</p>
              <p className="text-[11px] text-label-secondary">
                Bolsa: {formatCOP(totalFondoMes)} · {pagadosDelMes.length}/{servicios.length} pagados
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPeriodoMes((prev) => shiftPeriodoMes(prev, 1))}
              className="p-1 rounded-lg text-label-secondary hover:text-label-primary transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Segmented Control iOS Limpio: Recibos | Fondo Común */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-tertiary border border-separator">
            <button
              type="button"
              onClick={() => setTab('recibos')}
              className={`py-2 text-sm font-semibold rounded-xl transition-all ${
                tab === 'recibos'
                  ? 'bg-secondary-solid text-label-primary shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              Recibos ({pendientesDelMes.length > 0 ? `${pendientesDelMes.length} pend.` : 'Al día'})
            </button>
            <button
              type="button"
              onClick={() => setTab('fondo')}
              className={`py-2 text-sm font-semibold rounded-xl transition-all ${
                tab === 'fondo'
                  ? 'bg-secondary-solid text-label-primary shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              Fondo Común
            </button>
          </div>
        </header>

        {tab === 'recibos' ? (
          <div className="space-y-6 animate-fade-in-up">
            {/* Píldora de estado de 1 línea */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-secondary border border-separator text-xs">
              <span className="text-label-secondary">
                Por pagar est.:{' '}
                <strong className="text-label-primary">{formatCOP(porPagarEstimado)}</strong>
              </span>
              <span className="text-label-secondary">
                Pagado real: <strong className="text-mint">{formatCOP(totalRealPagado)}</strong>
              </span>
            </div>

            {servicios.length === 0 ? (
              <div className="p-8 rounded-3xl bg-secondary border border-separator text-center space-y-3">
                <Receipt size={32} className="mx-auto text-label-tertiary" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-label-primary">
                    Aún no hay servicios registrados
                  </p>
                  <p className="text-xs text-label-secondary">
                    Agrega los recibos recurrentes del hogar para recordar sus fechas de corte y
                    presupuesto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalNuevoServicio(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold"
                >
                  <Plus size={14} />
                  <span>Agregar primer servicio</span>
                </button>
              </div>
            ) : (
              <>
                {/* Sección 1: Pendientes por pagar */}
                {pendientesDelMes.length > 0 && (
                  <section className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-1">
                      <h2 className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                        Por pagar en {mesLabelCorto} ({pendientesDelMes.length})
                      </h2>
                      <span className="text-[11px] text-label-tertiary">
                        Toque para pagar, historial o editar
                      </span>
                    </div>

                    <div className="rounded-2xl bg-secondary border border-separator divide-y divide-[var(--separator)] overflow-hidden">
                      {pendientesDelMes.map((s) => {
                        const enMora = s.diasRestantes < 0;
                        const pronto = s.diasRestantes >= 0 && s.diasRestantes <= 3;
                        const diaCorte =
                          s.dia_vencimiento ?? new Date(s.fecha_vencimiento).getDate();
                        const nombreResp = s.responsable?.nombre || 'Sin asignar';

                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleOpenServicio(s, 'pagar')}
                            className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 transition-colors hover:bg-tertiary/40 ${
                              enMora ? 'bg-[#AA4B50]/[0.06]' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  enMora
                                    ? 'bg-terracotta animate-pulse'
                                    : pronto
                                    ? 'bg-[#BD7471]'
                                    : 'bg-label-quaternary'
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-label-primary truncate">
                                  {s.nombre_servicio}
                                </p>
                                <div className="flex items-center gap-1.5 text-xs mt-0.5">
                                  <span
                                    className={
                                      enMora
                                        ? 'text-terracotta font-semibold'
                                        : pronto
                                        ? 'text-[#BD7471] font-medium'
                                        : 'text-label-secondary'
                                    }
                                  >
                                    {enMora
                                      ? `En mora (${Math.abs(s.diasRestantes)}d) · Riesgo corte`
                                      : s.diasRestantes === 0
                                      ? 'Vence hoy'
                                      : `Vence en ${s.diasRestantes}d (Día ${diaCorte})`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-bold text-label-primary">
                                  {formatCOP(s.monto)}
                                </p>
                                <p className="text-[11px] text-label-secondary flex items-center justify-end gap-1">
                                  <span className="w-4 h-4 rounded-full text-[9px] inline-flex items-center justify-center font-bold bg-tertiary text-label-primary">
                                    {getInitials(nombreResp)[0]}
                                  </span>
                                  <span className="truncate max-w-[90px]">{nombreResp}</span>
                                </p>
                              </div>
                              <ChevronRight size={16} className="text-label-tertiary" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Sección 2: Pagados con Contraste Presupuesto vs Real */}
                <section className="space-y-2">
                  <h2 className="text-xs font-semibold text-label-secondary uppercase tracking-wider px-1">
                    Pagados en {mesLabelCorto} ({pagadosDelMes.length})
                  </h2>
                  {pagadosDelMes.length === 0 ? (
                    <div className="px-4 py-5 rounded-2xl bg-secondary/60 border border-separator text-center text-xs text-label-secondary">
                      No se han registrado pagos en {mesLabelCorto}.
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-secondary border border-separator divide-y divide-[var(--separator)] overflow-hidden">
                      {pagadosDelMes.map((s) => {
                        const pagoInfo = s.pagoMesConsultado ?? s.ultimoPago;
                        const real = pagoInfo?.monto_pagado ?? s.monto;
                        const presup = pagoInfo?.monto_presupuestado ?? s.monto;
                        const diff = real - presup;
                        const fechaStr = pagoInfo?.fecha_pago
                          ? new Date(pagoInfo.fecha_pago).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : '';

                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleOpenServicio(s, 'historico')}
                            className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-tertiary/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-mint/20 text-mint flex items-center justify-center shrink-0">
                                <Check size={12} strokeWidth={3} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-label-primary truncate">
                                  {s.nombre_servicio}
                                </p>
                                <p className="text-xs text-label-secondary">
                                  Pagado {fechaStr} · Est. {formatCompact(presup)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-semibold text-label-primary">
                                  {formatCOP(real)}
                                </p>
                                <span
                                  className={`text-[11px] font-medium ${
                                    diff > 0
                                      ? 'text-terracotta'
                                      : diff < 0
                                      ? 'text-mint'
                                      : 'text-label-tertiary'
                                  }`}
                                >
                                  {diff === 0
                                    ? 'Exacto al presupuesto'
                                    : diff > 0
                                    ? `+${formatCompact(diff)} vs est.`
                                    : `${formatCompact(diff)} ahorro`}
                                </span>
                              </div>
                              <ChevronRight size={15} className="text-label-tertiary" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        ) : (
          /* PESTAÑA 2: FONDO COMÚN */
          <div className="space-y-5 animate-fade-in-up">
            {/* Tarjeta Principal: Presupuesto del Mes = Suma de Aportes */}
            <div className="p-5 rounded-3xl bg-secondary border border-separator space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-label-secondary">
                    Presupuesto de {mesLabelCorto} (Suma de Aportes)
                  </p>
                  <p className="text-3xl font-bold text-label-primary tracking-tight mt-0.5">
                    {formatCOP(totalFondoMes)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-mint/15 text-mint flex items-center justify-center">
                  <Wallet size={20} />
                </div>
              </div>

              <div className="pt-3 border-t border-separator grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-label-secondary block">Servicios estimados</span>
                  <strong className="text-sm text-label-primary">
                    {formatCOP(totalEstimadoServicios)}
                  </strong>
                </div>
                <div>
                  <span className="text-label-secondary block">Pagado en recibos</span>
                  <strong className="text-sm text-mint">{formatCOP(totalRealPagado)}</strong>
                </div>
              </div>
            </div>

            {/* Desglose de Aportes por Habitante */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                  Aportes por habitante en {mesLabelCorto}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalAporteOpen(true)}
                  className="text-xs font-semibold text-terracotta flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} />
                  <span>Registrar aporte</span>
                </button>
              </div>

              <div className="rounded-2xl bg-secondary border border-separator divide-y divide-[var(--separator)] overflow-hidden">
                {initialHabitantes.length > 0 ? (
                  initialHabitantes.map((h, idx) => {
                    const aportesHab = fondo.aportes.filter((a) => a.usuario_id === h.id);
                    const sumaHab = aportesHab.reduce((acc, a) => acc + a.monto, 0);
                    const ultimoAporte = aportesHab[0];
                    const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                    return (
                      <div
                        key={h.id}
                        className="px-4 py-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorClass}`}
                          >
                            {getInitials(h.nombre)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-label-primary">{h.nombre}</p>
                            {ultimoAporte ? (
                              <p className="text-xs text-label-secondary truncate">
                                {new Date(ultimoAporte.fecha).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                })}{' '}
                                · {ultimoAporte.descripcion}
                              </p>
                            ) : (
                              <p className="text-xs text-label-tertiary">
                                Sin aportes en {mesLabelCorto}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p
                            className={`text-sm font-bold ${
                              sumaHab > 0 ? 'text-label-primary' : 'text-label-tertiary'
                            }`}
                          >
                            {formatCOP(sumaHab)}
                          </p>
                          {ultimoAporte?.comprobante_url && (
                            <button
                              type="button"
                              onClick={() =>
                                setComprobantePreview({
                                  titulo: `Aporte de ${h.nombre}`,
                                  url: ultimoAporte.comprobante_url!,
                                  monto: ultimoAporte.monto,
                                  extra: ultimoAporte.descripcion,
                                })
                              }
                              className="text-[11px] font-medium text-mint inline-flex items-center gap-1 hover:underline"
                            >
                              <ImageIcon size={11} />
                              <span>Ver recibo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : fondo.aportes.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-label-secondary">
                    No hay aportes registrados en {mesLabelCorto}.
                  </div>
                ) : (
                  fondo.aportes.map((ap, idx) => (
                    <div
                      key={ap.id}
                      className="px-4 py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            AVATAR_COLORS[idx % AVATAR_COLORS.length]
                          }`}
                        >
                          {getInitials(ap.usuario?.nombre || 'HB')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-label-primary">
                            {ap.usuario?.nombre || 'Habitante'}
                          </p>
                          <p className="text-xs text-label-secondary truncate">{ap.descripcion}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-label-primary">
                          {formatCOP(ap.monto)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Listado Detallado de Envíos del Mes (si hay múltiples envíos) */}
            {fondo.aportes.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-label-secondary uppercase tracking-wider px-1">
                  Detalle de envíos ({fondo.aportes.length})
                </h3>
                <div className="rounded-2xl bg-secondary border border-separator divide-y divide-[var(--separator)] overflow-hidden">
                  {fondo.aportes.map((ap) => (
                    <div
                      key={ap.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-label-primary truncate">
                          {ap.usuario?.nombre || 'Habitante'} · {formatCOP(ap.monto)}
                        </p>
                        <p className="text-label-secondary truncate">
                          {new Date(ap.fecha).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                          })}{' '}
                          · {ap.descripcion}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ap.comprobante_url && (
                          <button
                            type="button"
                            onClick={() =>
                              setComprobantePreview({
                                titulo: `Aporte de ${ap.usuario?.nombre || 'Habitante'}`,
                                url: ap.comprobante_url!,
                                monto: ap.monto,
                                extra: ap.descripcion,
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-mint/15 text-mint font-semibold inline-flex items-center gap-1"
                          >
                            <ImageIcon size={12} />
                            <span>Soporte</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEliminarAporte(ap.id)}
                          className="p-1.5 rounded-lg text-label-tertiary hover:text-terracotta transition-colors"
                          title="Eliminar aporte"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <button
              type="button"
              onClick={() => setModalAporteOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-terracotta text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              <span>Subir mi aporte de {mesLabelCorto}</span>
            </button>

            {/* Gastos Generales del Hogar (F-19) */}
            <section className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                  Gastos Generales del Hogar ({gastosMes.length})
                </h3>
                <span className="text-[11px] font-semibold text-label-secondary">
                  {formatCOP(gastosMes.reduce((acc, g) => acc + g.monto, 0))}
                </span>
              </div>

              <form
                onSubmit={handleRegistrarGastoGeneral}
                className="p-3.5 rounded-2xl bg-secondary border border-separator space-y-2.5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={gastoDescripcion}
                    onChange={(e) => setGastoDescripcion(e.target.value)}
                    placeholder="Ej. Detergente, bombillos..."
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary placeholder:text-label-tertiary"
                  />
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={gastoMonto}
                    onChange={(e) => setGastoMonto(e.target.value)}
                    placeholder="Monto ($)"
                    className="px-3 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary placeholder:text-label-tertiary"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={gastoCategoria}
                    onChange={(e) => setGastoCategoria(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-tertiary border border-separator text-xs text-label-secondary"
                  >
                    <option value="GENERAL">General</option>
                    <option value="ASEO">Aseo / Limpieza</option>
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="MERCADO">Mercado común</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmitting || !gastoDescripcion.trim() || !gastoMonto}
                    className="px-3.5 py-1.5 rounded-xl bg-terracotta text-white text-xs font-semibold disabled:opacity-50"
                  >
                    Registrar gasto
                  </button>
                </div>
              </form>

              {gastosMes.length > 0 && (
                <div className="rounded-2xl bg-secondary border border-separator divide-y divide-[var(--separator)] overflow-hidden">
                  {gastosMes.map((g) => (
                    <div
                      key={g.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-label-primary truncate">
                          {g.descripcion} · {formatCOP(g.monto)}
                        </p>
                        <p className="text-label-secondary truncate">
                          {g.categoria} · {g.usuario?.nombre || 'Habitante'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEliminarGastoGeneral(g.id)}
                        className="p-1.5 rounded-lg text-label-tertiary hover:text-terracotta transition-colors"
                        title="Eliminar gasto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* ====================================================================
          HOJA DESLIZABLE UNIFICADA DE SERVICIO: PAGAR | HISTÓRICO | EDITAR/BORRAR
         ==================================================================== */}
      {mounted && servicioActivo && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setServicioActivo(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-secondary-solid p-5 space-y-4 border-t sm:border border-separator shadow-xl animate-fade-in-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Servicio */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-label-secondary">
                  Día de corte:{' '}
                  {servicioActivo.dia_vencimiento ??
                    new Date(servicioActivo.fecha_vencimiento).getDate()}{' '}
                  · Presupuesto: {formatCOP(servicioActivo.monto)}
                </span>
                <h3 className="text-lg font-bold text-label-primary">
                  {servicioActivo.nombre_servicio}
                </h3>
                {servicioActivo.numero_cuenta && (
                  <p className="text-xs text-label-secondary">
                    Ref/Cuenta: {servicioActivo.numero_cuenta}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setServicioActivo(null)}
                className="p-1.5 rounded-full bg-tertiary text-label-secondary hover:text-label-primary cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Selector Interno de 3 Acciones: Pagar | Histórico | Editar */}
            <div className="grid grid-cols-3 p-1 rounded-xl bg-tertiary border border-separator text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSheetTab('pagar');
                  setConfirmandoEliminar(false);
                }}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  sheetTab === 'pagar'
                    ? 'bg-secondary-solid text-label-primary shadow-2xs'
                    : 'text-label-secondary'
                }`}
              >
                <Receipt size={13} />
                <span>Pagar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSheetTab('historico');
                  setConfirmandoEliminar(false);
                }}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  sheetTab === 'historico'
                    ? 'bg-secondary-solid text-label-primary shadow-2xs'
                    : 'text-label-secondary'
                }`}
              >
                <History size={13} />
                <span>Histórico</span>
              </button>
              <button
                type="button"
                onClick={() => setSheetTab('configurar')}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  sheetTab === 'configurar'
                    ? 'bg-secondary-solid text-label-primary shadow-2xs'
                    : 'text-label-secondary'
                }`}
              >
                <Pencil size={13} />
                <span>Editar</span>
              </button>
            </div>

            {/* SUB-VISTA 1: PAGAR RECIBO */}
            {sheetTab === 'pagar' && (
              <form onSubmit={handleConfirmarPago} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-tertiary/50 flex items-center justify-between text-xs">
                  <span className="text-label-secondary">Presupuesto estimado del servicio:</span>
                  <strong className="text-sm text-label-primary">
                    {formatCOP(servicioActivo.monto)}
                  </strong>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-label-secondary block mb-1">
                      Costo real facturado en el recibo ($)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      step="any"
                      value={montoPagoInput}
                      onChange={(e) => setMontoPagoInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-tertiary border border-separator text-sm font-bold text-label-primary"
                    />
                    {montoPagoInput && (
                      <p className="text-[11px] text-label-secondary mt-1">
                        Diferencia vs presupuesto:{' '}
                        <strong
                          className={
                            Number(montoPagoInput) > servicioActivo.monto
                              ? 'text-terracotta'
                              : Number(montoPagoInput) < servicioActivo.monto
                              ? 'text-mint'
                              : 'text-label-primary'
                          }
                        >
                          {formatCOP(Number(montoPagoInput) - servicioActivo.monto)}
                        </strong>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-label-secondary block mb-1">
                      Fecha de pago
                    </label>
                    <input
                      type="date"
                      value={fechaPagoInput}
                      onChange={(e) => setFechaPagoInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-label-secondary block mb-1">
                      Observaciones (opcional)
                    </label>
                    <input
                      type="text"
                      value={observacionesPago}
                      onChange={(e) => setObservacionesPago(e.target.value)}
                      placeholder="Ej. Pagado por PSE"
                      className="w-full px-3.5 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-label-secondary block mb-1">
                      Comprobante / Recibo de pago (Imagen o PDF)
                    </label>
                    <label className="px-3.5 py-2.5 rounded-xl bg-tertiary/60 border border-dashed border-separator flex items-center justify-between text-xs cursor-pointer hover:bg-tertiary transition-colors">
                      <span className="flex items-center gap-2 text-label-primary truncate">
                        <Upload size={15} className="text-mint shrink-0" />
                        <span className="truncate">
                          {comprobantePagoFile
                            ? comprobantePagoFile.name
                            : 'Seleccionar imagen o PDF del recibo'}
                        </span>
                      </span>
                      <span className="text-terracotta font-semibold shrink-0 ml-2">
                        {comprobantePagoFile ? 'Cambiar' : 'Subir'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => setComprobantePagoFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-terracotta text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  <span>Confirmar pago y guardar recibo</span>
                </button>
              </form>
            )}

            {/* SUB-VISTA 2: HISTÓRICO DE FACTURAS Y COMPROBANTES */}
            {sheetTab === 'historico' && (
              <div className="space-y-3">
                {cargandoHistorial ? (
                  <div className="py-8 flex items-center justify-center gap-2 text-xs text-label-secondary">
                    <Loader2 size={16} className="animate-spin text-terracotta" />
                    <span>Cargando histórico de pagos...</span>
                  </div>
                ) : historialServicio.length === 0 ? (
                  <p className="text-xs text-label-secondary text-center py-6">
                    Aún no hay pagos históricos registrados para este servicio.
                  </p>
                ) : (
                  <div className="rounded-2xl bg-tertiary/30 border border-separator divide-y divide-[var(--separator)] overflow-hidden">
                    {historialServicio.map((h) => {
                      const presup = h.monto_presupuestado ?? servicioActivo.monto;
                      const diff = h.monto_pagado - presup;
                      const fechaFmt = new Date(h.fecha_pago).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });

                      return (
                        <div
                          key={h.id}
                          className="p-3.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-semibold text-label-primary">{fechaFmt}</p>
                            <p className="text-label-secondary">
                              Registrado por {h.usuario?.nombre || 'Habitante'}
                            </p>
                            {h.observaciones && (
                              <p className="text-label-tertiary truncate">{h.observaciones}</p>
                            )}
                            {h.comprobante_url && (
                              <button
                                type="button"
                                onClick={() =>
                                  setComprobantePreview({
                                    titulo: `${servicioActivo.nombre_servicio} · ${fechaFmt}`,
                                    url: h.comprobante_url!,
                                    monto: h.monto_pagado,
                                    extra: `Gestionado por ${h.usuario?.nombre || 'Habitante'}`,
                                  })
                                }
                                className="text-mint font-medium inline-flex items-center gap-1 hover:underline mt-0.5"
                              >
                                <FileText size={11} />
                                <span>Ver comprobante</span>
                              </button>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-label-primary">
                              {formatCOP(h.monto_pagado)}
                            </p>
                            <span
                              className={`text-[10px] font-medium ${
                                diff > 0
                                  ? 'text-terracotta'
                                  : diff < 0
                                  ? 'text-mint'
                                  : 'text-label-tertiary'
                              }`}
                            >
                              {diff === 0
                                ? 'Igual al est.'
                                : diff > 0
                                ? `+${formatCompact(diff)} vs est.`
                                : `${formatCompact(diff)} ahorro`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VISTA 3: CONFIGURAR (EDITAR Y ELIMINAR SERVICIO) */}
            {sheetTab === 'configurar' && (
              <form onSubmit={handleGuardarEdicionServicio} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">
                    Nombre del servicio
                  </label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-tertiary border border-separator text-sm text-label-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-label-secondary block mb-1">
                      Presupuesto est. ($)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      step="any"
                      value={editMontoPresupuesto}
                      onChange={(e) => setEditMontoPresupuesto(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-tertiary border border-separator text-sm font-semibold text-label-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-label-secondary block mb-1">
                      Día de corte (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={editDiaVencimiento}
                      onChange={(e) => setEditDiaVencimiento(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-tertiary border border-separator text-sm font-semibold text-label-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-label-secondary block mb-1">
                      Próximo vencimiento
                    </label>
                    <input
                      type="date"
                      value={editFechaVencimiento}
                      onChange={(e) => setEditFechaVencimiento(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-label-secondary block mb-1">
                      Periodicidad
                    </label>
                    <select
                      value={editPeriodicidad}
                      onChange={(e) => setEditPeriodicidad(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary"
                    >
                      <option value="1">Mensual (1 mes)</option>
                      <option value="2">Bimestral (2 meses)</option>
                      <option value="3">Trimestral (3 meses)</option>
                      <option value="6">Semestral (6 meses)</option>
                      <option value="12">Anual (12 meses)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">
                    Referencia / Número de cuenta
                  </label>
                  <input
                    type="text"
                    value={editReferencia}
                    onChange={(e) => setEditReferencia(e.target.value)}
                    placeholder="Ej. NIC 4829103"
                    className="w-full px-3.5 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary"
                  />
                </div>

                {initialHabitantes.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-label-secondary block mb-1">
                      Habitante encargado de gestionar el recibo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {initialHabitantes.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() =>
                            setEditResponsableId((prev) => (prev === h.id ? '' : h.id))
                          }
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all truncate ${
                            editResponsableId === h.id
                              ? 'bg-terracotta text-white border-terracotta'
                              : 'bg-tertiary text-label-primary border-separator'
                          }`}
                        >
                          {h.nombre.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-terracotta text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    <span>Guardar cambios del servicio</span>
                  </button>

                  {!confirmandoEliminar ? (
                    <button
                      type="button"
                      onClick={() => setConfirmandoEliminar(true)}
                      className="w-full py-2.5 rounded-xl text-terracotta text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-terracotta/10 transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Eliminar este servicio</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-terracotta/10 border border-terracotta/30 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-label-primary">
                        ¿Seguro que deseas borrarlo?
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmandoEliminar(false)}
                          className="px-2.5 py-1 rounded-lg bg-tertiary text-xs font-medium"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmarEliminarServicio}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 rounded-lg bg-terracotta text-white text-xs font-semibold"
                        >
                          Sí, borrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          MODAL PARA CREAR NUEVO SERVICIO RECURRENTE
         ==================================================================== */}
      {mounted && modalNuevoServicio && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setModalNuevoServicio(false)}
        >
          <form
            onSubmit={handleCrearNuevoServicio}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-secondary-solid p-5 border-t sm:border border-separator shadow-xl animate-fade-in-up max-h-[88dvh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 shrink-0 border-b border-separator/40">
              <div>
                <span className="text-xs font-medium text-label-secondary">
                  Compromiso Recurrente
                </span>
                <h3 className="text-lg font-bold text-label-primary">Nuevo Servicio del Hogar</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoServicio(false)}
                className="p-1.5 rounded-full bg-tertiary text-label-secondary hover:text-label-primary cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 min-h-0 pt-3">
              <div>
                <label className="text-xs font-semibold text-label-secondary block mb-1">
                  Nombre del servicio
                </label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Energía, Internet, Administración..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-tertiary border border-separator text-sm text-label-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">
                    Presupuesto estimado ($)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={nuevoMonto}
                    onChange={(e) => setNuevoMonto(e.target.value)}
                    placeholder="100000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-tertiary border border-separator text-sm font-bold text-label-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">
                    Día de corte (1-31)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={nuevoDia}
                    onChange={(e) => setNuevoDia(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-tertiary border border-separator text-sm font-bold text-label-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">
                    Próximo vencimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={nuevaFechaVenc}
                    onChange={(e) => setNuevaFechaVenc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">
                    Periodicidad
                  </label>
                  <select
                    value={nuevaPeriodicidad}
                    onChange={(e) => setNuevaPeriodicidad(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary"
                  >
                    <option value="1">Mensual (1 mes)</option>
                    <option value="2">Bimestral (2 meses)</option>
                    <option value="3">Trimestral (3 meses)</option>
                    <option value="12">Anual (12 meses)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-label-secondary block mb-1">
                  Número de referencia o convenio (opcional)
                </label>
                <input
                  type="text"
                  value={nuevaReferencia}
                  onChange={(e) => setNuevaReferencia(e.target.value)}
                  placeholder="Ej. NIC 482910"
                  className="w-full px-3.5 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary"
                />
              </div>

              {initialHabitantes.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">
                    Habitante encargado de gestionarlo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {initialHabitantes.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() =>
                          setNuevoResponsableId((prev) => (prev === h.id ? '' : h.id))
                        }
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all truncate ${
                          nuevoResponsableId === h.id
                            ? 'bg-terracotta text-white border-terracotta'
                            : 'bg-tertiary text-label-primary border-separator'
                        }`}
                      >
                        {h.nombre.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 shrink-0 border-t border-separator/40 pb-[env(safe-area-inset-bottom,0px)]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-terracotta text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                <span>Crear servicio</span>
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ====================================================================
          HOJA DESLIZABLE PARA SUBIR APORTE AL FONDO COMÚN
         ==================================================================== */}
      {mounted && modalAporteOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setModalAporteOpen(false)}
        >
          <form
            onSubmit={handleGuardarAporte}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-secondary-solid p-5 border-t sm:border border-separator shadow-xl animate-fade-in-up max-h-[88dvh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 shrink-0 border-b border-separator/40">
              <div>
                <span className="text-xs font-medium text-label-secondary">
                  Fondo Común · {mesLabelLargo}
                </span>
                <h3 className="text-lg font-bold text-label-primary">
                  Registrar Aporte a la Bolsa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAporteOpen(false)}
                className="p-1.5 rounded-full bg-tertiary text-label-secondary hover:text-label-primary cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 min-h-0 pt-3">
              {initialHabitantes.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">
                    ¿Quién realiza el aporte?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {initialHabitantes.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setAporteHabId(h.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all truncate ${
                          aporteHabId === h.id
                            ? 'bg-terracotta text-white border-terracotta'
                            : 'bg-tertiary text-label-primary border-separator'
                        }`}
                      >
                        {h.nombre.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-label-secondary block mb-1">
                  Monto enviado a la bolsa común ($)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step="any"
                  value={aporteMonto}
                  onChange={(e) => setAporteMonto(e.target.value)}
                  placeholder="300000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-tertiary border border-separator text-sm font-bold text-label-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-label-secondary block mb-1">
                  Nota o referencia
                </label>
                <input
                  type="text"
                  value={aporteNota}
                  onChange={(e) => setAporteNota(e.target.value)}
                  placeholder={`Aporte ${mesLabelCorto}`}
                  className="w-full px-3.5 py-2 rounded-xl bg-tertiary border border-separator text-xs text-label-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-label-secondary block mb-1">
                  Comprobante de transferencia (Imagen o PDF)
                </label>
                <label className="px-3.5 py-2.5 rounded-xl bg-tertiary/60 border border-dashed border-separator flex items-center justify-between text-xs cursor-pointer hover:bg-tertiary transition-colors">
                  <span className="flex items-center gap-2 text-label-primary truncate">
                    <Upload size={14} className="text-mint shrink-0" />
                    <span className="truncate">
                      {aporteFile
                        ? aporteFile.name
                        : 'Adjuntar captura o recibo de transferencia'}
                    </span>
                  </span>
                  <span className="text-mint font-semibold shrink-0 ml-2">
                    {aporteFile ? 'Listo' : 'Subir'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setAporteFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div className="pt-3 shrink-0 border-t border-separator/40 pb-[env(safe-area-inset-bottom,0px)]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-terracotta text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                <span>Guardar Aporte en el Fondo Común</span>
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ====================================================================
          MODAL DE VISTA PREVIA DE COMPROBANTE / RECIBO
         ==================================================================== */}
      {mounted && comprobantePreview && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setComprobantePreview(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-secondary-solid p-5 space-y-4 border border-separator shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-label-primary truncate">
                {comprobantePreview.titulo}
              </h3>
              <button
                type="button"
                onClick={() => setComprobantePreview(null)}
                className="p-1 rounded-full bg-tertiary text-label-secondary hover:text-label-primary cursor-pointer"
                aria-label="Cerrar vista previa"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-tertiary/50 border border-separator text-center space-y-3">
              {comprobantePreview.url.startsWith('http') &&
              !comprobantePreview.url.toLowerCase().endsWith('.pdf') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comprobantePreview.url}
                  alt={comprobantePreview.titulo}
                  className="max-h-64 w-auto mx-auto rounded-xl object-contain border border-separator"
                />
              ) : (
                <Receipt size={36} className="mx-auto text-mint" />
              )}

              <p className="text-xl font-bold text-label-primary">
                {formatCOP(comprobantePreview.monto)}
              </p>
              {comprobantePreview.extra && (
                <p className="text-xs text-label-secondary">{comprobantePreview.extra}</p>
              )}

              {comprobantePreview.url.startsWith('http') && (
                <a
                  href={comprobantePreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:underline"
                >
                  <span>Abrir archivo original</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
