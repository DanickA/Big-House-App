'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUsuarios, deleteUsuario } from '@/actions/usuarios';
import UsuarioModal, { UsuarioItem } from '@/components/usuarios/UsuarioModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EmptyState from '@/components/ui/EmptyState';
import PullDownMenu from '@/components/ui/PullDownMenu';
import { ArrowLeft, UserPlus, ShieldCheck, Key, Pencil, Trash2, CheckCircle2, User, AlertCircle } from 'lucide-react';

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
    <div className="relative min-h-screen bg-system text-label-primary p-6 md:p-10 transition-colors duration-300">
      {/* Luces Ambientales */}
      <div className="ambient-glow-mint top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Notificación Flotante */}
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 apple-footnote font-medium text-label-secondary hover:text-label-primary transition mb-1"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>Volver al lobby</span>
            </Link>
            <h1 className="apple-large-title text-label-primary">
              Miembros del Hogar
            </h1>
            <p className="apple-subhead text-label-secondary">
              {usuarios.length} {usuarios.length === 1 ? 'miembro registrado' : 'miembros registrados'} en la casa
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setUsuarioAEditar(null);
              setIsModalOpen(true);
            }}
            className="btn-apple-filled px-5 text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
          >
            <UserPlus size={16} strokeWidth={2.4} />
            <span>Agregar miembro</span>
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
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta to-brand-deep text-white font-bold text-lg flex items-center justify-center shadow-md shadow-terracotta/15">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="apple-headline text-label-primary">{u.nombre}</h2>
                      <p className="apple-footnote text-label-secondary">{u.email}</p>
                    </div>
                  </div>

                  {/* Badge de Seguridad */}
                  {u.tienePin ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full apple-caption-2 font-semibold bg-[#c7e1d7]/60 dark:bg-mint/20 text-mint border border-[#6eb5a5]/30 dark:border-mint/40 shadow-2xs">
                      <ShieldCheck size={11} className="text-mint" />
                      <span>PIN activo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full apple-caption-2 font-medium bg-tertiary text-label-secondary border border-separator">
                      <Key size={11} />
                      <span>Solo clave</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-separator">
                  <span className="apple-caption-1 text-label-tertiary">
                    {u.fecha_registro
                      ? `Miembro desde ${new Date(u.fecha_registro).toLocaleDateString()}`
                      : 'Miembro del hogar'}
                  </span>

                  <PullDownMenu
                    ariaLabel={`Opciones de ${u.nombre}`}
                    groups={[
                      {
                        items: [
                          {
                            id: 'editar',
                            label: 'Editar miembro...',
                            icon: Pencil,
                            onClick: () => {
                              setUsuarioAEditar(u);
                              setIsModalOpen(true);
                            },
                          },
                        ],
                      },
                      {
                        items: [
                          {
                            id: 'eliminar',
                            label: 'Eliminar habitante',
                            icon: Trash2,
                            destructive: true,
                            onClick: () => handleEliminar(u),
                          },
                        ],
                      },
                    ]}
                  />
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