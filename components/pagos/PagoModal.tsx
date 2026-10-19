'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ServicioConEstado,
  registrarPagoServicio,
  getHistorialPagos,
} from '@/actions/pagos';
import GlassDatePicker from '@/components/ui/GlassDatePicker';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import {
  X,
  CreditCard,
  History,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  User,
  ExternalLink,
  Receipt,
  AlertCircle,
  FileCheck,
  Loader2,
  Zap,
  ChevronDown,
} from 'lucide-react';

interface PagoModalProps {
  servicio: ServicioConEstado | null;
  pestanaInicial?: 'pago' | 'historial';
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

type HistorialItem = {
  id: string;
  monto_pagado: number;
  fecha_pago: string;
  comprobante_url: string | null;
  observaciones: string | null;
  usuario: {
    nombre: string;
    email: string;
  };
};

type FaseEnvio = 'idle' | 'comprimiendo' | 'subiendo' | 'confirmando';

// Función para compresión ligera de comprobantes en el cliente (<200ms)
async function compressImageFile(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Si la imagen ya es pequeña y pesa menos de 500 KB, preservar original
      if (width <= maxDimension && height <= maxDimension && file.size < 500 * 1024) {
        resolve(file);
        return;
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
          } else {
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export default function PagoModal({
  servicio,
  pestanaInicial = 'pago',
  onClose,
  onSuccess,
}: PagoModalProps) {
  const [mounted, setMounted] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState<'pago' | 'historial'>(pestanaInicial);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [faseEnvio, setFaseEnvio] = useState<FaseEnvio>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mostrarFormularioCompleto, setMostrarFormularioCompleto] = useState(false);

  // Estado reactivo local del servicio (para actualizar fecha de vencimiento ante concurrencia)
  const [servicioLocal, setServicioLocal] = useState<ServicioConEstado | null>(servicio);
  const [conflictoConcurrencia, setConflictoConcurrencia] = useState<{
    mensaje: string;
    nuevoVencimiento: string;
  } | null>(null);

  const servicioActual = servicioLocal || servicio;

  // Campos de Registro de Pago
  const [montoPagado, setMontoPagado] = useState<string>('');
  const [fechaPago, setFechaPago] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPestanaActiva(pestanaInicial);
  }, [pestanaInicial]);

  // Cargar datos cuando cambia el servicio
  useEffect(() => {
    if (servicio) {
      setServicioLocal(servicio);
      setMontoPagado(servicio.monto ? servicio.monto.toString() : '');
      const hoyStr = new Date().toISOString().split('T')[0];
      setFechaPago(hoyStr);
      setObservaciones('');
      setArchivoSeleccionado(null);
      setPreviewUrl(null);
      setErrorMsg(null);
      setConflictoConcurrencia(null);
      setMostrarFormularioCompleto(!servicio.monto || servicio.monto <= 0);
    } else {
      setServicioLocal(null);
      setErrorMsg(null);
      setConflictoConcurrencia(null);
    }
  }, [servicio]);

  useEffect(() => {
    if (servicio) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [servicio, onClose]);

  async function cargarHistorial() {
    if (!servicioActual) return;
    setCargandoHistorial(true);
    const res = await getHistorialPagos(servicioActual.id);
    if (res.success && res.data) {
      setHistorial(res.data as HistorialItem[]);
    }
    setCargandoHistorial(false);
  }

  useEffect(() => {
    if (servicioActual && pestanaActiva === 'historial') {
      cargarHistorial();
    }
  }, [servicioActual, pestanaActiva]);

  if (!servicio || !servicioActual || !mounted) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoSeleccionado(file);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  }

  async function handleSubmitPago(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!servicioActual) return;

    setErrorMsg(null);
    setConflictoConcurrencia(null);
    setProcesando(true);

