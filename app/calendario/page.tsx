import { getEventosCalendario } from '@/actions/eventos';
import { getUsuarios } from '@/actions/usuarios';
import { getSession } from '@/lib/session';
import CalendarioView from '@/components/calendario/CalendarioView';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function CalendarioPage() {
  const hoy = new Date();
  const [eventosRes, usuariosRes, session] = await Promise.all([
    getEventosCalendario(hoy.getMonth() + 1, hoy.getFullYear()),
    getUsuarios(),
    getSession(),
  ]);

  const initialEventos = eventosRes.success ? eventosRes.data : [];
  const miembros = usuariosRes.success && usuariosRes.data
    ? usuariosRes.data.map((u) => ({ id: u.id, nombre: u.nombre, email: u.email }))
    : [];

  const usuarioActualId = session?.userId || miembros[0]?.id || '';

  // Función de servidor para refrescar meses de forma instantánea
  async function refreshMes(mes: number, anio: number) {
    'use server';
    const res = await getEventosCalendario(mes, anio);
    return res.success ? res.data : [];
  }

  return (
    <div className="relative min-h-screen bg-system text-label-primary p-4 sm:p-6 md:p-10 overflow-hidden">
      {/* Luces Ambientales de Fondo */}
      <div className="ambient-glow-mint top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
        
        {/* Enlace de regreso al Lobby */}
        <div>
          <Link
            href="/"
            className="apple-footnote font-medium text-label-secondary hover:text-label-primary transition flex items-center gap-1.5 mb-1"
          >
            <ArrowLeft size={13} strokeWidth={2.5} />
            <span>Volver al Lobby</span>
          </Link>
          <h1 className="apple-large-title text-label-primary tracking-tight">
            Agenda del Hogar
          </h1>
          <p className="apple-subhead text-label-secondary font-normal mt-0.5">
            Planificación compartida, riegos automáticos y vencimientos
          </p>
        </div>

        {/* Vista Interactiva del Calendario */}
        <CalendarioView
          initialEventos={initialEventos}
          miembros={miembros}
          usuarioActualId={usuarioActualId}
          onRefresh={refreshMes}
        />

      </div>
    </div>
  );
}
