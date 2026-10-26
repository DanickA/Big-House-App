import { getUsuarios } from '@/actions/usuarios';
import UsuariosView from '@/components/usuarios/UsuariosView';
import type { UsuarioItem } from '@/components/usuarios/types';

export default async function UsuariosPage() {
  const res = await getUsuarios();
  const initialUsuarios = res.success && res.data ? (res.data as unknown as UsuarioItem[]) : [];

  return <UsuariosView initialUsuarios={initialUsuarios} />;
}