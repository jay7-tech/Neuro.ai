'use client';

import { PageHeader, useActivePatient } from '@/components/app/staff-shell';
import { AuditLog } from '@/components/features/audit/audit-log';

export default function ActivityPage() {
  const { patient } = useActivePatient();
  return (
    <>
      <PageHeader title="Activity log" description="Who changed what, and when." />
      <AuditLog patientId={patient.id} />
    </>
  );
}