    try {
      let archivoAEnviar = archivoSeleccionado;
      if (archivoSeleccionado && archivoSeleccionado.type.startsWith('image/')) {
        setFaseEnvio('comprimiendo');
        archivoAEnviar = await compressImageFile(archivoSeleccionado);
      }

      setFaseEnvio(archivoAEnviar ? 'subiendo' : 'confirmando');

      const formData = new FormData();
      formData.set('servicio_id', servicioActual.id);
      formData.set('monto_pagado', montoPagado);
      formData.set('fecha_pago', fechaPago);
      formData.set(
        'fecha_vencimiento_esperada',
        new Date(servicioActual.fecha_vencimiento).toISOString()
      );
      if (observaciones) {
        formData.set('observaciones', observaciones);
      }
      if (archivoAEnviar) {
        formData.set('comprobante', archivoAEnviar);
      }

      setFaseEnvio('confirmando');
      const res = await registrarPagoServicio(formData);

      if (res.success) {
        onSuccess(`¡Pago de "${servicioActual.nombre_servicio}" registrado exitosamente!`);
        onClose();
      } else if (res.code === 'CONCURRENCY_CYCLE_MISMATCH') {
        // Manejo reactivo de conflicto concurrente: actualizar ciclo y consultar historial
        if (res.proximoVencimiento) {
          setServicioLocal((prev) =>
            prev
              ? {
                  ...prev,
                  fecha_vencimiento: res.proximoVencimiento!,
                  estado: res.estado || 'PENDIENTE',
                }
              : null
          );
        }
        setConflictoConcurrencia({
          mensaje: res.error || 'Esta factura ya fue pagada por otro habitante.',
          nuevoVencimiento: res.proximoVencimiento || '',
        });
        await cargarHistorial();
        onSuccess('Sincronizado: el servicio ya fue pagado por otro habitante');
      } else if (res.code === 'IDEMPOTENCY_DUPLICATE') {
        await cargarHistorial();
        setPestanaActiva('historial');
        setErrorMsg(res.error || 'Pago duplicado detectado');
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al registrar el pago');
      }
    } catch (err: any) {
      console.error('Error al registrar pago:', err);
      setErrorMsg(err?.message || 'Error de conexión al registrar pago');
    } finally {
      setProcesando(false);
      setFaseEnvio('idle');
    }
  }

  async function handleQuickSubmitPago() {
    if (!servicioActual || procesando) return;

    setErrorMsg(null);
    setConflictoConcurrencia(null);
    setProcesando(true);
    setFaseEnvio('confirmando');

    try {
      const formData = new FormData();
      formData.set('servicio_id', servicioActual.id);
      formData.set('monto_pagado', servicioActual.monto.toString());
      formData.set('fecha_pago', new Date().toISOString().split('T')[0]);
      formData.set(
        'fecha_vencimiento_esperada',
        new Date(servicioActual.fecha_vencimiento).toISOString()
      );
      formData.set('observaciones', 'Pago rápido pre-aprobado');

      const res = await registrarPagoServicio(formData);

      if (res.success) {
        onSuccess(`¡Pago express de "${servicioActual.nombre_servicio}" registrado exitosamente!`);
        onClose();
      } else if (res.code === 'CONCURRENCY_CYCLE_MISMATCH') {
        if (res.proximoVencimiento) {
          setServicioLocal((prev) =>
            prev
              ? {
                  ...prev,
                  fecha_vencimiento: res.proximoVencimiento!,
                  estado: res.estado || 'PENDIENTE',
                }
              : null
          );
        }
        setConflictoConcurrencia({
          mensaje: res.error || 'Esta factura ya fue pagada por otro habitante.',
          nuevoVencimiento: res.proximoVencimiento || '',
        });
        await cargarHistorial();
        onSuccess('Sincronizado: el servicio ya fue pagado por otro habitante');
      } else if (res.code === 'IDEMPOTENCY_DUPLICATE') {
        await cargarHistorial();
        setPestanaActiva('historial');
        setErrorMsg(res.error || 'Pago duplicado detectado');
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al registrar el pago express');
      }
    } catch (err: any) {
      console.error('Error al registrar pago express:', err);
      setErrorMsg(err?.message || 'Error de conexión al registrar pago');
    } finally {
      setProcesando(false);
      setFaseEnvio('idle');
    }
  }

  const fVenc = new Date(servicioActual.fecha_vencimiento);
  const fechaVencFormateada = fVenc.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Clic fuera para cerrar */}
      <div
        className="absolute inset-0 z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 glass-modal w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[calc(100vh-3.5rem)] border-t sm:border border-separator animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Asa táctil superior estilo Apple HIG Bottom Sheet */}
        <div className="sm:hidden w-10 h-1.5 bg-separator-opaque rounded-full mx-auto my-2 shrink-0" />
        
        {/* Cabecera Fija */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-5 border-b border-separator bg-secondary/85 backdrop-blur-md shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="absolute top-4 right-4 sm:right-6 z-20 w-11 h-11 rounded-full bg-tertiary text-label-secondary hover:text-label-primary hover:bg-tertiary-hover transition flex items-center justify-center cursor-pointer border border-separator active:scale-90"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-3.5 pr-14">
            <div className="w-12 h-12 rounded-2xl bg-terracotta/15 border border-terracotta/30 text-terracotta flex items-center justify-center shadow-2xs shrink-0">
              <Receipt size={24} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2 className="apple-title-3 font-semibold text-label-primary tracking-tight truncate">
                {servicioActual.nombre_servicio}
              </h2>
              <p className="apple-subhead text-label-secondary font-normal flex items-center gap-1.5 pt-0.5">
                <span>Vencimiento:</span>
                <strong className="text-label-primary font-semibold tabular-nums">
                  {fechaVencFormateada}
                </strong>
                {servicioActual.estadoVencimiento === 'VENCIDO' && (
                  <span className="text-terracotta font-medium text-[11px]">
                    (Atrasado {Math.abs(servicioActual.diasRestantes)}d)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas Segmentado Apple HIG */}
        <div className="p-3.5 border-b border-separator shrink-0">
          <SegmentedControl<'pago' | 'historial'>
            options={[
              {
                value: 'pago',
                label: (
                  <>
                    <span className="sm:hidden">Pago</span>
                    <span className="hidden sm:inline">Registrar pago</span>
                  </>
                ),
                icon: CreditCard,
              },
              {
                value: 'historial',
                label: (
                  <>
                    <span className="sm:hidden">Historial</span>
                    <span className="hidden sm:inline">Historial de recibos</span>
                  </>
                ),
                icon: History,
              },
            ]}
            value={pestanaActiva}
            onChange={(val) => setPestanaActiva(val)}
            ariaLabel="Pestañas de pago de servicio"
          />
        </div>

        {/* Contenido Modular con Scroll */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {pestanaActiva === 'pago' ? (
            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-terracotta/15 border border-terracotta/30 text-terracotta rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ALERTA REACTIVA DE CONFLICTO DE CONCURRENCIA */}
              {conflictoConcurrencia && (
                <div className="p-4 bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 rounded-2xl text-xs space-y-2.5 animate-fade-in-up">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                        Factura ya liquidada por otro habitante
                      </p>
                      <p className="text-amber-800 dark:text-amber-300">
                        {conflictoConcurrencia.mensaje}
                      </p>
                      {conflictoConcurrencia.nuevoVencimiento && (
                        <p className="text-amber-700 dark:text-amber-400 font-medium">
                          Próximo vencimiento programado:{' '}
                          <span className="font-bold underline">
                            {new Date(conflictoConcurrencia.nuevoVencimiento).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setPestanaActiva('historial')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Receipt size={14} />
                      <span>Ver comprobante en el historial</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TARJETA DE PRE-APROBACIÓN EXPRESS (1 TOQUE) */}
              {servicioActual.monto > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-tertiary border border-separator space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-terracotta text-white flex items-center justify-center shadow-xs shrink-0">
                        <Zap size={20} className="fill-white" />
                      </div>
                      <div>
                        <h4 className="apple-subhead font-semibold text-label-primary">
                          Pre-Aprobación Express
                        </h4>
                        <p className="apple-caption-2 text-label-secondary">
                          Monto presupuestado fijo • Fecha de hoy
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="apple-title-3 font-bold text-terracotta tabular-nums">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0,
                        }).format(servicioActual.monto)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={procesando}
                    onClick={handleQuickSubmitPago}
                    className="w-full py-3 bg-terracotta hover:bg-terracotta-hover text-white font-semibold text-sm rounded-xl transition shadow-md shadow-terracotta/25 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {procesando ? (
                      <>
                        <Loader2 size={16} className="animate-spin shrink-0" />
                        <span>
                          {faseEnvio === 'comprimiendo'
                            ? 'Optimizando comprobante...'
                            : faseEnvio === 'subiendo'
                            ? 'Subiendo comprobante...'
                            : 'Confirmando transacción segura...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} strokeWidth={2.5} className="shrink-0" />
                        <span>
                          Confirmar Pago Express (
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            maximumFractionDigits: 0,
                          }).format(servicioActual.monto)}
                          )
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* BOTÓN COLAPSABLE PARA PERSONALIZACIÓN DETALLADA */}
              {servicioActual.monto > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setMostrarFormularioCompleto(!mostrarFormularioCompleto)}
                    className="w-full min-h-[44px] py-2.5 px-3.5 text-xs font-semibold text-label-secondary hover:text-label-primary bg-secondary/60 hover:bg-secondary dark:bg-tertiary/40 dark:hover:bg-tertiary/70 rounded-xl transition flex items-center justify-between cursor-pointer border border-separator shadow-2xs"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={14} className="text-terracotta" />
                      <span>
                        {mostrarFormularioCompleto
                          ? 'Ocultar campos detallados'
                          : '¿Deseas cambiar el monto, fecha o adjuntar comprobante? Personalizar pago'}
                      </span>
                    </span>
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${
                        mostrarFormularioCompleto ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* FORMULARIO EXTENDIDO DETALLADO (4 PASOS) */}
              {mostrarFormularioCompleto && (
                <form id="form-pago-completo" onSubmit={handleSubmitPago} className="space-y-4 pt-1 animate-fade-in-up">
                  {/* MONTO PAGADO */}
                  <div>
                    <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                      Monto real pagado ($) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-terracotta">
                        <DollarSign size={16} strokeWidth={2.2} />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={montoPagado}
                        onChange={(e) => setMontoPagado(e.target.value)}
                        placeholder="Monto exacto cancelado"
                        className="w-full pl-10 pr-4 py-3 bg-secondary/80 dark:bg-tertiary/60 border border-separator rounded-2xl text-sm text-label-primary font-medium tabular-nums placeholder:text-label-tertiary focus:outline-none focus:bg-secondary focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* FECHA DEL PAGO */}
                  <div>
                    <GlassDatePicker
                      label="Fecha del Pago"
                      value={fechaPago}
                      onChange={setFechaPago}
                      name="fecha_pago"
                      required
                      shortcuts={[
                        { label: 'Hoy', daysOffset: 0 },
                        { label: 'Ayer', daysOffset: -1 },
                        { label: 'Hace 3 días', daysOffset: -3 },
                      ]}
                      helperText={`La próxima fecha de vencimiento se calculará a partir de esta fecha sumando ${servicioActual.periodicidad_meses || 1} ${servicioActual.periodicidad_meses === 1 ? 'mes' : 'meses'}.`}
                    />
                  </div>

                  {/* SUBIDA DE COMPROBANTE / SOPORTE */}
                  <div>
                    <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                      Comprobante o factura adjunta (opcional)
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative p-4 rounded-2xl border-2 border-dashed border-separator bg-tertiary/30 hover:bg-tertiary/60 transition cursor-pointer flex flex-col items-center justify-center text-center group shadow-2xs"
                    >
                      {archivoSeleccionado ? (
                        <div className="flex items-center gap-3">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-12 h-12 object-cover rounded-xl border border-separator"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-mint/15 text-mint flex items-center justify-center">
                              <FileCheck size={24} />
                            </div>
                          )}
                          <div className="text-left">
                            <p className="apple-caption-1 font-semibold text-label-primary truncate max-w-[200px]">
                              {archivoSeleccionado.name}
                            </p>
                            <p className="apple-caption-2 text-mint font-medium">
                              Toca para cambiar comprobante
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="w-9 h-9 rounded-xl bg-mint/15 text-mint flex items-center justify-center mx-auto group-hover:scale-110 transition">
                            <Upload size={18} />
                          </div>
                          <p className="apple-caption-1 font-semibold text-label-primary">
                            Adjuntar foto del recibo o PDF
                          </p>
                          <p className="apple-caption-2 text-label-secondary font-normal">
                            Formatos JPG, PNG o documento PDF (optimización automática)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* OBSERVACIONES / NOTAS */}
                  <div>
                    <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                      Observaciones o referencia de transferencia
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-label-secondary">
                        <FileText size={15} strokeWidth={2.2} />
                      </div>
                      <input
                        type="text"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Ej. Transferencia Nequi ref #9872"
                        className="w-full pl-10 pr-4 py-3 bg-secondary/80 dark:bg-tertiary/60 border border-separator rounded-2xl text-sm text-label-primary font-medium placeholder:text-label-tertiary focus:outline-none focus:bg-secondary focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="apple-footnote font-normal text-label-secondary">
                Historial cronológico de recibos pagados para este servicio:
              </p>

              {cargandoHistorial ? (
                <div className="py-8 text-center text-xs text-label-secondary animate-pulse">
                  Cargando recibos anteriores...
                </div>
              ) : historial.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="Sin recibos pagados"
                  description="Aún no se han registrado pagos previos para este servicio recurrente."
                  compact={true}
                />
              ) : (
                <div className="space-y-2.5">
                  {historial.map((pago) => {
                    const fPago = new Date(pago.fecha_pago).toLocaleDateString(
                      'es-CO',
                      {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }
                    );

                    const valorFormateado = new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0,
                    }).format(pago.monto_pagado);

                    return (
                      <div
                        key={pago.id}
                        className="p-3.5 bg-secondary/80 dark:bg-tertiary/60 rounded-2xl border border-separator flex items-start gap-3 shadow-2xs"
                      >
                        <div className="w-8 h-8 rounded-xl bg-mint/15 text-mint flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 size={16} strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="apple-footnote font-bold text-label-primary tabular-nums">
                              {valorFormateado}
                            </span>
                            <span className="apple-caption-2 font-normal text-label-secondary tabular-nums">
                              {fPago}
                            </span>
                          </div>

                          <p className="apple-caption-2 text-label-secondary flex items-center gap-1 mt-0.5 font-normal">
                            <User size={11} />
                            <span>Pagado por {pago.usuario.nombre}</span>
                            {pago.observaciones && (
                              <span className="italic">• {pago.observaciones}</span>
                            )}
                          </p>

                          {/* Enlace al Comprobante si existe */}
                          {pago.comprobante_url && (
                            <div className="pt-1.5">
                              <a
                                href={pago.comprobante_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-hover bg-terracotta/10 px-3 py-2 min-h-[44px] rounded-xl border border-terracotta/25 transition active:scale-95"
                              >
                                <ExternalLink size={12} />
                                <span>Ver comprobante adjunto</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barra de Confirmación Anclada en la Base (Sticky Bottom Bar conforme a Apple HIG) */}
        {pestanaActiva === 'pago' ? (
          <div className="sticky bottom-0 bg-secondary/95 backdrop-blur-xl border-t border-separator p-4 sm:p-5 pb-safe z-20 shrink-0 flex gap-3 shadow-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={procesando}
              className="flex-1 btn-apple-gray text-sm font-semibold justify-center cursor-pointer min-h-[44px]"
            >
              Cancelar
            </button>
            {mostrarFormularioCompleto ? (
              <button
                type="submit"
                form="form-pago-completo"
                disabled={procesando}
                className="flex-1 btn-apple-filled text-sm font-semibold justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                {procesando ? (
                  <>
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span>
                      {faseEnvio === 'comprimiendo'
                        ? 'Optimizando comprobante...'
                        : faseEnvio === 'subiendo'
                        ? 'Subiendo comprobante...'
                        : 'Confirmando transacción...'}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} strokeWidth={2.4} className="shrink-0" />
                    <span>Confirmar pago</span>
                  </>
                )}
              </button>
            ) : servicioActual.monto > 0 ? (
              <button
                type="button"
                onClick={handleQuickSubmitPago}
                disabled={procesando}
                className="flex-1 btn-apple-filled text-sm font-semibold justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                {procesando ? (
                  <>
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span>Procesando pago express...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} className="fill-white shrink-0" />
                    <span>
                      Pago Express ({new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        maximumFractionDigits: 0,
                      }).format(servicioActual.monto)})
                    </span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarFormularioCompleto(true)}
                className="flex-1 btn-apple-filled text-sm font-semibold justify-center min-h-[44px]"
              >
                Registrar monto
              </button>
            )}
          </div>
        ) : (
          <div className="sticky bottom-0 bg-secondary/95 backdrop-blur-xl border-t border-separator p-4 sm:p-5 pb-safe z-20 shrink-0 flex justify-end shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 btn-apple-gray text-sm font-semibold justify-center cursor-pointer min-h-[44px]"
            >
              Cerrar
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
