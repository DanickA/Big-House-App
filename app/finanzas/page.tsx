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
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Receipt,
  DollarSign,
  AlertTriangle,
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

  async function handleEliminar(servicio: ServicioConEstado) {
    if (
      !window.confirm(
        `¿Deseas eliminar el servicio "${servicio.nombre_servicio}" y sus registros asociados?`
      )
    ) {
      return;
    }

    const res = await deleteServicio(servicio.id);
    if (res.success) {
      notificarExito('Servicio eliminado correctamente');
      await cargarDatos();
    } else {
      alert(res.error || 'No se pudo eliminar el servicio');
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
    <div className="relative min-h-screen bg-[#F4EFE6] text-[#2E2B27] p-6 md:p-10 overflow-hidden">
      {/* Luces Ambientales de Fondo */}
      <div className="ambient-glow-terracotta top-[-50px] right-[-50px]" />
      <div className="ambient-glow-olive bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Notificación Flotante Glassmorphic */}
        {mensajeExito && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-[#EEF2EA]/95 border border-[#B7CBA9] text-[#2D3E24] px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <CheckCircle2 size={18} className="text-[#5F6F52]" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Encabezado */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#736F68] hover:text-[#3A4630] transition uppercase tracking-wider mb-1"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>Volver al Lobby</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#3A4630] tracking-tight">
              Pagos y Cuentas del Hogar
            </h1>
            <p className="text-[#736F68] text-xs font-medium">
              Control de servicios públicos, facturas recurrentes y comprobantes compartidos
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setServicioAEditar(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-3 bg-[#5F6F52] hover:bg-[#4E5D42] text-white rounded-2xl text-xs font-bold transition shadow-md shadow-[#5F6F52]/20 flex items-center gap-2 cursor-pointer active:scale-95 self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Nuevo Servicio</span>
          </button>
        </header>

        {/* Métricas Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          
          {/* Métrica 1: Presupuesto Mensual */}
          <div className="glass-card p-5 rounded-[2rem] border border-white/80 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-[#736F68]">
              <span className="text-xs font-bold uppercase tracking-wider">
                Gasto Mensual Estimado
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EEF2EA] text-[#5F6F52] flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-black text-[#3A4630] tracking-tight">
              {cargando ? '...' : presupuestoFormateado}
            </p>
            <p className="text-[11px] text-[#736F68]">
              Normalizado según periodicidad mensual/bimestral
            </p>
          </div>

          {/* Métrica 2: Cuentas que requieren atención */}
          <div className="glass-card p-5 rounded-[2rem] border border-white/80 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-[#736F68]">
              <span className="text-xs font-bold uppercase tracking-wider">
                Por Pagar / Urgentes
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FAE2D8] text-[#B84626] flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl md:text-3xl font-black text-[#B84626] tracking-tight">
                {cargando ? '...' : resumen.cuentasVencidas + resumen.cuentasPorVencer}
              </p>
              <span className="text-xs font-bold text-[#736F68]">
                ({resumen.cuentasVencidas} vencidas)
              </span>
            </div>
            <p className="text-[11px] text-[#736F68]">
              {resumen.cuentasVencidas > 0
                ? 'Requieren atención inmediata'
                : 'Sin cuentas en mora'}
            </p>
          </div>

          {/* Métrica 3: Cuentas al día */}
          <div className="glass-card p-5 rounded-[2rem] border border-white/80 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-[#736F68]">
              <span className="text-xs font-bold uppercase tracking-wider">
                Cuentas al Día
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EEF2EA] text-[#5F6F52] flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-black text-[#5F6F52] tracking-tight">
              {cargando ? '...' : resumen.cuentasAlDia}
            </p>
            <p className="text-[11px] text-[#736F68]">
              De {resumen.totalServicios} servicios registrados
            </p>
          </div>

        </div>

        {/* Barra de Filtros */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#736F68] uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter size={13} />
              <span>Filtrar:</span>
            </span>

            {[
              { id: 'todos', label: `Todos (${servicios.length})` },
              {
                id: 'pendientes',
                label: `Por Pagar (${resumen.cuentasVencidas + resumen.cuentasPorVencer})`,
              },
              { id: 'al_dia', label: `Al Día (${resumen.cuentasAlDia})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                  filtro === f.id
                    ? 'bg-[#3A4630] text-white shadow-xs'
                    : 'bg-white/70 hover:bg-white text-[#736F68] border border-[#E8E0D2]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#736F68] font-medium">
            Mostrando {serviciosFiltrados.length} compromisos
          </span>
        </div>

        {/* Cuadrícula de Servicios */}
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-[2rem] bg-white/40 border border-white/60 animate-pulse"
              />
            ))}
          </div>
        ) : serviciosFiltrados.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-[2.5rem] border border-white/80 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#EEF2EA] border border-[#DCE7D3] text-[#5F6F52] flex items-center justify-center mx-auto shadow-2xs">
              <Receipt size={32} strokeWidth={1.8} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#3A4630]">
                {servicios.length === 0
                  ? 'No hay servicios ni cuentas registradas aún'
                  : 'No hay cuentas que coincidan con el filtro seleccionado'}
              </h3>
              <p className="text-xs text-[#736F68] max-w-md mx-auto">
                {servicios.length === 0
                  ? 'Registra las facturas recurrentes de tu hogar como luz, agua, internet o arriendo para realizar un seguimiento automatizado.'
                  : 'Prueba cambiando de filtro o registra un nuevo compromiso.'}
              </p>
            </div>
            {servicios.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setServicioAEditar(null);
                  setIsFormOpen(true);
                }}
                className="px-5 py-3 bg-[#5F6F52] hover:bg-[#4E5D42] text-white rounded-2xl text-xs font-bold transition shadow-md shadow-[#5F6F52]/20 inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Agregar Primer Servicio</span>
              </button>
            )}
          </div>
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
    </div>
  );
}
