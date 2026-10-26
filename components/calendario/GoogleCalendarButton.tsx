'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw, Check, AlertCircle, Unlink } from 'lucide-react';
import {
  obtenerEstadoConexionGoogle,
  sincronizarEventosGoogle,
  desconectarGoogleCalendar,
  type EstadoConexionGoogle,
} from '@/actions/google-calendar';

interface GoogleCalendarButtonProps {
  mes?: number;
  anio?: number;
  onSynced?: () => void;
  onStatusChange?: (conectada: boolean) => void;
}

export default function GoogleCalendarButton({
  mes,
  anio,
  onSynced,
  onStatusChange,
}: GoogleCalendarButtonProps) {
  const [estado, setEstado] = useState<EstadoConexionGoogle>({
    conectada: false,
    ultima_sync: null,
  });
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const processedSyncRef = useRef(false);
  const syncedMonthsRef = useRef<Set<string>>(new Set());
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  // 1. Cargar estado inicial y disparar sincronización en 2º plano (Stale-While-Revalidate)
  useEffect(() => {
    let mounted = true;
    async function cargarEstadoYSincronizar() {
      try {
        const res = await obtenerEstadoConexionGoogle();
        if (!mounted) return;
        setEstado(res);
        onStatusChangeRef.current?.(res.conectada);

        if (res.conectada) {
          const key = `${mes || 'default'}-${anio || 'default'}`;
          if (!syncedMonthsRef.current.has(key)) {
            syncedMonthsRef.current.add(key);
            sincronizarEventosGoogle(undefined, mes, anio).then((syncRes) => {
              if (mounted && syncRes.success && onSyncedRef.current) {
                onSyncedRef.current();
              }
            });
          }
        }
      } catch (err) {
        console.error('Error al cargar estado de Google Calendar:', err);
      } finally {
        if (mounted) setCargandoInicial(false);
      }
    }
    cargarEstadoYSincronizar();
    return () => {
      mounted = false;
    };
  }, [mes, anio]);

  // 2. Detectar retorno del flujo OAuth de Google Calendar
  useEffect(() => {
    const syncResult = searchParams.get('google_sync');
    if (!syncResult || processedSyncRef.current) return;

    processedSyncRef.current = true;

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (syncResult === 'success') {
      setMensajeExito('¡Google Calendar sincronizado!');
      obtenerEstadoConexionGoogle().then((res) => {
        setEstado(res);
        onStatusChangeRef.current?.(res.conectada);
      });
      if (onSyncedRef.current) onSyncedRef.current();
      setTimeout(() => setMensajeExito(null), 4000);
    } else if (syncResult === 'error') {
      setMensajeError('No se pudo conectar Google Calendar.');
      setTimeout(() => setMensajeError(null), 4000);
    }
  }, [searchParams]);

  function handleSyncManual() {
    startTransition(async () => {
      setMensajeError(null);
      const res = await sincronizarEventosGoogle(undefined, mes, anio);
      if (res.success) {
        if (res.exportados && res.exportados > 0 && res.importados && res.importados > 0) {
          setMensajeExito(`Sincronizados: ${res.exportados} enviados, ${res.importados} recibidos`);
        } else if (res.exportados && res.exportados > 0) {
          setMensajeExito(`${res.exportados} ${res.exportados === 1 ? 'evento enviado' : 'eventos enviados'} a Google`);
        } else if (res.importados && res.importados > 0) {
          setMensajeExito(`${res.importados} ${res.importados === 1 ? 'evento recibido' : 'eventos recibidos'} de Google`);
        } else {
          setMensajeExito('Todo al día con Google Calendar');
        }
        const nuevoEstado = await obtenerEstadoConexionGoogle();
        setEstado(nuevoEstado);
        onStatusChangeRef.current?.(nuevoEstado.conectada);
        if (onSynced) onSynced();
        setTimeout(() => setMensajeExito(null), 3500);
      } else {
        setMensajeError(res.error || 'Error al sincronizar');
        setTimeout(() => setMensajeError(null), 3500);
      }
    });
  }

  function handleDesconectar() {
    if (!confirm('¿Deseas desconectar tu cuenta de Google Calendar?')) return;

    startTransition(async () => {
      const res = await desconectarGoogleCalendar();
      if (res.success) {
        setEstado({ conectada: false, ultima_sync: null });
        onStatusChangeRef.current?.(false);
        setMensajeExito('Cuenta desconectada');
        if (onSynced) onSynced();
        setTimeout(() => setMensajeExito(null), 3500);
      } else {
        setMensajeError(res.error || 'No se pudo desconectar');
        setTimeout(() => setMensajeError(null), 3500);
      }
    });
  }

  if (cargandoInicial) {
    return <div className="h-8 w-24 bg-tertiary/40 rounded-xl animate-pulse shrink-0" />;
  }

  return (
    <div className="relative inline-flex items-center shrink-0">
      {mensajeExito && (
        <div className="fixed top-20 right-4 z-50 bg-mint/20 border border-mint/40 text-label-primary text-xs px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 font-semibold animate-fade-in-up">
          <Check size={14} className="stroke-[2.5] shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div className="fixed top-20 right-4 z-50 bg-red-100 dark:bg-red-900/40 border border-red-300 text-red-700 dark:text-red-300 text-xs px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 font-semibold animate-fade-in-up">
          <AlertCircle size={14} className="shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {!estado.conectada ? (
        <a
          href="/api/auth/google"
          className="px-2.5 sm:px-3 py-1.5 bg-secondary hover:bg-tertiary text-[11px] sm:text-xs font-bold text-label-primary rounded-xl border border-separator transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 shrink-0"
          title="Conectar y sincronizar bidireccionalmente con Google Calendar"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="sm:hidden">Google Sync</span>
          <span className="hidden sm:inline">Conectar Google Calendar</span>
        </a>
      ) : (
        <div className="flex items-center gap-1 bg-tertiary px-2.5 py-1 rounded-xl border border-separator shadow-2xs shrink-0">
          <div className="flex items-center gap-1.5 pr-1.5 border-r border-separator text-[11px] font-semibold text-label-secondary">
            <span className="w-2 h-2 rounded-full bg-mint animate-pulse shrink-0" />
            <span>Google Sync</span>
          </div>

          <button
            type="button"
            onClick={handleSyncManual}
            disabled={isPending}
            className="p-1 hover:bg-mint/20 dark:hover:bg-tertiary text-label-primary rounded-lg transition cursor-pointer active:scale-90 disabled:opacity-50"
            title="Sincronizar eventos con Google Calendar ahora"
          >
            <RefreshCw size={13} className={isPending ? 'animate-spin text-mint' : ''} />
          </button>

          <button
            type="button"
            onClick={handleDesconectar}
            disabled={isPending}
            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-label-secondary hover:text-red-600 rounded-lg transition cursor-pointer active:scale-90"
            title="Desconectar Google Calendar"
          >
            <Unlink size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
