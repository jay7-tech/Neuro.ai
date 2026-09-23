'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackLink, usePatientContext } from '@/components/app/patient-shell';
import { QueryState } from '@/components/common/query-state';
import { TeamPanel } from '@/components/features/team/team-panel';
import { usePatient } from '@/hooks/api';

export default function ProfilePage() {
  const { patientId, meId } = usePatientContext();
  const patient = usePatient(patientId);
  return (
    <div className="space-y-8">
      <BackLink />
      <QueryState query={patient}>
        {(p) => (
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-3xl">{p.displayName}</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-lg sm:grid-cols-2">
              <p><span className="text-muted-foreground">Born:</span> {p.dateOfBirth ?? '—'}</p>
              <p><span className="text-muted-foreground">Blood group:</span> {p.bloodGroup ?? '—'}</p>
              <p className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> {p.address ?? '—'}</p>
            </CardContent>
          </Card>
        )}
      </QueryState>
      <div>
        <h2 className="mb-4 text-2xl font-bold">My care team</h2>
        <TeamPanel patientId={patientId} myRole="patient" myUserId={meId} />
      </div>
    </div>
  );
}
