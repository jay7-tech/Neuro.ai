import { redirect } from 'next/navigation';
import { getCurrentUser, homePathFor } from '@/server/auth/current';
import { CaregiverShell } from '@/components/app/role-shells';

export default async function CaregiverLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/caregiver');
  if (user.role !== 'caregiver') redirect(homePathFor(user.role));
  return <CaregiverShell user={user}>{children}</CaregiverShell>;
}
