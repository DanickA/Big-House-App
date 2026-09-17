import { getMiembrosParaSelector } from '@/actions/auth';
import LoginForm from '@/components/auth/LoginForm';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const res = await getMiembrosParaSelector();
  const miembros = res.success ? res.data : [];

  return (
    <Suspense fallback={<div className="min-h-screen bg-system flex items-center justify-center text-xs text-label-secondary">Cargando acceso...</div>}>
      <LoginForm initialMiembros={miembros} />
    </Suspense>
  );
}
