import Link from 'next/link';
import { getResumenPlantasLobby } from '@/actions/plantas';
import { getServicios } from '@/actions/pagos';
import { getProximosEventosLobby } from '@/actions/eventos';
import { getSession } from '@/lib/session';
import {
  Leaf,
  DollarSign,
  Users,
  ArrowRight,
  Droplets,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Sprout,
  Receipt,
} from 'lucide-react';
import WaterProgressRing from '@/components/ui/WaterProgressRing';

export default async function HomeLobby() {
  const [resumen, session, resServicios, resEventos] = await Promise.all([
    getResumenPlantasLobby(),
    getSession(),
    getServicios(),
    getProximosEventosLobby(2),
  ]);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const plantaUrgente = resumen.plantas.find((p) => p.requiereRiego);
  const proximoEvento = resEventos.proximos?.[0];

  return (
    <div className="relative min-h-screen bg-system text-label-primary p-6 md:p-10 overflow-hidden">
      {/* Luces Ambientales Suaves */}
      <div className="ambient-glow-mint top-[-60px] left-[-60px]" />
      <div className="ambient-glow-terracotta top-[40%] right-[-80px]" />
      <div className="ambient-glow-turquoise bottom-[-60px] left-[25%]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Encabezado de Bienvenida */}
        <header className="space-y-1">
          <p className="apple-footnote text-label-secondary capitalize flex items-center gap-1.5 font-medium">
            <Clock size={13} className="text-terracotta" />
            <span>{fechaHoy}</span>
          </p>
          <h1 className="apple-large-title text-label-primary tracking-tight">
            ¡Hola, {session?.nombre ? session.nombre.split(' ')[0] : 'de nuevo'}!
          </h1>
          <p className="apple-subhead text-label-secondary font-normal">
            Resumen activo del hogar y tareas del día.
          </p>
        </header>

        {/* Bento Grid Glassmorphic de 4 Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Tarjeta 1: Nuestras Plantas (Acento Verde Salvia Menta) */}
          <div className="glass-card glass-card-hover p-7 rounded-[2.2rem] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#c7e1d7]/50 dark:bg-mint/15 border border-[#6eb5a5]/30 text-mint flex items-center justify-center shadow-2xs">
                    <Leaf size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="apple-title-3 text-label-primary tracking-tight">Nuestras Plantas</h2>
                    <p className="apple-subhead text-label-secondary font-normal">Riego y cuidados del jardín</p>
                  </div>
                </div>

                {/* Badge Dinámico de Estado */}
                {resumen.pendientesCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ce9b8c]/25 dark:bg-terracotta/20 text-terracotta border border-[#aa4b50]/30 animate-pulse shadow-2xs">
                    <Droplets size={12} />
                    <span>{resumen.pendientesCount} {resumen.pendientesCount === 1 ? 'pendiente' : 'pendientes'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#c7e1d7]/60 dark:bg-mint/20 text-mint border border-[#6eb5a5]/30">
                    <CheckCircle2 size={12} />
                    <span>Al día</span>
                  </span>
                )}
              </div>

              {/* Mensaje Contextual con Mini Anillo si hay planta urgente */}
              <div className="p-4 bg-white/60 dark:bg-tertiary/60 rounded-2xl border border-white/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-2xs">
                <p className="apple-footnote text-label-secondary leading-relaxed font-normal">
                  {resumen.plantas.length === 0 ? (
                    'Aún no has registrado plantas en tu jardín.'
                  ) : resumen.pendientesCount > 0 ? (
                    <>
                      Tu <strong className="font-semibold text-label-primary">{plantaUrgente?.nombre_comun}</strong> requiere riego el día de hoy.
                    </>
                  ) : (
                    'Todas las plantas del hogar tienen su riego al día.'
                  )}
                </p>

                {plantaUrgente && (
                  <WaterProgressRing
                    diasRestantes={plantaUrgente.diasRestantes}
                    frecuenciaDias={plantaUrgente.frecuencia_dias}
                    size={38}
                    strokeWidth={3}
                    darkText={true}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-separator">
              <span className="apple-footnote text-label-secondary font-normal">
                {resumen.totalPlantas} {resumen.totalPlantas === 1 ? 'planta registrada' : 'plantas registradas'}
              </span>
              <Link 
                href="/plantas" 
                className="btn-apple-filled-mint px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Ver jardín</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Tarjeta 2: Gastos del Hogar (Acento Terracota & Menta) */}
          <div className="glass-card glass-card-hover p-7 rounded-[2.2rem] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#ce9b8c]/25 dark:bg-terracotta/15 border border-[#aa4b50]/30 text-terracotta flex items-center justify-center shadow-2xs">
                    <DollarSign size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="apple-title-3 text-label-primary tracking-tight">Gastos del Hogar</h2>
                    <p className="apple-subhead text-label-secondary font-normal">Cuentas compartidas y servicios</p>
                  </div>
                </div>

                {/* Badge Dinámico de Estado Financiero */}
                {resServicios.resumen.cuentasVencidas > 0 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#ce9b8c]/30 dark:bg-terracotta/20 text-terracotta border border-[#aa4b50]/30 animate-pulse shadow-2xs">
                    <AlertCircle size={12} />
                    <span>
                      {resServicios.resumen.cuentasVencidas}{' '}
                      {resServicios.resumen.cuentasVencidas === 1 ? 'vencida' : 'vencidas'}
                    </span>
                  </span>
                ) : resServicios.resumen.cuentasPorVencer > 0 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#e7d6ac]/40 dark:bg-clay/20 text-label-primary dark:text-clay border border-[#e7d6ac] dark:border-clay/40 shadow-2xs">
                    <Clock size={12} />
                    <span>{resServicios.resumen.cuentasPorVencer} por vencer</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#c7e1d7]/60 dark:bg-mint/20 text-mint border border-[#6eb5a5]/30">
                    <CheckCircle2 size={12} />
                    <span>Al día</span>
                  </span>
                )}
              </div>

              <div className="p-4 bg-white/60 dark:bg-tertiary/60 rounded-2xl border border-white/80 dark:border-white/10 space-y-1 shadow-2xs">
                <p className="apple-caption-1 text-label-secondary font-medium">Total estimado mensual</p>
                <p className="apple-title-1 text-terracotta tracking-tight tabular-nums">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  }).format(resServicios.resumen.totalPresupuestoMensual)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-separator">
              <span className="apple-footnote text-label-secondary font-normal">
                {resServicios.resumen.totalServicios}{' '}
                {resServicios.resumen.totalServicios === 1 ? 'cuenta activa' : 'cuentas activas'}
              </span>
              <Link
                href="/finanzas"
                className="btn-apple-filled px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Gestionar cuentas</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Tarjeta 3: Agenda y Calendario del Hogar (Acento Carmín Profundo / Terracota) */}
          <div className="glass-card glass-card-hover p-7 rounded-[2.2rem] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#ce9b8c]/20 dark:bg-brand-deep/15 border border-[#bd7471]/30 text-brand-deep flex items-center justify-center shadow-2xs">
                    <Calendar size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="apple-title-3 text-label-primary tracking-tight">Agenda del Hogar</h2>
                    <p className="apple-subhead text-label-secondary font-normal">Planificación, eventos y citas</p>
                  </div>
                </div>

                {resEventos.totalEventosSemana > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ce9b8c]/25 dark:bg-brand-deep/20 text-brand-deep border border-[#bd7471]/30 shadow-2xs">
                    <Calendar size={12} />
                    <span>{resEventos.totalEventosSemana} esta semana</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/60 dark:bg-tertiary/40 text-label-secondary border border-separator">
                    <CheckCircle2 size={12} />
                    <span>Sin eventos</span>
                  </span>
                )}
              </div>

              {/* Preview del próximo evento */}
              <div className="p-4 bg-white/60 dark:bg-tertiary/60 rounded-2xl border border-white/80 dark:border-white/10 space-y-2 shadow-2xs">
                {proximoEvento ? (
                  <div>
                    <span className="apple-caption-1 text-label-secondary font-medium block">
                      Próximo evento programado:
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="apple-footnote font-semibold text-label-primary truncate flex items-center gap-1.5">
                        {proximoEvento.origen === 'PLANTA' && <Sprout size={13} className="text-mint" />}
                        {proximoEvento.origen === 'SERVICIO' && <Receipt size={13} className="text-terracotta" />}
                        <span className="truncate">{proximoEvento.titulo}</span>
                      </p>
                      <span className="apple-caption-1 font-semibold px-2 py-0.5 rounded-lg bg-[#ce9b8c]/25 dark:bg-brand-deep/20 text-brand-deep border border-[#bd7471]/30 shrink-0">
                        {new Date(proximoEvento.fecha_inicio).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="apple-footnote text-label-secondary leading-relaxed font-normal">
                    No hay eventos programados para los próximos días. Toca abajo para agendar en el calendario.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-separator">
              <span className="apple-footnote text-label-secondary font-normal">
                {resEventos.proximos?.length || 0} próximos programados
              </span>
              <Link
                href="/calendario"
                className="btn-apple-filled px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Ver agenda</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Tarjeta 4: Miembros del Hogar (Acento Arena Cálida & Terracota) */}
          <div className="glass-card glass-card-hover p-7 rounded-[2.2rem] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#e7d6ac]/35 dark:bg-tertiary border border-[#e7d6ac]/60 text-terracotta flex items-center justify-center shadow-2xs">
                  <Users size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="apple-title-3 text-label-primary tracking-tight">Miembros del Hogar</h2>
                  <p className="apple-subhead text-label-secondary font-normal">Perfiles, accesos con PIN y roles</p>
                </div>
              </div>

              <div className="p-4 bg-white/60 dark:bg-tertiary/60 rounded-2xl border border-white/80 dark:border-white/10 shadow-2xs">
                <p className="apple-footnote text-label-secondary leading-relaxed font-normal">
                  Administra los perfiles de los habitantes de la casa para atribuir automáticamente riegos, eventos y finanzas.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-separator">
              <span className="apple-footnote text-label-secondary font-normal">Control de accesos</span>
              <Link 
                href="/usuarios"
                className="btn-apple-filled px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Gestionar miembros</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}