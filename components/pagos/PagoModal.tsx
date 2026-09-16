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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setMontoPagado(servicio.monto ? servicio.monto.toString() : '');
      const hoyStr = new Date().toISOString().split('T')[0];
      setFechaPago(hoyStr);
      setObservaciones('');
      setArchivoSeleccionado(null);
      setPreviewUrl(null);
      setErrorMsg(null);
    }
  }, [servicio]);

  useEffect(() => {
    if (servicio) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [servicio]);

  async function cargarHistorial() {
    if (!servicio) return;
    setCargandoHistorial(true);
    const res = await getHistorialPagos(servicio.id);
    if (res.success && res.data) {
      setHistorial(res.data as HistorialItem[]);
    }
    setCargandoHistorial(false);
  }

  useEffect(() => {
    if (servicio && pestanaActiva === 'historial') {
      cargarHistorial();
    }
  }, [servicio, pestanaActiva]);

  if (!servicio || !mounted) return null;

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
    if (!servicio) return;

    setErrorMsg(null);
    setProcesando(true);

    try {
      const formData = new FormData();
      formData.set('servicio_id', servicio.id);
      formData.set('monto_pagado', montoPagado);
      formData.set('fecha_pago', fechaPago);
      if (observaciones) {
        formData.set('observaciones', observaciones);
      }
      if (archivoSeleccionado) {
        formData.set('comprobante', archivoSeleccionado);
      }

      const res = await registrarPagoServicio(formData);

      if (res.success) {
        onSuccess(`¡Pago de "${servicio.nombre_servicio}" registrado exitosamente!`);
        await cargarHistorial();
        setPestanaActiva('historial');
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al registrar el pago');
      }
    } catch (err: any) {
      console.error('Error al registrar pago:', err);
      setErrorMsg(err?.message || 'Error de conexión al registrar pago');
    } finally {
      setProcesando(false);
    }
  }

  const fVenc = new Date(servicio.fecha_vencimiento);
  const fechaVencFormateada = fVenc.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Clic fuera para cerrar */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative glass-modal w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col my-auto max-h-[calc(100vh-3.5rem)] border border-white/80 dark:border-white/10 animate-fade-in-up">
        
        {/* Cabecera Fija */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b border-[#E8E0D2]/80 dark:border-separator bg-white/85 dark:bg-[#1C1F1A]/85 backdrop-blur-md shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="absolute top-5 right-6 sm:right-8 w-9 h-9 rounded-full bg-[#F4EFE6] dark:bg-tertiary text-label-secondary hover:text-label-primary hover:bg-[#E8E0D2] dark:hover:bg-secondary transition flex items-center justify-center cursor-pointer border border-[#E8E0D2] dark:border-separator active:scale-90"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FDF2EC] to-[#FAE2D8] dark:from-terracotta/20 dark:to-terracotta/10 border border-[#FADBD0] dark:border-terracotta/30 text-terracotta flex items-center justify-center shadow-2xs shrink-0">
              <Receipt size={24} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-[#3A4630] dark:text-label-primary tracking-tight truncate">
                {servicio.nombre_servicio}
              </h2>
              <p className="text-xs text-label-secondary font-medium flex items-center gap-1.5 pt-0.5">
                <span>Vencimiento:</span>
                <strong className="text-[#3A4630] dark:text-label-primary font-bold capitalize">
                  {fechaVencFormateada}
                </strong>
                {servicio.estadoVencimiento === 'VENCIDO' && (
                  <span className="text-[#B84626] dark:text-terracotta font-bold text-[11px]">
                    (Atrasado {Math.abs(servicio.diasRestantes)}d)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas Segmentado Apple HIG */}
        <div className="p-3.5 border-b border-[#E8E0D2] dark:border-separator shrink-0">
          <SegmentedControl<'pago' | 'historial'>
            options={[
              { value: 'pago', label: 'Registrar Pago', icon: CreditCard },
              { value: 'historial', label: 'Historial de Recibos', icon: History },
            ]}
            value={pestanaActiva}
            onChange={(val) => setPestanaActiva(val)}
            ariaLabel="Pestañas de pago de servicio"
          />
        </div>

        {/* Contenido Modular con Scroll */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {pestanaActiva === 'pago' ? (
            <form onSubmit={handleSubmitPago} className="space-y-4">
              
              {errorMsg && (
                <div className="p-3.5 bg-[#FAE2D8] dark:bg-terracotta/20 border border-[#F2BAA5] dark:border-terracotta/40 text-[#B84626] dark:text-terracotta rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* MONTO PAGADO */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                  Monto Real Pagado ($) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-olive">
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
                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-tertiary/60 border border-[#D9CEBC] dark:border-separator rounded-2xl text-sm text-[#191C16] dark:text-label-primary font-bold placeholder-[#A39E95] dark:placeholder-label-tertiary focus:outline-none focus:bg-white dark:focus:bg-tertiary focus:border-[#3A4630] dark:focus:border-olive focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
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
                  helperText={`La próxima fecha de vencimiento se calculará a partir de esta fecha sumando ${servicio.periodicidad_meses || 1} ${servicio.periodicidad_meses === 1 ? 'mes' : 'meses'}.`}
                />
              </div>

              {/* SUBIDA DE COMPROBANTE / SOPORTE */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                  Comprobante o Factura Adjunta (Opcional)
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
                  className="relative p-4 rounded-2xl border-2 border-dashed border-[#B7CBA9] dark:border-separator bg-white/50 dark:bg-tertiary/40 hover:bg-white/80 dark:hover:bg-tertiary/70 transition cursor-pointer flex flex-col items-center justify-center text-center group shadow-2xs"
                >
                  {archivoSeleccionado ? (
                    <div className="flex items-center gap-3">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-xl border border-[#DCE7D3] dark:border-separator"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#EEF2EA] dark:bg-[#282C25] text-olive flex items-center justify-center">
                          <FileCheck size={24} />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#3A4630] dark:text-label-primary truncate max-w-[200px]">
                          {archivoSeleccionado.name}
                        </p>
                        <p className="text-[11px] text-olive font-semibold">
                          Toca para cambiar comprobante
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-9 h-9 rounded-xl bg-[#EEF2EA] dark:bg-[#282C25] text-olive flex items-center justify-center mx-auto group-hover:scale-110 transition">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-bold text-[#3A4630] dark:text-label-primary">
                        Adjuntar foto del recibo o PDF
                      </p>
                      <p className="text-[10px] text-label-secondary">
                        Formatos JPG, PNG o documento PDF
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* OBSERVACIONES / NOTAS */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                  Observaciones o Referencia de Transferencia
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
                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-tertiary/60 border border-[#D9CEBC] dark:border-separator rounded-2xl text-sm text-[#191C16] dark:text-label-primary font-medium placeholder-[#A39E95] dark:placeholder-label-tertiary focus:outline-none focus:bg-white dark:focus:bg-tertiary focus:border-[#3A4630] dark:focus:border-olive focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* BOTONES */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-[#F4EFE6] dark:bg-tertiary hover:bg-[#E8E0D2] dark:hover:bg-tertiary/80 text-label-secondary dark:text-label-primary font-bold text-xs rounded-2xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#5F6F52] to-[#4E5D42] hover:from-[#4E5D42] hover:to-[#3A4630] text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-[#5F6F52]/25 disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                  <span>{procesando ? 'Procesando Pago...' : 'Confirmar Pago'}</span>
                </button>
              </div>

            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-label-secondary">
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
                        className="p-3.5 bg-white/80 dark:bg-tertiary/60 rounded-2xl border border-white dark:border-white/10 flex items-start gap-3 shadow-2xs"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#EEF2EA] dark:bg-secondary text-olive flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 size={16} strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-[#3A4630] dark:text-label-primary">
                              {valorFormateado}
                            </span>
                            <span className="text-[10px] font-medium text-label-secondary capitalize">
                              {fPago}
                            </span>
                          </div>

                          <p className="text-[11px] text-label-secondary flex items-center gap-1 mt-0.5">
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
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2B6CB0] dark:text-blue-sem hover:text-[#1A4971] bg-[#EEF4FB] dark:bg-blue-sem/20 px-2.5 py-1 rounded-xl border border-[#C3DAFE] dark:border-blue-sem/40 transition active:scale-95"
                              >
                                <ExternalLink size={11} />
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

      </div>
    </div>,
    document.body
  );
}
