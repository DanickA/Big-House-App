'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUsuarios, deleteUsuario } from '@/actions/usuarios';
import UsuarioModal, { UsuarioItem } from '@/components/usuarios/UsuarioModal';
import { ArrowLeft, UserPlus, ShieldCheck, Key, Edit2, Trash2, CheckCircle2, User } from 'lucide-react';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

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

  async function handleEliminar(usuario: UsuarioItem) {
    if (!window.confirm(`¿Estás seguro de eliminar a "${usuario.nombre}" del hogar?`)) return;
    const res = await deleteUsuario(usuario.id);
    if (res.success) {
      notificarExito('Miembro eliminado correctamente');
      await cargarLista();
    } else {
      alert(res.error || 'No se pudo eliminar el usuario');
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F4EFE6] text-[#2E2B27] p-6 md:p-10">
      {/* Luces Ambientales */}
      <div className="ambient-glow-olive top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Notificación Flotante */}
        {mensajeExito && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-[#EEF2EA]/90 border border-[#B7CBA9] text-[#2D3E24] px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <CheckCircle2 size={18} className="text-[#5F6F52]" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#736F68] hover:text-[#3A4630] transition uppercase tracking-wider mb-1"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>Volver al Lobby</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#3A4630] tracking-tight">
              Miembros del Hogar
            </h1>
            <p className="text-[#736F68] text-xs font-medium">
              {usuarios.length} {usuarios.length === 1 ? 'miembro registrado' : 'miembros registrados'} en la casa
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setUsuarioAEditar(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-3 bg-[#5F6F52] hover:bg-[#4E5D42] text-white rounded-2xl text-xs font-bold transition shadow-md shadow-[#5F6F52]/20 flex items-center gap-2 cursor-pointer active:scale-95 self-start sm:self-auto"
          >
            <UserPlus size={16} strokeWidth={2.5} />
            <span>Agregar Miembro</span>
          </button>
        </div>

        {/* Listado de Tarjetas de Miembros */}
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((n) => (
              <div key={n} className="h-44 rounded-[2rem] bg-white/40 border border-white/60 animate-pulse" />
            ))}
          </div>
        ) : usuarios.length === 0 ? (
          <div className="glass-card rounded-[2.5rem] p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-[#EEF2EA] border border-[#DCE7D3] flex items-center justify-center text-[#3A4630] mx-auto shadow-2xs">
              <User size={28} />
            </div>
            <div>
              <p className="text-base font-extrabold text-[#3A4630]">Aún no hay miembros registrados.</p>
              <p className="text-xs text-[#736F68] font-medium mt-1">Registra a las personas del hogar para coordinar tareas y cuentas.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setUsuarioAEditar(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#5F6F52] hover:bg-[#4E5D42] text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Registrar Primer Miembro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {usuarios.map((u) => (
              <div
                key={u.id}
                className="glass-card glass-card-hover p-6 rounded-[2rem] flex flex-col justify-between space-y-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#5F6F52] to-[#3A4630] text-white font-black text-xl flex items-center justify-center shadow-md shadow-[#3A4630]/15">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#3A4630] tracking-tight">{u.nombre}</h2>
                      <p className="text-xs text-[#736F68] font-medium">{u.email}</p>
                    </div>
                  </div>

                  {/* Badge de Seguridad */}
                  {u.tienePin ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[#EEF2EA] text-[#3A4630] border border-[#DCE7D3] shadow-2xs">
                      <ShieldCheck size={11} className="text-[#5F6F52]" />
                      <span>PIN Activo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-[#F4EFE6] text-[#736F68] border border-[#E8E0D2]">
                      <Key size={11} />
                      <span>Solo Clave</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-[#F0EAE1]">
                  <span className="text-[11px] text-[#A39E95] font-medium">
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
                      className="px-3.5 py-1.5 bg-white/80 hover:bg-white text-[#3A4630] border border-[#E8E0D2] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Edit2 size={11} strokeWidth={2.2} />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(u)}
                      className="p-2 bg-white/80 hover:bg-[#FAE2D8] text-[#736F68] hover:text-[#B84626] border border-[#E8E0D2] hover:border-[#F2BAA5] rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
                      title="Eliminar usuario"
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
    </div>
  );
}