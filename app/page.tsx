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
      <div className="ambient-glow-olive top-[-60px] left-[-60px]" />
      <div className="ambient-glow-terracotta top-[40%] right-[-80px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Encabezado de Bienvenida */}
        <header className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-label-secondary capitalize flex items-center gap-1.5">
            <Clock size={13} className="text-olive" />
            <span>{fechaHoy}</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#3A4630] dark:text-label-primary tracking-tight">
            ¡Hola, {session?.nombre ? session.nombre.split(' ')[0] : 'de nuevo'}!
          </h1>
          <p className="text-label-secondary text-sm font-medium">
            Resumen activo del hogar y tareas del día.
          </p>
        </header>

        {/* Bento Grid Glassmorphic de 4 Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Tarjeta 1: Nuestras Plantas (Acento Verde Oliva) */}
          <div className="glass-card glass-card-hover p-7 rounded-[2.2rem] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2EA] dark:bg-[#282C25] border border-[#DCE7D3] dark:border-separator text-[#3A4630] dark:text-olive flex items-center justify-center shadow-2xs">
                    <Leaf size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#3A4630] dark:text-label-primary tracking-tight">Nuestras Plantas</h2>
                    <p className="text-xs text-label-secondary font-medium">Riego y cuidados del jardín</p>
                  </div>
                </div>

                {/* Badge Dinámico de Estado */}
                {resumen.pendientesCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAE2D8] dark:bg-terracotta/20 text-[#B84626] dark:text-terracotta border border-[#F2BAA5] dark:border-terracotta/40 animate-pulse shadow-2xs">
                    <Droplets size={12} />
                    <span>{resumen.pendientesCount} {resumen.pendientesCount === 1 ? 'pendiente' : 'pendientes'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF2EA] dark:bg-olive/20 text-[#5F6F52] dark:text-olive border border-[#DCE7D3] dark:border-olive/40">
                    <CheckCircle2 size={12} />
                    <span>Al día</span>
                  </span>
                )}
              </div>

              {/* Mensaje Contextual con Mini Anillo si hay planta urgente */}
              <div className="p-4 bg-white/60 dark:bg-tertiary/60 rounded-2xl border border-white/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-2xs">
                <p className="text-xs text-[#524D45] dark:text-label-secondary leading-relaxed font-medium">
                  {resumen.plantas.length === 0 ? (
                    'Aún no has registrado plantas en tu jardín.'
                  ) : resumen.pendientesCount > 0 ? (
                    <>
                      Tu <strong className="font-bold text-[#3A4630] dark:text-label-primary">{plantaUrgente?.nombre_comun}</strong> requiere riego el día de hoy.
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

            <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE1] dark:border-separator">
              <span className="text-xs font-semibold text-label-secondary">
                {resumen.totalPlantas} {resumen.totalPlantas === 1 ? 'planta registrada' : 'plantas registradas'}
              </span>
              <Link 
                href="/plantas" 
                className="text-xs font-bold px-4 py-2.5 bg-[#5F6F52] hover:bg-[#4E5D42] text-white rounded-xl transition shadow-sm shadow-[#5F6F52]/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Ver jardín</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Tarjeta 2: Gastos del Hogar (Acento Terracota) */}
          <div className="glass-card glass-card-hover p-7 rounded-[2.2rem] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FDF2EC] dark:bg-[#32221B] border border-[#FADBD0] dark:border-[#523326] text-terracotta flex items-center justify-center shadow-2xs">
                    <DollarSign size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#3A4630] dark:text-label-primary tracking-tight">Gastos del Hogar</h2>
                    <p className="text-xs text-label-secondary font-medium">Cuentas compartidas y servicios</p>
                  </div>
                </div>

                {/* Badge Dinámico de Estado Financiero */}
                {resServicios.resumen.cuentasVencidas > 0 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FAE2D8] dark:bg-terracotta/20 text-[#B84626] dark:text-terracotta border border-[#F2BAA5] dark:border-terracotta/40 animate-pulse shadow-2xs">
                    <AlertCircle size={12} />
                    <span>
                      {resServicios.resumen.cuentasVencidas}{' '}
                      {resServicios.resumen.cuentasVencidas === 1 ? 'vencida' : 'vencidas'}
                    </span>
                  </span>
                ) : resServicios.resumen.cuentasPorVencer > 0 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF9E7] dark:bg-amber-sem/20 text-[#975A16] dark:text-amber-sem border border-[#FEEBC8] dark:border-amber-sem/40 shadow-2xs">
                    <Clock size={12} />
                    <span>{resServicios.resumen.cuentasPorVencer} por vencer</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF2EA] dark:bg-olive/20 text-[#5F6F52] dark:text-olive border border-[#DCE7D3] dark:border-olive/40">
                    <CheckCircle2 size={12} />
                    <span>Al día</span>
                  </span>
                )}
              </div>

              <div className="p-4 bg-white/60 dark:bg-tertiary/60 rounded-2xl border border-white/80 dark:border-white/10 space-y-1 shadow-2xs">
                <p className="text-xs text-label-secondary font-semibold">Total estimado mensual</p>
                <p className="text-3xl font-extrabold text-terracotta tracking-tight">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  }).format(resServicios.resumen.totalPresupuestoMensual)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE1] dark:border-separator">
              <span className="text-xs font-semibold text-label-secondary">
                {resServicios.resumen.totalServicios}{' '}
                {resServicios.resumen.totalServicios === 1 ? 'cuenta activa' : 'cuentas activas'}
              </span>
              <Link
                href="/finanzas"
                className="text-xs font-bold px-4 py-2.5 bg-[#C86242] hover:bg-[#B84626] text-white rounded-xl transition shadow-sm shadow-[#C86242]/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Gestionar cuentas</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Tarjeta 3: Agenda y Calendario del Hogar */}
          <div className="glass-card glass-card-hover p-7 rounded-[2.2rem] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2EA] dark:bg-[#282C25] border border-[#DCE7D3] dark:border-separator text-[#3A4630] dark:text-olive flex items-center justify-center shadow-2xs">
                    <Calendar size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#3A4630] dark:text-label-primary tracking-tight">Agenda del Hogar</h2>
                    <p className="text-xs text-label-secondary font-medium">Planificación, eventos y citas</p>
                  </div>
                </div>

                {resEventos.totalEventosSemana > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF2EA] dark:bg-olive/20 text-[#5F6F52] dark:text-olive border border-[#DCE7D3] dark:border-olive/40 shadow-2xs">
                    <Calendar size={12} />
                    <span>{resEventos.totalEventosSemana} esta semana</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF7F2] dark:bg-tertiary/40 text-label-secondary border border-[#E8E0D2] dark:border-separator">
                    <CheckCircle2 size={12} />
                    <span>Sin eventos</span>
                  </span>
                )}
              </div>

              {/* Preview del próximo evento */}
              <div className="p-4 bg-white/60 dark:bg-tertiary/60 rounded-2xl border border-white/80 dark:border-white/10 space-y-2 shadow-2xs">
                {proximoEvento ? (
                  <div>
                    <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider block">
                      Próximo evento programado:
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs font-extrabold text-[#3A4630] dark:text-label-primary truncate flex items-center gap-1.5">
                        {proximoEvento.origen === 'PLANTA' && <Sprout size={13} className="text-olive" />}
                        {proximoEvento.origen === 'SERVICIO' && <Receipt size={13} className="text-terracotta" />}
                        <span className="truncate">{proximoEvento.titulo}</span>
                      </p>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#EEF2EA] dark:bg-[#282C25] text-[#3A4630] dark:text-label-primary border border-[#DCE7D3]/60 dark:border-separator shrink-0">
                        {new Date(proximoEvento.fecha_inicio).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#524D45] dark:text-label-secondary leading-relaxed font-medium">
                    No hay eventos programados para los próximos días. Toca abajo para agendar en el calendario.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE1] dark:border-separator">
              <span className="text-xs font-semibold text-label-secondary">
                {resEventos.proximos?.length || 0} próximos programados
              </span>
              <Link
                href="/calendario"
                className="text-xs font-bold px-4 py-2.5 bg-[#5F6F52] hover:bg-[#4E5D42] text-white rounded-xl transition shadow-sm shadow-[#5F6F52]/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Ver agenda</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Tarjeta 4: Miembros del Hogar */}
          <div className="glass-card glass-card-hover p-7 rounded-[2.2rem] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2EA] dark:bg-[#282C25] border border-[#DCE7D3] dark:border-separator text-[#3A4630] dark:text-olive flex items-center justify-center shadow-2xs">
                  <Users size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#3A4630] dark:text-label-primary tracking-tight">Miembros del Hogar</h2>
                  <p className="text-xs text-label-secondary font-medium">Perfiles, accesos con PIN y roles</p>
                </div>
              </div>

              <div className="p-4 bg-white/60 dark:bg-tertiary/60 rounded-2xl border border-white/80 dark:border-white/10 shadow-2xs">
                <p className="text-xs text-[#524D45] dark:text-label-secondary leading-relaxed font-medium">
                  Administra los perfiles de los habitantes de la casa para atribuir automáticamente riegos, eventos y finanzas.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE1] dark:border-separator">
              <span className="text-xs font-semibold text-label-secondary">Control de accesos</span>
              <Link 
                href="/usuarios"
                className="text-xs font-bold px-4 py-2.5 bg-[#5F6F52] hover:bg-[#4E5D42] text-white rounded-xl transition shadow-sm shadow-[#5F6F52]/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
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