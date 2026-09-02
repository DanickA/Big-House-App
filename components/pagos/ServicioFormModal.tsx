'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ServicioConEstado, createServicio, updateServicio } from '@/actions/pagos';
import {
  X,
  Check,
  Receipt,
  DollarSign,
  Calendar,
  Repeat,
  Hash,
  Sparkles,
} from 'lucide-react';

interface ServicioFormModalProps {
  isOpen: boolean;
  servicioAEditar: ServicioConEstado | null;
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

const SERVICIOS_SUGERIDOS = [
  'Luz (Enel/Celsia)',
  'Agua (Acueducto)',
  'Gas Natural',
  'Internet Fibra',
  'Arriendo',
  'Administración',
  'Streaming (Netflix/Max)',
  'Telefonía Móvil',
];

const PERIODICIDADES = [
  { meses: 1, label: 'Mensual (1 mes)' },
  { meses: 2, label: 'Bimestral (2 meses)' },
  { meses: 3, label: 'Trimestral (3 meses)' },
  { meses: 6, label: 'Semestral (6 meses)' },
  { meses: 12, label: 'Anual (12 meses)' },
];

export default function ServicioFormModal({
  isOpen,
  servicioAEditar,
  onClose,
  onSuccess,
}: ServicioFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [periodicidadMeses, setPeriodicidadMeses] = useState<number>(1);
  const [diaVencimiento, setDiaVencimiento] = useState<string>('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (servicioAEditar) {
      setNombre(servicioAEditar.nombre_servicio || '');
      setMonto(servicioAEditar.monto ? servicioAEditar.monto.toString() : '');
      const fv = servicioAEditar.fecha_vencimiento
        ? new Date(servicioAEditar.fecha_vencimiento).toISOString().split('T')[0]
        : '';
      setFechaVencimiento(fv);
      setPeriodicidadMeses(servicioAEditar.periodicidad_meses || 1);
      setDiaVencimiento(
        servicioAEditar.dia_vencimiento ? servicioAEditar.dia_vencimiento.toString() : ''
      );
      setNumeroCuenta(servicioAEditar.numero_cuenta || '');
      setNumeroFactura(servicioAEditar.numero_factura || '');
    } else {
      setNombre('');
      setMonto('');
      // Por defecto fecha en 7 días
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const fvDef = d.toISOString().split('T')[0];
      setFechaVencimiento(fvDef);
      setDiaVencimiento(d.getDate().toString());
      setPeriodicidadMeses(1);
      setNumeroCuenta('');
      setNumeroFactura('');
    }
    setErrorMsg(null);
  }, [servicioAEditar, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  function handleFechaChange(val: string) {
    setFechaVencimiento(val);
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        setDiaVencimiento(parseInt(parts[2], 10).toString());
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setProcesando(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set('periodicidad_meses', periodicidadMeses.toString());
      if (diaVencimiento) {
        formData.set('dia_vencimiento', diaVencimiento);
      }

      const res = servicioAEditar
        ? await updateServicio(servicioAEditar.id, formData)
        : await createServicio(formData);

      if (res.success) {
        onSuccess(
          servicioAEditar
            ? '¡Servicio actualizado correctamente!'
            : '¡Nuevo servicio registrado con éxito!'
        );
        onClose();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al guardar el servicio');
      }
    } catch (err: any) {
      console.error('Error al guardar servicio:', err);
      setErrorMsg(err?.message || 'Error de conexión');
    } finally {
      setProcesando(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Fondo oscuro para cerrar */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative glass-modal w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col my-auto max-h-[calc(100vh-3.5rem)] border border-white/80 animate-fade-in-up">
        
        {/* Cabecera Fija */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b border-[#E8E0D2]/80 bg-white/85 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FDF2EC] to-[#FAE2D8] border border-[#FADBD0] text-[#C86242] flex items-center justify-center shadow-2xs">
              <Receipt size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#3A4630] tracking-tight">
                {servicioAEditar ? 'Editar Servicio' : 'Nuevo Servicio o Cuenta'}
              </h2>
              <p className="text-xs text-[#736F68] font-medium">
                {servicioAEditar
                  ? 'Modifica los datos del compromiso recurrente'
                  : 'Registra un servicio recurrente del hogar'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F4EFE6] text-[#736F68] hover:text-[#3A4630] hover:bg-[#E8E0D2] transition flex items-center justify-center cursor-pointer border border-[#E8E0D2] active:scale-90"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1 pr-5 sm:pr-7">
          
          {errorMsg && (
            <div className="p-3.5 bg-[#FAE2D8] border border-[#F2BAA5] text-[#B84626] rounded-2xl text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* NOMBRE DEL SERVICIO */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                Nombre del Servicio o Cuenta *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5F6F52]">
                  <Receipt size={16} strokeWidth={2.2} />
                </div>
                <input
                  type="text"
                  name="nombre_servicio"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Luz Enel, Agua, Fibra Óptica"
                  className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                />
              </div>

              {/* Sugerencias Rápidas */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <span className="text-[10px] font-bold text-[#736F68] uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>Sugerencias:</span>
                </span>
                {SERVICIOS_SUGERIDOS.slice(0, 5).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setNombre(sug)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer active:scale-95 bg-white/70 hover:bg-white text-[#736F68] hover:text-[#3A4630] border border-[#E8E0D2]"
                  >
                    {sug.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* MONTO ESTIMADO BASE */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                Monto Base o Estimado ($) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5F6F52]">
                  <DollarSign size={16} strokeWidth={2.2} />
                </div>
                <input
                  type="number"
                  name="monto"
                  step="0.01"
                  min="1"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej. 75000"
                  className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-semibold placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                />
              </div>
            </div>

            {/* FECHA DE VENCIMIENTO INICIAL Y DÍA DE CORTE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  Fecha de Vencimiento *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5F6F52]">
                    <Calendar size={16} strokeWidth={2.2} />
                  </div>
                  <input
                    type="date"
                    name="fecha_vencimiento"
                    required
                    value={fechaVencimiento}
                    onChange={(e) => handleFechaChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  Día Fijo de Corte (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736F68]">
                    <Hash size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="number"
                    name="dia_vencimiento"
                    min="1"
                    max="31"
                    value={diaVencimiento}
                    onChange={(e) => setDiaVencimiento(e.target.value)}
                    placeholder="Ej. 10"
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* PERIODICIDAD / CICLO DE COBRO */}
            <div className="p-4 bg-white/70 rounded-2xl border border-white/90 space-y-2.5 shadow-xs">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] flex items-center gap-1.5">
                <Repeat size={14} className="text-[#5F6F52]" />
                <span>Periodicidad del Pago</span>
              </label>
              <p className="text-[11px] text-[#736F68]">
                Define cada cuántos meses se repite la factura para calcular automáticamente el próximo ciclo al pagar.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {PERIODICIDADES.map((p) => (
                  <button
                    key={p.meses}
                    type="button"
                    onClick={() => setPeriodicidadMeses(p.meses)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer active:scale-95 ${
                      periodicidadMeses === p.meses
                        ? 'bg-[#5F6F52] text-white shadow-2xs'
                        : 'bg-white hover:bg-[#EEF2EA] text-[#736F68] border border-[#E8E0D2]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* REFERENCIAS OPCIONALES (Nº DE CUENTA Y Nº DE FACTURA) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  Nº de Cuenta o Contrato (Opcional)
                </label>
                <input
                  type="text"
                  name="numero_cuenta"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  placeholder="Ej. 104598234"
                  className="w-full px-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  Nº de Factura o Referencia (Opcional)
                </label>
                <input
                  type="text"
                  name="numero_factura"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  placeholder="Ej. FAC-2026-09"
                  className="w-full px-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                />
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
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
                <Check size={16} strokeWidth={2.5} />
                <span>
                  {procesando
                    ? 'Guardando...'
                    : servicioAEditar
                    ? 'Guardar Cambios'
                    : 'Registrar Servicio'}
                </span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>,
    document.body
  );
}
