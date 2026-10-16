import { getResumenPlantasLobby } from '@/actions/plantas';
import { getServicios } from '@/actions/pagos';
import { getProximosEventosLobby } from '@/actions/eventos';
import { getSession } from '@/lib/session';
import LobbyHUD from '@/components/lobby/LobbyHUD';

export default async function HomeLobby() {
  const [resumen, session, resServicios, resEventos] = await Promise.all([
    getResumenPlantasLobby(),
    getSession(),
    getServicios(),
    getProximosEventosLobby(4),
  ]);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const plantasUrgentes = resumen.plantas.filter((p) => p.requiereRiego);

  return (
    <LobbyHUD
      fechaHoy={fechaHoy}
      session={session}
      resumenPlantas={resumen}
      plantasUrgentes={plantasUrgentes}
      resServicios={resServicios}
      resEventos={resEventos}
    />
  );
}