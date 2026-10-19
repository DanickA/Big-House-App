'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sprout,
  Receipt,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Droplets,
  Activity,
  Undo2,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { SessionPayload } from '@/lib/session';
import { ResumenServicios, ServicioConEstado } from '@/actions/pagos';
import { EventoUnificado } from '@/actions/eventos';
import { UrgentPlant } from '@/components/lobby/FocusActionBanner';
import { registrarCuidado, deshacerCuidado } from '@/actions/plantas';

export interface LobbyHUDProps {
  fechaHoy: string;
  session: SessionPayload | null;
  resumenPlantas: {
    totalPlantas: number;
    pendientesCount: number;
    plantas: UrgentPlant[];
  };
  plantasUrgentes: UrgentPlant[];
  resServicios: {
    servicios: ServicioConEstado[];
    resumen: ResumenServicios;
  };
  resEventos: {
    totalEventosSemana: number;
    proximos: EventoUnificado[];
  };
}

export default function LobbyHUD({
  fechaHoy,
  session,
  resumenPlantas,
  plantasUrgentes: initialPlantasUrgentes,
  resServicios,
  resEventos,
}: LobbyHUDProps) {
  const [plantasUrgentes, setPlantasUrgentes] = useState<UrgentPlant[]>(initialPlantasUrgentes);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<{
    plantaId: string;
    historialId: string;
    nombre: string;
  } | null>(null);

  const tienePlantasUrgentes = plantasUrgentes.length > 0;
  const tieneCuentasUrgentes = resServicios.resumen.cuentasVencidas > 0;
  const tieneCuentasPorVencer = resServicios.resumen.cuentasPorVencer > 0;
  const proximoEvento = resEventos.proximos?.[0];

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([20, 50, 20]);
      } catch {
        // Ignorar si el navegador restringe la vibración
      }
    }
  };

  // Riego Express inline (atómico en el Lobby)
  const handleQuickWater = async (planta: UrgentPlant) => {
    if (procesandoId) return;
    triggerHaptic();
    setProcesandoId(planta.id);

    // Optimista en 0ms: remover de la lista local de urgentes
    setPlantasUrgentes((prev) => prev.filter((p) => p.id !== planta.id));

    try {
      const res = await registrarCuidado(planta.id, 'RIEGO');
      if (res.success && res.data?.id) {
        setUndoItem({
          plantaId: planta.id,
          historialId: res.data.id,
          nombre: planta.nombre_comun,
        });
      }
    } catch {
      // Revertir en caso de fallo de red
      setPlantasUrgentes((prev) => [planta, ...prev]);
    } finally {
      setProcesandoId(null);
    }
  };

  // Deshacer riego express
  const handleUndoWater = async () => {
    if (!undoItem || procesandoId) return;
    triggerHaptic();
    const item = undoItem;
    setUndoItem(null);
    setProcesandoId(item.plantaId);

    try {
      await deshacerCuidado(item.historialId);
      // Restaurar planta en el estado de urgentes
      const plantaRestaurada = initialPlantasUrgentes.find((p) => p.id === item.plantaId) || {
        id: item.plantaId,
        nombre_comun: item.nombre,
        frecuencia_dias: 7,
        diasRestantes: 0,
        requiereRiego: true,
      };
      setPlantasUrgentes((prev) => [plantaRestaurada, ...prev]);
    } catch {
      // Fallo al deshacer
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="relative min-h-[calc(100dvh-64px)] bg-system text-label-primary p-4 sm:p-8 flex flex-col justify-between overflow-hidden">
      {/* Luces Ambientales HUD BigHouse */}
      <div className="ambient-glow-mint top-[-100px] left-[-40px]" />
      <div className="ambient-glow-terracotta bottom-[-80px] right-[-40px]" />

      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-5 animate-fade-in-up">
        {/* Encabezado Cockpit Minimalista (Cero Emojis) */}
        <header className="flex items-center justify-between border-b border-separator/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-terracotta text-white flex items-center justify-center font-bold text-base shadow-sm">
              {session?.nombre ? session.nombre.charAt(0).toUpperCase() : 'H'}
            </div>
            <div>
              <h1 className="apple-headline text-label-primary font-bold tracking-tight">
                HogarApp HUD
              </h1>
              <p className="apple-caption-1 text-label-secondary capitalize flex items-center gap-1.5 font-medium">
                <Clock size={12} className="text-terracotta" />
                <span>{fechaHoy}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-tertiary border border-separator text-label-primary shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
              <span>{session?.nombre ? session.nombre.split(' ')[0] : 'Habitante'}</span>
            </span>
          </div>
        </header>

        {/* Notificación de Deshacer Riego Express */}
        {undoItem && (
          <div className="glass-card p-3 rounded-2xl border border-mint/40 bg-mint/10 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={16} className="text-mint shrink-0" />
              <span className="font-medium text-label-primary">
                Riego de <strong className="font-semibold">{undoItem.nombre}</strong> registrado con éxito.
              </span>
            </div>
            <button
              type="button"
              onClick={handleUndoWater}
              disabled={!!procesandoId}
              className="btn-apple-secondary text-xs px-2.5 py-1 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Undo2 size={12} />
              <span>Deshacer</span>
            </button>
          </div>
        )}

        {/* Cápsula Dinámica Inteligente con Asequibilidad Dual (Split Affordance) */}
        <section
          aria-label="Cápsula de estado del hogar"
          className="glass-card p-3.5 sm:p-4 rounded-2xl border border-separator/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-tertiary flex items-center justify-center shrink-0">
              <Activity size={16} className="text-terracotta" />
            </div>
            <div className="space-y-0.5">
              <p className="apple-footnote font-semibold text-label-primary">
                Estado Global del Hogar
              </p>
              <p className="apple-caption-2 text-label-secondary">
                {tienePlantasUrgentes || tieneCuentasUrgentes ? (
                  <span className="text-terracotta font-medium">
                    {tienePlantasUrgentes ? `${plantasUrgentes.length} ${plantasUrgentes.length === 1 ? 'planta requiere riego' : 'plantas requieren riego'}` : ''}
                    {tienePlantasUrgentes && tieneCuentasUrgentes ? ' • ' : ''}
                    {tieneCuentasUrgentes ? `${resServicios.resumen.cuentasVencidas} ${resServicios.resumen.cuentasVencidas === 1 ? 'cuenta vencida' : 'cuentas vencidas'}` : ''}
                  </span>
                ) : (
                  <span className="text-mint font-medium">
                    Todos los subsistemas del hogar operan con normalidad.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Acciones de la Cápsula: Riego Express Inline + Redirección a Listado de Plantas / Cuentas */}
          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto shrink-0">
            {tienePlantasUrgentes && (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickWater(plantasUrgentes[0])}
                  disabled={!!procesandoId}
                  className="btn-apple-filled-mint px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition"
                >
                  {procesandoId === plantasUrgentes[0].id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Droplets size={13} />
                  )}
                  <span>Regar {plantasUrgentes[0].nombre_comun}</span>
                </button>

                <Link
                  href="/plantas"
                  title="Ver inventario completo del jardín"
                  className="btn-apple-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Sprout size={13} className="text-mint" />
                  <span>Ver jardín completo</span>
                  <ChevronRight size={12} />
                </Link>
              </>
            )}

            {!tienePlantasUrgentes && (
              <Link
                href="/plantas"
                className="btn-apple-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
              >
                <Sprout size={13} className="text-mint" />
                <span>Ver jardín</span>
                <ChevronRight size={12} />
              </Link>
            )}

            {tieneCuentasUrgentes && (
              <Link
                href="/finanzas"
                className="btn-apple-filled px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Receipt size={13} />
                <span>Pagar cuenta</span>
                <ChevronRight size={12} />
              </Link>
            )}
          </div>
        </section>

        {/* Matriz de Macro-Tiles Táctiles (2x2 móvil / 4x1 desktop) con Bordes de Alerta Reactivos */}
        <main
          aria-label="Panel principal de control del hogar"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {/* Tile 1: Jardín Botánico */}
          <Link
            href="/plantas"
            prefetch={true}
            className={`glass-card glass-card-hover p-5 rounded-[2rem] flex flex-col justify-between aspect-square group relative overflow-hidden transition-all duration-200 active:scale-95 ${
              plantasUrgentes.length > 0
                ? 'border-2 border-mint/70 shadow-[0_0_24px_rgba(110,181,165,0.22)]'
                : 'border border-separator/70'
            }`}
          >
            <div className="flex justify-between items-start">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition ${
                  plantasUrgentes.length > 0
                    ? 'bg-mint text-white font-bold'
                    : 'bg-[#c7e1d7]/60 dark:bg-mint/20 text-mint'
                }`}
              >
                <Sprout size={24} strokeWidth={2.2} />
              </div>
              <ArrowUpRight
                size={16}
                className="text-label-tertiary group-hover:text-mint transition"
              />
            </div>

            <div className="space-y-1">
              <p className="apple-caption-1 font-semibold text-label-secondary">Jardín</p>
              <div className="flex items-baseline gap-1.5">
                {plantasUrgentes.length > 0 ? (
                  <>
                    <span className="text-2xl font-bold tracking-tight text-terracotta">
                      {plantasUrgentes.length}
                    </span>
                    <span className="apple-caption-2 text-terracotta font-semibold">
                      {plantasUrgentes.length === 1 ? 'por regar' : 'por regar'}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={22} className="text-mint shrink-0" />
                    <span className="apple-caption-2 text-mint font-semibold">Al día</span>
                  </>
                )}
              </div>
              <p className="apple-caption-2 text-label-secondary font-medium truncate">
                {resumenPlantas.totalPlantas}{' '}
                {resumenPlantas.totalPlantas === 1 ? 'planta registrada' : 'plantas registradas'}
              </p>
            </div>
          </Link>

          {/* Tile 2: Finanzas del Hogar */}
          <Link
            href="/finanzas"
            prefetch={true}
            className={`glass-card glass-card-hover p-5 rounded-[2rem] flex flex-col justify-between aspect-square group relative overflow-hidden transition-all duration-200 active:scale-95 ${
              tieneCuentasUrgentes
                ? 'border-2 border-terracotta/80 shadow-[0_0_24px_rgba(170,75,80,0.25)]'
                : tieneCuentasPorVencer
                ? 'border-2 border-clay/60 shadow-xs'
                : 'border border-separator/70'
            }`}
          >
            <div className="flex justify-between items-start">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition ${
                  tieneCuentasUrgentes
                    ? 'bg-terracotta text-white font-bold'
                    : 'bg-terracotta/15 text-terracotta'
                }`}
              >
                <Receipt size={24} strokeWidth={2.2} />
              </div>
              <ArrowUpRight
                size={16}
                className="text-label-tertiary group-hover:text-terracotta transition"
              />
            </div>

            <div className="space-y-1">
              <p className="apple-caption-1 font-semibold text-label-secondary">Finanzas</p>
              <p className="text-lg sm:text-xl font-bold tracking-tight text-terracotta truncate">
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(resServicios.resumen.totalPresupuestoMensual)}
              </p>
              <p className="apple-caption-2 font-medium truncate">
                {resServicios.resumen.cuentasVencidas > 0 ? (
                  <span className="text-terracotta font-semibold">
                    {resServicios.resumen.cuentasVencidas}{' '}
                    {resServicios.resumen.cuentasVencidas === 1 ? 'vencida' : 'vencidas'}
                  </span>
                ) : tieneCuentasPorVencer ? (
                  <span className="text-clay font-medium">
                    {resServicios.resumen.cuentasPorVencer} por vencer
                  </span>
                ) : (
                  <span className="text-mint font-medium">Al día</span>
                )}
              </p>
            </div>
          </Link>

          {/* Tile 3: Agenda & Calendario */}
          <Link
            href="/calendario"
            prefetch={true}
            className={`glass-card glass-card-hover p-5 rounded-[2rem] flex flex-col justify-between aspect-square group relative overflow-hidden transition-all duration-200 active:scale-95 ${
              resEventos.totalEventosSemana > 0
                ? 'border border-brand-deep/40 shadow-xs'
                : 'border border-separator/70'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-terracotta/15 text-brand-deep flex items-center justify-center shadow-2xs group-hover:scale-110 transition">
                <Calendar size={24} strokeWidth={2.2} />
              </div>
              <ArrowUpRight
                size={16}
                className="text-label-tertiary group-hover:text-brand-deep transition"
              />
            </div>

            <div className="space-y-1">
              <p className="apple-caption-1 font-semibold text-label-secondary">Agenda</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-label-primary">
                  {resEventos.totalEventosSemana}
                </span>
                <span className="apple-caption-2 text-label-secondary">esta semana</span>
              </div>
              <p className="apple-caption-2 text-brand-deep font-medium truncate">
                {proximoEvento ? proximoEvento.titulo : 'Sin compromisos'}
              </p>
            </div>
          </Link>

          {/* Tile 4: Miembros del Hogar */}
          <Link
            href="/usuarios"
            prefetch={true}
            className="glass-card glass-card-hover p-5 rounded-[2rem] flex flex-col justify-between aspect-square border border-separator/70 group relative overflow-hidden transition-all duration-200 active:scale-95"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#e7d6ac]/40 dark:bg-tertiary text-label-primary flex items-center justify-center shadow-2xs group-hover:scale-110 transition">
                <Users size={24} strokeWidth={2.2} />
              </div>
              <ArrowUpRight
                size={16}
                className="text-label-tertiary group-hover:text-label-primary transition"
              />
            </div>

            <div className="space-y-1">
              <p className="apple-caption-1 font-semibold text-label-secondary">Habitantes</p>
              <p className="text-lg font-bold tracking-tight text-label-primary truncate">
                Convivencia
              </p>
              <p className="apple-caption-2 text-label-secondary font-medium truncate">
                Perfiles y accesos con PIN
              </p>
            </div>
          </Link>
        </main>
      </div>
    </div>
  );
}
