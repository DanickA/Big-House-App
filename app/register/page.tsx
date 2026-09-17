import RegisterForm from '@/components/auth/RegisterForm';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-system flex items-center justify-center text-xs text-label-secondary">Cargando registro...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
