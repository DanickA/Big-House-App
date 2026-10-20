'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sprout,
  Receipt,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Droplets,
  Undo2,
  Loader2,
  ChevronRight,
  Sparkles,
  Plus,
  Compass,
  BellRing,
  Cloud,
} from 'lucide-react';
import type { LobbyHUDProps } from '@/components/lobby/LobbyHUD';
import type { UrgentPlant } from '@/components/lobby/FocusActionBanner';
import { registrarCuidado, deshacerCuidado } from '@/actions/plantas';

/**
 * Lobby (Home) · Flujo Ejecutivo en 2 Bloques.
 * Superficies B3-1 (claro) / B3-2 (oscuro):
 *  - Plano 1 (.glass-card): secciones y tarjetas de módulo.
 *  - Plano 2 (bg-tertiary + border-separator): celdas internas, sin texturas superpuestas.
 * Jerarquía Tri-Tono: label-primary (títulos/cifras) · label-secondary (descripción) · label-tertiary (metadatos).
 * Regla de cero duplicidad: el detalle de alertas vive solo en "Atención inmediata";
 * el distribuidor muestra únicamente el resumen ejecutivo de cada módulo.
 */
export default function LobbyView({
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

  const cuentasVencidas = resServicios.resumen.cuentasVencidas;
  const cuentasPorVencer = resServicios.resumen.cuentasPorVencer;
  const proximoEvento = resEventos.proximos?.[0];
  const totalAlertas =
    plantasUrgentes.length + cuentasVencidas + (cuentasPorVencer > 0 ? 1 : 0);

  const nombreUsuario = session?.nombre ? session.nombre.split(' ')[0] : 'Habitante';

  const formatCOPCompact = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(val);

  const handleQuickWater = async (planta: UrgentPlant) => {
    if (procesandoId) return;
    setProcesandoId(planta.id);
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
      setPlantasUrgentes((prev) => [planta, ...prev]);
    } finally {
      setProcesandoId(null);
    }
  };

  const handleUndoWater = async () => {
    if (!undoItem || procesandoId) return;
    const item = undoItem;
    setUndoItem(null);
    setProcesandoId(item.plantaId);

    try {
      await deshacerCuidado(item.historialId);
      const plantaRestaurada = initialPlantasUrgentes.find((p) => p.id === item.plantaId) || {
        id: item.plantaId,
        nombre_comun: item.nombre,
        frecuencia_dias: 7,
        diasRestantes: 0,
        requiereRiego: true,
      };
      setPlantasUrgentes((prev) => [plantaRestaurada, ...prev]);
    } catch {
      // ignore
    } finally {
      setProcesandoId(null);
    }
  };

  const shortcutClass =
    'px-3 py-1.5 rounded-xl bg-secondary hover:bg-tertiary border border-separator text-label-primary text-xs font-semibold flex items-center gap-1.5 transition shrink-0';
  const wellClass =
    'p-3.5 rounded-2xl bg-tertiary border border-separator flex flex-col justify-between gap-3';
  const eyebrowClass =
    'inline-block text-[10px] font-bold uppercase tracking-wider text-label-tertiary';
  const wellLinkClass =
    'w-full py-1.5 px-3 rounded-xl bg-secondary border border-separator hover:bg-terracotta hover:text-system hover:border-terracotta text-label-primary text-xs font-bold flex items-center justify-center gap-1 transition';
  const moduleCardClass =
    'glass-card glass-card-hover p-4 sm:p-5 rounded-[1.8rem] flex flex-col justify-between min-h-[148px] group transition-all active:scale-98';

  const modulos = [
    {
      href: '/plantas',
      titulo: 'Jardín',
      icon: Sprout,
      metrica: `${resumenPlantas.totalPlantas} especies activas`,
      detalle: 'Ciclos de riego y guía botánica',
    },
    {
      href: '/finanzas',
      titulo: 'Finanzas',
      icon: Receipt,
      metrica: `${formatCOPCompact(resServicios.resumen.totalPresupuestoMensual)} / mes`,
      detalle: 'Recibos y Fondo Común',
    },
    {
      href: '/calendario',
      titulo: 'Agenda',
      icon: Calendar,
      metrica: `${resEventos.totalEventosSemana} eventos esta semana`,
      detalle: 'Sincronización Google Calendar',
    },
    {
      href: '/usuarios',
      titulo: 'Habitantes',
      icon: Users,
      metrica: 'Comunidad y accesos',
      detalle: 'Perfiles y PIN rápido de 4 dígitos',
    },
  ];

  return (
    <div className="relative min-h-[calc(100dvh-110px)] bg-system text-label-primary p-4 sm:p-8 transition-colors duration-300 overflow-hidden">
      <div className="ambient-glow-mint top-[-90px] left-[-40px]" />
      <div className="ambient-glow-terracotta bottom-[-80px] right-[-40px]" />

      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-5 animate-fade-in-up">
        {/* CABECERA DE ANCLAJE Y ORIENTACIÓN */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-separator">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-terracotta text-system flex items-center justify-center font-bold text-base shrink-0">
              {nombreUsuario.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-label-primary tracking-tight">
                  Hola, {nombreUsuario}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary text-label-secondary border border-separator">
                  Centro del Hogar
                </span>
              </div>
              <p className="text-xs text-label-tertiary capitalize flex items-center gap-1.5 mt-0.5">
                <Clock size={12} />
                <span>{fechaHoy}</span>
              </p>
            </div>
          </div>

          {/* Accesos rápidos de 1 toque */}
          <nav aria-label="Accesos rápidos" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <Link href="/calendario" className={shortcutClass}>
              <Plus size={13} className="text-terracotta" />
              <span>Agendar</span>
            </Link>
            <Link href="/finanzas" className={shortcutClass}>
              <Receipt size={13} className="text-terracotta" />
              <span>Registrar pago</span>
            </Link>
            <Link href="/plantas" className={shortcutClass}>
              <Sprout size={13} className="text-terracotta" />
              <span>Jardín</span>
            </Link>
          </nav>
        </header>

        {/* Deshacer Riego Express */}
        {undoItem && (
          <div
            role="status"
            className="glass-card p-3 rounded-2xl flex items-center justify-between gap-3 animate-fade-in"
          >
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={16} className="text-terracotta shrink-0" />
              <span className="font-medium text-label-secondary">
                Riego de <strong className="font-bold text-label-primary">{undoItem.nombre}</strong> completado.
              </span>
            </div>
            <button
              type="button"
              onClick={handleUndoWater}
              disabled={!!procesandoId}
              className="px-2.5 py-1 rounded-xl bg-tertiary border border-separator text-label-primary text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Undo2 size={12} />
              <span>Deshacer</span>
            </button>
          </div>
        )}

        {/* BLOQUE 1: ATENCIÓN INMEDIATA Y REANUDACIÓN DE TAREAS */}
        <section
          aria-label="Atención inmediata en el hogar"
          className="glass-card p-4 sm:p-5 rounded-[1.8rem] space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-terracotta text-system flex items-center justify-center shrink-0">
                <BellRing size={14} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-label-primary">Atención inmediata</h2>
                <p className="text-[11px] text-label-secondary">
                  {totalAlertas === 0
                    ? 'Todo está en orden hoy. No tienes alertas críticas.'
                    : 'Resuelve pendientes en 1 toque o retoma donde lo dejaste'}
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-tertiary text-label-primary border border-separator tabular-nums">
              {totalAlertas === 0 ? 'Al día' : `${totalAlertas} pendientes`}
            </span>
          </div>

          {totalAlertas === 0 && !proximoEvento ? (
            <div className="p-3.5 rounded-2xl bg-tertiary border border-separator flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-label-primary">
                <CheckCircle2 size={16} className="text-terracotta shrink-0" />
                <span>Jardín hidratado y cuentas al día. Disfruta tu hogar.</span>
              </div>
              <Link
                href="/calendario"
                className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1"
              >
                <span>Ver agenda</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Riego urgente */}
              {plantasUrgentes.length > 0 ? (
                <div className={wellClass}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className={eyebrowClass}>Riego requerido ({plantasUrgentes.length})</span>
                      <p className="text-sm font-bold text-label-primary truncate mt-0.5">
                        {plantasUrgentes[0].nombre_comun}
                      </p>
                      <p className="text-[11px] text-label-secondary">
                        {plantasUrgentes.length > 1
                          ? `+ ${plantasUrgentes.length - 1} planta(s) más por hidratar`
                          : 'Necesita agua hoy'}
                      </p>
                    </div>
                    <Sprout size={18} className="text-terracotta shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleQuickWater(plantasUrgentes[0])}
                      disabled={!!procesandoId}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-terracotta text-system border border-terracotta text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      {procesandoId === plantasUrgentes[0].id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Droplets size={13} />
                      )}
                      <span>Regar ahora</span>
                    </button>
                    <Link
                      href="/plantas"
                      className="py-1.5 px-2.5 rounded-xl bg-secondary border border-separator text-label-primary text-xs font-semibold hover:bg-system transition"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-tertiary border border-separator flex items-center justify-between gap-2">
                  <div>
                    <span className={eyebrowClass}>Cuidado botánico</span>
                    <p className="text-xs font-bold text-label-primary mt-0.5">
                      Todas las plantas hidratadas
                    </p>
                  </div>
                  <CheckCircle2 size={18} className="text-terracotta shrink-0" />
                </div>
              )}

              {/* Recibos */}
              <div className={wellClass}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className={eyebrowClass}>
                      {cuentasVencidas > 0
                        ? 'Atención financiera'
                        : cuentasPorVencer > 0
                        ? 'Próximo vencimiento'
                        : 'Finanzas al día'}
                    </span>
                    <p className="text-sm font-bold text-label-primary truncate mt-0.5">
                      {cuentasVencidas > 0
                        ? `${cuentasVencidas} ${cuentasVencidas === 1 ? 'recibo vencido' : 'recibos vencidos'}`
                        : cuentasPorVencer > 0
                        ? `${cuentasPorVencer} por vencer pronto`
                        : 'Sin recibos vencidos'}
                    </p>
                    <p className="text-[11px] text-label-secondary truncate tabular-nums">
                      Presupuesto mes: {formatCOPCompact(resServicios.resumen.totalPresupuestoMensual)}
                    </p>
                  </div>
                  <Receipt size={18} className="text-terracotta shrink-0" />
                </div>

                <Link href="/finanzas" className={wellLinkClass}>
                  <span>{cuentasVencidas > 0 ? 'Saldar recibo' : 'Revisar cuentas'}</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {/* Próximo compromiso */}
              <div className={wellClass}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className={eyebrowClass}>Próximo en agenda</span>
                    <p className="text-sm font-bold text-label-primary truncate mt-0.5">
                      {proximoEvento ? proximoEvento.titulo : 'Agenda despejada'}
                    </p>
                    <p className="text-[11px] text-label-secondary truncate capitalize">
                      {proximoEvento
                        ? new Date(proximoEvento.fecha_inicio).toLocaleDateString('es-CO', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Ningún evento próximo'}
                    </p>
                  </div>
                  <Calendar size={18} className="text-terracotta shrink-0" />
                </div>

                <Link href="/calendario" className={wellLinkClass}>
                  <span>Abrir calendario</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* BLOQUE 2: DISTRIBUIDOR DE MÓDULOS (solo resumen ejecutivo) */}
        <section aria-label="Módulos del hogar" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-label-tertiary flex items-center gap-1.5">
              <Compass size={13} />
              <span>Ecosistema del hogar</span>
            </h2>
            <span className="text-[11px] text-label-tertiary">4 módulos</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {modulos.map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.href} href={m.href} prefetch={true} className={moduleCardClass}>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-terracotta text-system flex items-center justify-center group-hover:scale-105 transition">
                      <Icon size={20} />
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="text-label-tertiary group-hover:text-terracotta transition"
                    />
                  </div>
                  <div className="space-y-0.5 pt-3">
                    <h3 className="text-sm sm:text-base font-bold text-label-primary">{m.titulo}</h3>
                    <p className="text-xs font-semibold text-label-secondary tabular-nums">{m.metrica}</p>
                    <p className="text-[11px] text-label-tertiary line-clamp-2 leading-tight">{m.detalle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* DESCUBRIMIENTO CONTEXTUAL */}
        <aside className="px-4 py-3 rounded-2xl bg-tertiary border border-separator flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-label-secondary">
            <Sparkles size={14} className="text-terracotta shrink-0" />
            <span>
              <strong className="text-label-primary">¿Sabías que…?</strong> Puedes vincular Google
              Calendar en Agenda o consultar la guía de cuidado de cada planta.
            </span>
          </div>
          <Link
            href="/calendario"
            className="font-bold text-terracotta hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <Cloud size={12} />
            <span>Explorar sincronización</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
