'use client';

import { ServicioConEstado } from '@/actions/pagos';
import PullDownMenu from '@/components/ui/PullDownMenu';
import {
  CreditCard,
  History,
  Trash2,
  Pencil,
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

  // Badge de Estado y Alertas Suaves (Menta para al día, Terracota para vencido, Arena para por vencer)
  let badgeClasses = 'bg-[#c7e1d7]/60 dark:bg-mint/20 text-mint border-[#6eb5a5]/30 dark:border-mint/40';
  let badgeIcon = <CheckCircle2 size={12} strokeWidth={2.5} />;
  let badgeTexto = `Al día (${servicio.diasRestantes}d)`;

  if (servicio.estadoVencimiento === 'VENCIDO') {
    badgeClasses = 'bg-[#ce9b8c]/25 dark:bg-terracotta/20 text-terracotta border-[#aa4b50]/30 dark:border-terracotta/40 animate-pulse';
    badgeIcon = <AlertCircle size={12} strokeWidth={2.5} />;
    const diasVencido = Math.abs(servicio.diasRestantes);
    badgeTexto = diasVencido === 0 ? 'Venció hoy' : `Vencido (${diasVencido}d)`;
  } else if (servicio.estadoVencimiento === 'POR_VENCER') {
    badgeClasses = 'bg-[#e7d6ac]/40 dark:bg-clay/20 text-label-primary dark:text-clay border-[#e7d6ac] dark:border-clay/40';
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

  // Grupos del Menú Desplegable (Apple HIG Pull-Down Menu)
  const menuGroups = [
    {
      items: [
        {
          id: 'editar',
          label: 'Editar servicio...',
          icon: Pencil,
          onClick: () => onEdit(servicio),
        },
        {
          id: 'historial',
          label: 'Historial de pagos...',
          icon: History,
          onClick: () => onVerHistorial(servicio),
        },
      ],
    },
    {
      items: [
        {
          id: 'eliminar',
          label: 'Eliminar servicio',
          icon: Trash2,
          destructive: true,
          onClick: () => onDelete(servicio),
        },
      ],
    },
  ];

  return (
    <div className="glass-card glass-card-hover rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between space-y-4 border border-white/80 dark:border-white/10 shadow-xs relative overflow-hidden transition-all duration-300">
      
      {/* Fondo decorativo suave sutil según estado */}
      {servicio.estadoVencimiento === 'VENCIDO' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-[#aa4b50]/10 dark:from-[#d6767b]/15 to-transparent pointer-events-none" />
      )}

      {/* Cabecera de la Tarjeta: Badge + Menú Pull-Down HIG */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${badgeClasses}`}
        >
          {badgeIcon}
          <span>{badgeTexto}</span>
        </span>

        {/* Menú Desplegable Pull-Down HIG */}
        <PullDownMenu
          groups={menuGroups}
          ariaLabel={`Opciones del servicio ${servicio.nombre_servicio}`}
        />
      </div>

      {/* Identificación y Monto */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ce9b8c]/20 to-[#ce9b8c]/35 dark:from-terracotta/20 dark:to-terracotta/10 text-terracotta border border-[#aa4b50]/20 dark:border-terracotta/30 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Receipt size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="apple-headline text-label-primary tracking-tight truncate leading-snug">
              {servicio.nombre_servicio}
            </h3>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-label-secondary bg-tertiary px-2 py-0.5 rounded-lg border border-separator">
                <Repeat size={11} className="text-khaki" />
                <span>{periodicidadTexto}</span>
              </span>

              {servicio.dia_vencimiento && (
                <span className="text-[11px] font-normal text-label-secondary">
                  Corte día {servicio.dia_vencimiento}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Monto Destacado */}
        <div className="pt-2">
          <p className="apple-caption-2 text-label-secondary font-medium">
            Monto a pagar
          </p>
          <p className="apple-title-2 font-bold text-label-primary tracking-tight tabular-nums">
            {montoFormateado}
          </p>
        </div>

        {/* Referencias y Próximo Vencimiento */}
        <div className="p-3 bg-white/60 dark:bg-tertiary/60 rounded-2xl border border-white/80 dark:border-white/10 space-y-1.5 text-xs shadow-2xs">
          <div className="flex items-center justify-between text-label-secondary">
            <span className="flex items-center gap-1 font-medium">
              <Calendar size={12} className="text-terracotta" />
              <span>Vencimiento:</span>
            </span>
            <span className="font-semibold text-label-primary tabular-nums">
              {fechaFormateada}
            </span>
          </div>

          {(servicio.numero_cuenta || servicio.numero_factura) && (
            <div className="flex items-center justify-between text-[11px] text-label-secondary pt-1 border-t border-separator">
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

      {/* Pie: Acción Primaria de Pago y Recibos */}
      <div className="pt-2 border-t border-separator flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => onVerHistorial(servicio)}
          className="btn-apple-gray text-xs font-semibold px-3 flex items-center gap-1.5"
        >
          <History size={14} />
          <span>Recibos</span>
        </button>

        <button
          type="button"
          onClick={() => onRegistrarPago(servicio)}
          className={`flex-1 ${
            servicio.estadoVencimiento === 'VENCIDO'
              ? 'btn-apple-filled'
              : 'btn-apple-tinted'
          } text-xs font-semibold flex items-center justify-center gap-2`}
        >
          <CreditCard size={15} strokeWidth={2.2} />
          <span>Registrar pago</span>
          <ArrowUpRight size={14} strokeWidth={2.2} />
        </button>
      </div>

    </div>
  );
}
