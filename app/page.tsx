import Link from 'next/link';
import { getResumenPlantasLobby } from '@/actions/plantas';
import { getServicios } from '@/actions/pagos';
import { getSession } from '@/lib/session';
import { Leaf, DollarSign, Users, ArrowRight, Droplets, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import WaterProgressRing from '@/components/ui/WaterProgressRing';

export default async function HomeLobby() {
  const [resumen, session, resServicios] = await Promise.all([
    getResumenPlantasLobby(),
    getSession(),
    getServicios(),
  ]);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const plantaUrgente = resumen.plantas.find((p) => p.requiereRiego);

  return (
    <div className="relative min-h-screen bg-[#F4EFE6] text-[#2E2B27] p-6 md:p-10 overflow-hidden">
      {/* Luces Ambientales Suaves */}
      <div className="ambient-glow-olive top-[-60px] left-[-60px]" />
      <div className="ambient-glow-terracotta top-[40%] right-[-80px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Encabezado de Bienvenida */}
        <header className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#736F68] capitalize flex items-center gap-1.5">
            <Clock size={13} className="text-[#5F6F52]" />
            <span>{fechaHoy}</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#3A4630] tracking-tight">
            ¡Hola, {session?.nombre ? session.nombre.split(' ')[0] : 'de nuevo'}!
          </h1>
          <p className="text-[#635E56] text-sm font-medium">
            Resumen activo del hogar y tareas del día.
          </p>
        </header>

        {/* Bento Grid Glassmorphic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Tarjeta 1: Nuestras Plantas (Acento Verde Oliva) */}
          <div className="glass-card glass-card-hover p-7 rounded-[2.2rem] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2EA] border border-[#DCE7D3] text-[#3A4630] flex items-center justify-center shadow-2xs">
                    <Leaf size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#3A4630] tracking-tight">Nuestras Plantas</h2>
                    <p className="text-xs text-[#736F68] font-medium">Riego y cuidados del jardín</p>
                  </div>
                </div>

                {/* Badge Dinámico de Estado */}
                {resumen.pendientesCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAE2D8] text-[#B84626] border border-[#F2BAA5] animate-pulse shadow-2xs">
                    <Droplets size={12} />
                    <span>{resumen.pendientesCount} {resumen.pendientesCount === 1 ? 'pendiente' : 'pendientes'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF2EA] text-[#5F6F52] border border-[#DCE7D3]">
                    <CheckCircle2 size={12} />
                    <span>Al día</span>
                  </span>
                )}
              </div>

              {/* Mensaje Contextual con Mini Anillo si hay planta urgente */}
              <div className="p-4 bg-white/60 rounded-2xl border border-white/80 flex items-center justify-between gap-3 shadow-2xs">
                <p className="text-xs text-[#524D45] leading-relaxed font-medium">
                  {resumen.plantas.length === 0 ? (
                    'Aún no has registrado plantas en tu jardín.'
                  ) : resumen.pendientesCount > 0 ? (
                    <>
                      Tu <strong className="font-bold text-[#3A4630]">{plantaUrgente?.nombre_comun}</strong> requiere riego el día de hoy.
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

            <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE1]">
              <span className="text-xs font-semibold text-[#736F68]">
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
                  <div className="w-12 h-12 rounded-2xl bg-[#FDF2EC] border border-[#FADBD0] text-[#C86242] flex items-center justify-center shadow-2xs">
                    <DollarSign size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#3A4630] tracking-tight">Gastos del Hogar</h2>
                    <p className="text-xs text-[#736F68] font-medium">Cuentas compartidas y servicios</p>
                  </div>
                </div>

                {/* Badge Dinámico de Estado Financiero */}
                {resServicios.resumen.cuentasVencidas > 0 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FAE2D8] text-[#B84626] border border-[#F2BAA5] animate-pulse shadow-2xs">
                    <AlertCircle size={12} />
                    <span>
                      {resServicios.resumen.cuentasVencidas}{' '}
                      {resServicios.resumen.cuentasVencidas === 1 ? 'vencida' : 'vencidas'}
                    </span>
                  </span>
                ) : resServicios.resumen.cuentasPorVencer > 0 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF9E7] text-[#975A16] border border-[#FEEBC8] shadow-2xs">
                    <Clock size={12} />
                    <span>{resServicios.resumen.cuentasPorVencer} por vencer</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF2EA] text-[#5F6F52] border border-[#DCE7D3]">
                    <CheckCircle2 size={12} />
                    <span>Al día</span>
                  </span>
                )}
              </div>

              <div className="p-4 bg-white/60 rounded-2xl border border-white/80 space-y-1 shadow-2xs">
                <p className="text-xs text-[#736F68] font-semibold">Total estimado mensual</p>
                <p className="text-3xl font-extrabold text-[#C86242] tracking-tight">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  }).format(resServicios.resumen.totalPresupuestoMensual)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE1]">
              <span className="text-xs font-semibold text-[#736F68]">
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

          {/* Tarjeta 3: Miembros del Hogar (Bento Ancho) */}
          <div className="glass-card glass-card-hover p-7 rounded-[2.2rem] flex flex-col justify-between space-y-5 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2EA] border border-[#DCE7D3] text-[#3A4630] flex items-center justify-center shadow-2xs">
                  <Users size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#3A4630] tracking-tight">Miembros del Hogar</h2>
                  <p className="text-xs text-[#736F68] font-medium">Perfiles, accesos con PIN y roles</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#524D45] leading-relaxed font-medium">
              Administra los perfiles de los habitantes de la casa para atribuir automáticamente labores de riego, registro de tareas y balance de gastos.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE1]">
              <span className="text-xs font-semibold text-[#736F68]">Control de accesos</span>
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