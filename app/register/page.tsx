import RegisterForm from '@/components/auth/RegisterForm';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center text-xs text-[#736F68]">Cargando registro...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
