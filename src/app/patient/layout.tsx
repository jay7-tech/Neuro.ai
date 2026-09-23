import { redirect } from 'next/navigation';
import { getCurrentUser, homePathFor } from '@/server/auth/current';
import { getDb } from '@/server/db/client';
import { ownPatientRecord } from '@/server/services/me';
import { PatientShell } from '@/components/app/patient-shell';

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/patient');
  if (user.role !== 'patient') redirect(homePathFor(user.role));
  const record = await ownPatientRecord(getDb(), user.id);
  if (!record) redirect('/login');
  return <PatientShell user={user} patientId={record.id}>{children}</PatientShell>;
}
