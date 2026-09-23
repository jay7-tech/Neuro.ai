import { redirect } from 'next/navigation';
import { getCurrentUser, homePathFor } from '@/server/auth/current';
import { Logo } from '@/components/app/logo';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">{children}</main>
    </div>
  );
}
