import { getServicios, getFondoComunMes, getGastosMes } from '@/actions/pagos';
import { getUsuarios } from '@/actions/usuarios';
import { getSession } from '@/lib/session';
import FinanzasView from '@/components/pagos/FinanzasView';

export default async function FinanzasPage() {
  const [resServicios, resFondo, resGastos, resUsuarios, session] = await Promise.all([
    getServicios(),
    getFondoComunMes(),
    getGastosMes(),
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
  const initialGastos = resGastos.success ? resGastos.gastos : [];
  const initialHabitantes = resUsuarios.success
    ? resUsuarios.data.map((u) => ({
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
      initialGastos={initialGastos}
      initialHabitantes={initialHabitantes}
      currentUserId={session?.userId}
    />
  );
}
