import { redirect } from 'next/navigation';
import { getCurrentUser, homePathFor } from '@/server/auth/current';
import { ClinicianShell } from '@/components/app/role-shells';

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/doctor');
  if (user.role !== 'clinician') redirect(homePathFor(user.role));
  return <ClinicianShell user={user}>{children}</ClinicianShell>;
}
