import { Suspense } from 'react';
import { LoginForm } from '@/components/app/auth-form';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
