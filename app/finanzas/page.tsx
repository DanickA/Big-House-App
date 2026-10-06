import { getServicios } from '@/actions/pagos';
import FinanzasView from '@/components/pagos/FinanzasView';

export default async function FinanzasPage() {
  const res = await getServicios();
  const initialServicios = res.success ? res.servicios : [];
  const initialResumen = res.success
    ? res.resumen
    : {
        totalServicios: 0,
        totalPresupuestoMensual: 0,
        totalProximosVencimientos: 0,
        cuentasVencidas: 0,
        cuentasPorVencer: 0,
        cuentasAlDia: 0,
      };

  return <FinanzasView initialServicios={initialServicios} initialResumen={initialResumen} />;
}
