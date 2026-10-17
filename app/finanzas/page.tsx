import { getServicios, getFondoComunMes } from '@/actions/pagos';
import { getUsuarios } from '@/actions/usuarios';
import { getSession } from '@/lib/session';
import FinanzasView from '@/components/pagos/FinanzasView';

export default async function FinanzasPage() {
  const [resServicios, resFondo, resUsuarios, session] = await Promise.all([
    getServicios(),
    getFondoComunMes(),
    getUsuarios(),
    getSession(),
  ]);

  const initialServicios = resServicios.success ? resServicios.servicios : [];
  const initialResumen = resServicios.success
    ? resServicios.resumen
    : {
        totalServicios: 0,
        totalPresupuestoMensual: 0,
        totalProximosVencimientos: 0,
        cuentasVencidas: 0,
        cuentasPorVencer: 0,
        cuentasAlDia: 0,
        totalRealPagadoMes: 0,
        totalPorPagarMes: 0,
        diferenciaPresupuestoGlobal: 0,
      };

  const initialFondoComun = resFondo.success ? resFondo.data : undefined;
  const initialHabitantes =
    resUsuarios.success && Array.isArray(resUsuarios.data)
      ? resUsuarios.data.map((u: { id: string; nombre: string; email?: string }) => ({
          id: u.id,
          nombre: u.nombre,
          email: u.email,
        }))
      : [];

  return (
    <FinanzasView
      initialServicios={initialServicios}
      initialResumen={initialResumen}
      initialFondoComun={initialFondoComun}
      initialHabitantes={initialHabitantes}
      currentUserId={session?.userId}
    />
  );
}
