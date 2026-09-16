'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUsuarios, deleteUsuario } from '@/actions/usuarios';
import UsuarioModal, { UsuarioItem } from '@/components/usuarios/UsuarioModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EmptyState from '@/components/ui/EmptyState';
import { ArrowLeft, UserPlus, ShieldCheck, Key, Edit2, Trash2, CheckCircle2, User, AlertCircle } from 'lucide-react';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioItem | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<UsuarioItem | null>(null);

  async function cargarLista() {
    setCargando(true);
    const res = await getUsuarios();
    if (res.success && res.data) {
      setUsuarios(res.data as unknown as UsuarioItem[]);
    }
    setCargando(false);
  }

  useEffect(() => {
    cargarLista();
  }, []);

  function notificarExito(mensaje: string) {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(null), 3500);
  }

  function notificarError(mensaje: string) {
    setMensajeError(mensaje);
    setTimeout(() => setMensajeError(null), 4000);
  }

  function handleEliminar(usuario: UsuarioItem) {
    setUsuarioAEliminar(usuario);
  }

  async function confirmarEliminarUsuario() {
    if (!usuarioAEliminar) return;
    const res = await deleteUsuario(usuarioAEliminar.id);
    if (res.success) {
      notificarExito('Miembro eliminado correctamente');
      setUsuarioAEliminar(null);
      await cargarLista();
    } else {
      notificarError(res.error || 'No se pudo eliminar el usuario');
      setUsuarioAEliminar(null);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F4EFE6] dark:bg-system text-[#2E2B27] dark:text-label-primary p-6 md:p-10 transition-colors duration-300">
      {/* Luces Ambientales */}
      <div className="ambient-glow-olive top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Notificación Flotante */}
        {mensajeExito && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-[#EEF2EA]/90 dark:bg-secondary/95 border border-[#B7CBA9] dark:border-olive/40 text-[#2D3E24] dark:text-olive px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <CheckCircle2 size={18} className="text-[#5F6F52] dark:text-olive" />
            <span>{mensajeExito}</span>
          </div>
        )}
        {mensajeError && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-[#FBEAE5]/95 dark:bg-secondary/95 border border-[#E8B4A2] dark:border-terracotta/40 text-[#C86242] dark:text-terracotta px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <AlertCircle size={18} className="text-[#C86242] dark:text-terracotta" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#736F68] dark:text-label-tertiary hover:text-[#3A4630] dark:hover:text-label-primary transition uppercase tracking-wider mb-1"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>Volver al Lobby</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#3A4630] dark:text-label-primary tracking-tight">
              Miembros del Hogar
            </h1>
            <p className="text-[#736F68] dark:text-label-secondary text-xs font-medium">
              {usuarios.length} {usuarios.length === 1 ? 'miembro registrado' : 'miembros registrados'} en la casa
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setUsuarioAEditar(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-3 bg-[#5F6F52] dark:bg-olive hover:bg-[#4E5D42] dark:hover:opacity-90 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-[#5F6F52]/20 dark:shadow-none flex items-center gap-2 cursor-pointer active:scale-95 self-start sm:self-auto"
          >
            <UserPlus size={16} strokeWidth={2.5} />
            <span>Agregar Miembro</span>
          </button>
        </div>

        {/* Listado de Tarjetas de Miembros */}
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((n) => (
              <div key={n} className="h-44 rounded-[2rem] bg-white/40 dark:bg-secondary/40 border border-white/60 dark:border-separator animate-pulse" />
            ))}
          </div>
        ) : usuarios.length === 0 ? (
          <EmptyState
            icon={User}
            title="Aún no hay miembros registrados"
            description="Registra a las personas del hogar para coordinar tareas, compras y cuentas compartidas."
            action={{
              label: 'Registrar Primer Miembro',
              onClick: () => {
                setUsuarioAEditar(null);
                setIsModalOpen(true);
              },
              icon: UserPlus,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {usuarios.map((u) => (
              <div
                key={u.id}
                className="glass-card glass-card-hover p-6 rounded-[2rem] flex flex-col justify-between space-y-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#5F6F52] to-[#3A4630] dark:from-olive dark:to-[#3A4630] text-white font-black text-xl flex items-center justify-center shadow-md shadow-[#3A4630]/15 dark:shadow-none">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#3A4630] dark:text-label-primary tracking-tight">{u.nombre}</h2>
                      <p className="text-xs text-[#736F68] dark:text-label-secondary font-medium">{u.email}</p>
                    </div>
                  </div>

                  {/* Badge de Seguridad */}
                  {u.tienePin ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[#EEF2EA] dark:bg-secondary text-[#3A4630] dark:text-olive border border-[#DCE7D3] dark:border-separator shadow-2xs">
                      <ShieldCheck size={11} className="text-[#5F6F52] dark:text-olive" />
                      <span>PIN Activo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-[#F4EFE6] dark:bg-tertiary text-[#736F68] dark:text-label-tertiary border border-[#E8E0D2] dark:border-separator">
                      <Key size={11} />
                      <span>Solo Clave</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-[#F0EAE1] dark:border-separator">
                  <span className="text-[11px] text-[#A39E95] dark:text-label-tertiary font-medium">
                    {u.fecha_registro
                      ? `Miembro desde ${new Date(u.fecha_registro).toLocaleDateString()}`
                      : 'Miembro del hogar'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUsuarioAEditar(u);
                        setIsModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-white/80 dark:bg-tertiary hover:bg-white dark:hover:bg-secondary text-[#3A4630] dark:text-label-primary border border-[#E8E0D2] dark:border-separator rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Edit2 size={11} strokeWidth={2.2} />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(u)}
                      className="p-2 bg-white/80 dark:bg-tertiary hover:bg-[#FAE2D8] dark:hover:bg-terracotta/20 text-[#736F68] dark:text-label-tertiary hover:text-[#B84626] dark:hover:text-terracotta border border-[#E8E0D2] dark:border-separator hover:border-[#F2BAA5] dark:hover:border-terracotta/30 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
                      title="Eliminar usuario"
                      aria-label="Eliminar usuario"
                    >
                      <Trash2 size={13} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal de Creación / Edición Global */}
      <UsuarioModal
        isOpen={isModalOpen}
        usuarioAEditar={usuarioAEditar}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(msg) => {
          notificarExito(msg);
          cargarLista();
        }}
      />

      <ConfirmModal
        isOpen={!!usuarioAEliminar}
        title="¿Eliminar habitante?"
        description={`¿Estás seguro de que deseas eliminar a "${usuarioAEliminar?.nombre}" del hogar? Perderá acceso inmediato al sistema.`}
        confirmText="Eliminar habitante"
        variant="danger"
        onConfirm={confirmarEliminarUsuario}
        onClose={() => setUsuarioAEliminar(null)}
      />
    </div>
  );
}