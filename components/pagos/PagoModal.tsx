'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ServicioConEstado,
  registrarPagoServicio,
  getHistorialPagos,
} from '@/actions/pagos';
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

      <div className="relative glass-modal w-full max-w-lg rounded-[2.5rem] overflow-hidden max-h-[calc(100vh-3.5rem)] flex flex-col shadow-2xl animate-fade-in-up my-auto border border-white/80">
        
        {/* Cabecera del Servicio */}
        <div className="p-6 bg-gradient-to-br from-white/95 to-[#F4EFE6]/90 border-b border-[#E8E0D2] shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 text-[#736F68] hover:text-[#3A4630] transition flex items-center justify-center cursor-pointer border border-[#E8E0D2] active:scale-90"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FDF2EC] to-[#FAE2D8] border border-[#FADBD0] text-[#C86242] flex items-center justify-center shadow-2xs shrink-0">
              <Receipt size={24} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-[#3A4630] tracking-tight truncate">
                {servicio.nombre_servicio}
              </h2>
              <p className="text-xs text-[#736F68] font-medium flex items-center gap-1.5 pt-0.5">
                <span>Vencimiento:</span>
                <strong className="text-[#3A4630] font-bold capitalize">
                  {fechaVencFormateada}
                </strong>
                {servicio.estadoVencimiento === 'VENCIDO' && (
                  <span className="text-[#B84626] font-bold text-[11px]">
                    (Atrasado {Math.abs(servicio.diasRestantes)}d)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas Deslizante */}
        <div className="p-3 bg-[#F0EAE1]/60 backdrop-blur-xs flex gap-2 border-b border-[#E8E0D2] shrink-0">
          <button
            type="button"
            onClick={() => setPestanaActiva('pago')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              pestanaActiva === 'pago'
                ? 'bg-white text-[#3A4630] shadow-sm border border-white'
                : 'text-[#736F68] hover:text-[#3A4630]'
            }`}
          >
            <CreditCard
              size={14}
              className={pestanaActiva === 'pago' ? 'text-[#5F6F52]' : ''}
            />
            <span>Registrar Pago</span>
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('historial')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              pestanaActiva === 'historial'
                ? 'bg-white text-[#3A4630] shadow-sm border border-white'
                : 'text-[#736F68] hover:text-[#3A4630]'
            }`}
          >
            <History
              size={14}
              className={pestanaActiva === 'historial' ? 'text-[#5F6F52]' : ''}
            />
            <span>Historial de Recibos</span>
          </button>
        </div>

        {/* Contenido Modular con Scroll */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {pestanaActiva === 'pago' ? (
            <form onSubmit={handleSubmitPago} className="space-y-4">
              
              {errorMsg && (
                <div className="p-3.5 bg-[#FAE2D8] border border-[#F2BAA5] text-[#B84626] rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* MONTO PAGADO */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  Monto Real Pagado ($) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5F6F52]">
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
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-bold placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* FECHA DEL PAGO */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  Fecha del Pago *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5F6F52]">
                    <Calendar size={16} strokeWidth={2.2} />
                  </div>
                  <input
                    type="date"
                    required
                    value={fechaPago}
                    onChange={(e) => setFechaPago(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-[#736F68] mt-1">
                  La próxima fecha de vencimiento se calculará a partir de esta fecha sumando {servicio.periodicidad_meses || 1} {servicio.periodicidad_meses === 1 ? 'mes' : 'meses'}.
                </p>
              </div>

              {/* SUBIDA DE COMPROBANTE / SOPORTE */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
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
                  className="relative p-4 rounded-2xl border-2 border-dashed border-[#B7CBA9] bg-white/50 hover:bg-white/80 transition cursor-pointer flex flex-col items-center justify-center text-center group shadow-2xs"
                >
                  {archivoSeleccionado ? (
                    <div className="flex items-center gap-3">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-xl border border-[#DCE7D3]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#EEF2EA] text-[#5F6F52] flex items-center justify-center">
                          <FileCheck size={24} />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#3A4630] truncate max-w-[200px]">
                          {archivoSeleccionado.name}
                        </p>
                        <p className="text-[11px] text-[#5F6F52] font-semibold">
                          Toca para cambiar comprobante
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-9 h-9 rounded-xl bg-[#EEF2EA] text-[#5F6F52] flex items-center justify-center mx-auto group-hover:scale-110 transition">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-bold text-[#3A4630]">
                        Adjuntar foto del recibo o PDF
                      </p>
                      <p className="text-[10px] text-[#736F68]">
                        Formatos JPG, PNG o documento PDF
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* OBSERVACIONES / NOTAS */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  Observaciones o Referencia de Transferencia
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736F68]">
                    <FileText size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="text"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Ej. Transferencia Nequi ref #9872"
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* BOTONES */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-[#F4EFE6] hover:bg-[#E8E0D2] text-[#736F68] font-bold text-xs rounded-2xl transition cursor-pointer"
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
              <p className="text-xs font-semibold text-[#736F68]">
                Historial cronológico de recibos pagados para este servicio:
              </p>

              {cargandoHistorial ? (
                <div className="py-8 text-center text-xs text-[#736F68] animate-pulse">
                  Cargando recibos anteriores...
                </div>
              ) : historial.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#736F68] italic bg-white/50 rounded-2xl border border-[#E8E0D2]">
                  Aún no se han registrado pagos para este servicio.
                </div>
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
                        className="p-3.5 bg-white/80 rounded-2xl border border-white flex items-start gap-3 shadow-2xs"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#EEF2EA] text-[#3A4630] flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 size={16} strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-[#3A4630]">
                              {valorFormateado}
                            </span>
                            <span className="text-[10px] font-medium text-[#736F68] capitalize">
                              {fPago}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#736F68] flex items-center gap-1 mt-0.5">
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
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2B6CB0] hover:text-[#1A4971] bg-[#EEF4FB] px-2.5 py-1 rounded-xl border border-[#C3DAFE] transition active:scale-95"
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
