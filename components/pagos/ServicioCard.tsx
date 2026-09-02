'use client';

import { ServicioConEstado } from '@/actions/pagos';
import {
  CreditCard,
  History,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Receipt,
  Hash,
  ArrowUpRight,
  Repeat,
} from 'lucide-react';

interface ServicioCardProps {
  servicio: ServicioConEstado;
  onRegistrarPago: (servicio: ServicioConEstado) => void;
  onVerHistorial: (servicio: ServicioConEstado) => void;
  onEdit: (servicio: ServicioConEstado) => void;
  onDelete: (servicio: ServicioConEstado) => void;
}

export default function ServicioCard({
  servicio,
  onRegistrarPago,
  onVerHistorial,
  onEdit,
  onDelete,
}: ServicioCardProps) {
  const fVenc = new Date(servicio.fecha_vencimiento);
  const fechaFormateada = fVenc.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const montoFormateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(servicio.monto);

  // Badge de Estado y Alertas Suaves
  let badgeClasses = 'bg-[#EEF2EA] text-[#5F6F52] border-[#DCE7D3]';
  let badgeIcon = <CheckCircle2 size={12} strokeWidth={2.5} />;
  let badgeTexto = `Al día (${servicio.diasRestantes}d)`;

  if (servicio.estadoVencimiento === 'VENCIDO') {
    badgeClasses = 'bg-[#FAE2D8] text-[#B84626] border-[#F2BAA5] animate-pulse';
    badgeIcon = <AlertCircle size={12} strokeWidth={2.5} />;
    const diasVencido = Math.abs(servicio.diasRestantes);
    badgeTexto = diasVencido === 0 ? 'Venció hoy' : `Vencido (${diasVencido}d)`;
  } else if (servicio.estadoVencimiento === 'POR_VENCER') {
    badgeClasses = 'bg-[#FEF9E7] text-[#975A16] border-[#FEEBC8]';
    badgeIcon = <Clock size={12} strokeWidth={2.5} />;
    badgeTexto =
      servicio.diasRestantes === 0
        ? 'Vence hoy'
        : `Vence en ${servicio.diasRestantes} ${servicio.diasRestantes === 1 ? 'día' : 'días'}`;
  }

  // Periodicidad en texto legible
  let periodicidadTexto = 'Mensual';
  if (servicio.periodicidad_meses === 2) periodicidadTexto = 'Bimestral';
  else if (servicio.periodicidad_meses === 3) periodicidadTexto = 'Trimestral';
  else if (servicio.periodicidad_meses === 6) periodicidadTexto = 'Semestral';
  else if (servicio.periodicidad_meses === 12) periodicidadTexto = 'Anual';
  else if (servicio.periodicidad_meses > 1) {
    periodicidadTexto = `Cada ${servicio.periodicidad_meses} meses`;
  }

  return (
    <div className="glass-card glass-card-hover rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between space-y-4 border border-white/80 shadow-xs relative overflow-hidden transition-all duration-300">
      
      {/* Fondo decorativo suave sutil según estado */}
      {servicio.estadoVencimiento === 'VENCIDO' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-[#B84626]/10 to-transparent pointer-events-none" />
      )}

      {/* Cabecera de la Tarjeta: Badge + Botones de Acción */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${badgeClasses}`}
        >
          {badgeIcon}
          <span>{badgeTexto}</span>
        </span>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-xs p-1 rounded-full border border-[#E8E0D2]">
          <button
            type="button"
            title="Editar servicio"
            onClick={() => onEdit(servicio)}
            className="w-7 h-7 rounded-full text-[#736F68] hover:text-[#3A4630] hover:bg-[#EEF2EA] transition flex items-center justify-center cursor-pointer active:scale-90"
          >
            <Edit2 size={13} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            title="Ver historial de recibos"
            onClick={() => onVerHistorial(servicio)}
            className="w-7 h-7 rounded-full text-[#736F68] hover:text-[#3A4630] hover:bg-[#EEF2EA] transition flex items-center justify-center cursor-pointer active:scale-90"
          >
            <History size={13} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            title="Eliminar servicio"
            onClick={() => onDelete(servicio)}
            className="w-7 h-7 rounded-full text-[#736F68] hover:text-[#B84626] hover:bg-[#FAE2D8] transition flex items-center justify-center cursor-pointer active:scale-90"
          >
            <Trash2 size={13} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Identificación y Monto */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FDF2EC] to-[#FAE2D8] text-[#C86242] border border-[#FADBD0] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Receipt size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-[#3A4630] tracking-tight truncate leading-snug">
              {servicio.nombre_servicio}
            </h3>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#736F68] bg-[#F4EFE6] px-2 py-0.5 rounded-lg border border-[#E8E0D2]">
                <Repeat size={11} className="text-[#5F6F52]" />
                <span>{periodicidadTexto}</span>
              </span>

              {servicio.dia_vencimiento && (
                <span className="text-[10px] font-medium text-[#736F68]">
                  Corte día {servicio.dia_vencimiento}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Monto Destacado */}
        <div className="pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#736F68]">
            Monto a pagar
          </p>
          <p className="text-2xl font-black text-[#2E2B27] tracking-tight">
            {montoFormateado}
          </p>
        </div>

        {/* Referencias y Próximo Vencimiento */}
        <div className="p-3 bg-white/60 rounded-2xl border border-white/80 space-y-1.5 text-xs shadow-2xs">
          <div className="flex items-center justify-between text-[#524D45]">
            <span className="flex items-center gap-1 text-[#736F68] font-medium">
              <Calendar size={12} className="text-[#5F6F52]" />
              <span>Vencimiento:</span>
            </span>
            <span className="font-extrabold text-[#3A4630] capitalize">
              {fechaFormateada}
            </span>
          </div>

          {(servicio.numero_cuenta || servicio.numero_factura) && (
            <div className="flex items-center justify-between text-[11px] text-[#736F68] pt-1 border-t border-[#F0EAE1]">
              <span className="flex items-center gap-1 truncate max-w-[150px]">
                <Hash size={11} />
                <span>Cuenta: {servicio.numero_cuenta || 'S/N'}</span>
              </span>
              {servicio.numero_factura && (
                <span className="truncate max-w-[110px]">
                  Fac: {servicio.numero_factura}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pie: Acciones de Pago */}
      <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onVerHistorial(servicio)}
          className="text-xs font-bold text-[#5F6F52] hover:text-[#3A4630] py-2 px-3 rounded-xl hover:bg-white/60 transition flex items-center gap-1 cursor-pointer"
        >
          <History size={13} />
          <span>Recibos</span>
        </button>

        <button
          type="button"
          onClick={() => onRegistrarPago(servicio)}
          className="py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm bg-gradient-to-r from-[#5F6F52] to-[#4E5D42] hover:from-[#4E5D42] hover:to-[#3A4630] text-white shadow-[#5F6F52]/20"
        >
          <CreditCard size={13} strokeWidth={2.2} />
          <span>Registrar Pago</span>
          <ArrowUpRight size={13} strokeWidth={2.2} />
        </button>
      </div>

    </div>
  );
}
