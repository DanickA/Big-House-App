'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getServicios,
  deleteServicio,
  ServicioConEstado,
  ResumenServicios,
} from '@/actions/pagos';
import ServicioCard from '@/components/pagos/ServicioCard';
import ServicioFormModal from '@/components/pagos/ServicioFormModal';
import PagoModal from '@/components/pagos/PagoModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Receipt,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Clock,
  Filter,
} from 'lucide-react';

export default function FinanzasPage() {
  const [servicios, setServicios] = useState<ServicioConEstado[]>([]);
  const [resumen, setResumen] = useState<ResumenServicios>({
    totalServicios: 0,
    totalPresupuestoMensual: 0,
    totalProximosVencimientos: 0,
    cuentasVencidas: 0,
    cuentasPorVencer: 0,
    cuentasAlDia: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'pendientes' | 'al_dia'>('todos');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [servicioAEliminar, setServicioAEliminar] = useState<ServicioConEstado | null>(null);

  // Estados de Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [servicioAEditar, setServicioAEditar] = useState<ServicioConEstado | null>(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<ServicioConEstado | null>(null);
  const [pestanaModal, setPestanaModal] = useState<'pago' | 'historial'>('pago');

  async function cargarDatos() {
    setCargando(true);
    const res = await getServicios();
    if (res.success) {
      setServicios(res.servicios);
      setResumen(res.resumen);
    }
    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function notificarExito(mensaje: string) {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(null), 3500);
  }

  function notificarError(mensaje: string) {
    setMensajeError(mensaje);
    setTimeout(() => setMensajeError(null), 4000);
  }

  function handleEliminar(servicio: ServicioConEstado) {
    setServicioAEliminar(servicio);
  }

  async function confirmarEliminarServicio() {
    if (!servicioAEliminar) return;

    const res = await deleteServicio(servicioAEliminar.id);
    if (res.success) {
      notificarExito('Servicio eliminado correctamente');
      setServicioAEliminar(null);
      await cargarDatos();
    } else {
      notificarError(res.error || 'No se pudo eliminar el servicio');
      setServicioAEliminar(null);
    }
  }

  // Filtrado de servicios
  const serviciosFiltrados = servicios.filter((s) => {
    if (filtro === 'pendientes') {
      return s.estadoVencimiento === 'VENCIDO' || s.estadoVencimiento === 'POR_VENCER';
    }
    if (filtro === 'al_dia') {
      return s.estadoVencimiento === 'AL_DIA' || s.estadoVencimiento === 'PAGADO';
    }
    return true;
  });

  const presupuestoFormateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(resumen.totalPresupuestoMensual);

  return (
    <div className="relative min-h-screen bg-system text-label-primary p-6 md:p-10 overflow-hidden">
      {/* Luces Ambientales de Fondo */}
      <div className="ambient-glow-terracotta top-[-50px] right-[-50px]" />
      <div className="ambient-glow-mint bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Notificación Flotante Glassmorphic */}
        {mensajeExito && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-[#c7e1d7]/95 dark:bg-mint/20 border border-[#6eb5a5]/40 text-mint px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <CheckCircle2 size={18} className="text-mint" />
            <span>{mensajeExito}</span>
          </div>
        )}
        {mensajeError && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-[#ce9b8c]/30 dark:bg-terracotta/20 border border-[#aa4b50]/40 text-terracotta px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <AlertCircle size={18} className="text-terracotta" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Encabezado */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="apple-footnote font-medium text-label-secondary hover:text-label-primary transition flex items-center gap-1.5 mb-1"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>Volver al Lobby</span>
            </Link>
            <h1 className="apple-large-title text-label-primary tracking-tight">
              Pagos y Cuentas del Hogar
            </h1>
            <p className="apple-subhead text-label-secondary font-normal">
              Control de servicios públicos, facturas recurrentes y comprobantes compartidos
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setServicioAEditar(null);
              setIsFormOpen(true);
            }}
            className="btn-apple-filled px-5 text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Agregar servicio</span>
          </button>
        </header>

        {/* Métricas Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          
          {/* Métrica 1: Presupuesto Mensual */}
          <div className="glass-card p-5 rounded-[2rem] border border-white/80 dark:border-white/10 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-label-secondary">
              <span className="apple-caption-1 font-medium text-label-secondary">
                Gasto Mensual Estimado
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#ce9b8c]/25 dark:bg-terracotta/15 text-terracotta flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <p className="apple-title-1 font-bold text-terracotta tracking-tight tabular-nums">
              {cargando ? '...' : presupuestoFormateado}
            </p>
            <p className="apple-caption-2 text-label-secondary font-normal">
              Normalizado según periodicidad mensual/bimestral
            </p>
          </div>

          {/* Métrica 2: Cuentas que requieren atención */}
          <div className="glass-card p-5 rounded-[2rem] border border-white/80 dark:border-white/10 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-label-secondary">
              <span className="apple-caption-1 font-medium text-label-secondary">
                Por Pagar / Urgentes
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#ce9b8c]/25 dark:bg-terracotta/20 text-terracotta flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="apple-title-1 font-bold text-terracotta tracking-tight tabular-nums">
                {cargando ? '...' : resumen.cuentasVencidas + resumen.cuentasPorVencer}
              </p>
              <span className="apple-caption-1 font-medium text-label-secondary">
                ({resumen.cuentasVencidas} vencidas)
              </span>
            </div>
            <p className="apple-caption-2 text-label-secondary font-normal">
              {resumen.cuentasVencidas > 0
                ? 'Requieren atención inmediata'
                : 'Sin cuentas en mora'}
            </p>
          </div>

          {/* Métrica 3: Cuentas al día (Acento Menta) */}
          <div className="glass-card p-5 rounded-[2rem] border border-white/80 dark:border-white/10 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-label-secondary">
              <span className="apple-caption-1 font-medium text-label-secondary">
                Cuentas al Día
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#c7e1d7]/60 dark:bg-mint/20 text-mint flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <p className="apple-title-1 font-bold text-mint tracking-tight tabular-nums">
              {cargando ? '...' : resumen.cuentasAlDia}
            </p>
            <p className="apple-caption-2 text-label-secondary font-normal">
              De {resumen.totalServicios} servicios registrados
            </p>
          </div>

        </div>

        {/* Barra de Filtros Segmentada Apple HIG */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="w-full sm:w-auto">
            <SegmentedControl<'todos' | 'pendientes' | 'al_dia'>
              options={[
                { value: 'todos', label: 'Todos', count: servicios.length },
                {
                  value: 'pendientes',
                  label: 'Por Pagar',
                  count: resumen.cuentasVencidas + resumen.cuentasPorVencer,
                },
                { value: 'al_dia', label: 'Al Día', count: resumen.cuentasAlDia },
              ]}
              value={filtro}
              onChange={(val) => setFiltro(val)}
              fullWidth={false}
              ariaLabel="Filtrar servicios y facturas"
            />
          </div>

          <span className="text-xs text-label-secondary font-medium">
            Mostrando {serviciosFiltrados.length} compromisos
          </span>
        </div>

        {/* Cuadrícula de Servicios */}
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-[2rem] bg-white/40 dark:bg-tertiary/40 border border-white/60 dark:border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : serviciosFiltrados.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={
              servicios.length === 0
                ? 'No hay servicios ni cuentas registradas aún'
                : 'No hay cuentas que coincidan con el filtro'
            }
            description={
              servicios.length === 0
                ? 'Registra las facturas recurrentes de tu hogar como luz, agua, internet o arriendo para realizar un seguimiento automatizado.'
                : 'Prueba cambiando a otro filtro o registra una nueva factura recurrente.'
            }
            action={
              servicios.length === 0
                ? {
                    label: 'Agregar Primer Servicio',
                    onClick: () => {
                      setServicioAEditar(null);
                      setIsFormOpen(true);
                    },
                    icon: Plus,
                  }
                : {
                    label: 'Ver Todos los Servicios',
                    onClick: () => setFiltro('todos'),
                  }
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {serviciosFiltrados.map((s) => (
              <ServicioCard
                key={s.id}
                servicio={s}
                onRegistrarPago={(item) => {
                  setServicioSeleccionado(item);
                  setPestanaModal('pago');
                }}
                onVerHistorial={(item) => {
                  setServicioSeleccionado(item);
                  setPestanaModal('historial');
                }}
                onEdit={(item) => {
                  setServicioAEditar(item);
                  setIsFormOpen(true);
                }}
                onDelete={handleEliminar}
              />
            ))}
          </div>
        )}

      </div>

      {/* Modales Globales */}
      <ServicioFormModal
        isOpen={isFormOpen}
        servicioAEditar={servicioAEditar}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(msg) => {
          notificarExito(msg);
          cargarDatos();
        }}
      />

      <PagoModal
        servicio={servicioSeleccionado}
        pestanaInicial={pestanaModal}
        onClose={() => setServicioSeleccionado(null)}
        onSuccess={(msg) => {
          notificarExito(msg);
          cargarDatos();
        }}
      />

      <ConfirmModal
        isOpen={!!servicioAEliminar}
        title="¿Eliminar servicio?"
        description={`¿Deseas eliminar el servicio "${servicioAEliminar?.nombre_servicio}" y todos sus registros asociados? Esta acción no se puede revertir.`}
        confirmText="Eliminar servicio"
        variant="danger"
        onConfirm={confirmarEliminarServicio}
        onClose={() => setServicioAEliminar(null)}
      />
    </div>
  );
}
