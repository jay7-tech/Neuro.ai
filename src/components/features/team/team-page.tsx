'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, useActivePatient } from '@/components/app/staff-shell';
import { useMe } from '@/hooks/api';
import { JoinTeamForm } from './join-team';
import { PatientForm } from './patient-form';
import { TeamPanel } from './team-panel';

export function TeamPage() {
  const { patient } = useActivePatient();
  const me = useMe();
  const qc = useQueryClient();
  const user = me.data?.user;
  if (!user) return null;

  return (
    <>
      <PageHeader title="Care team" description={`People looking after ${patient.displayName}.`} />
      <TeamPanel patientId={patient.id} myRole={patient.role} myUserId={user.id} />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Join another care team</CardTitle>
            <CardDescription>Have an invite code for someone else? Enter it here.</CardDescription>
          </CardHeader>
          <CardContent><JoinTeamForm /></CardContent>
        </Card>
        {user.role === 'caregiver' && (
          <Card>
            <CardHeader>
              <CardTitle>Add another patient</CardTitle>
              <CardDescription>You&apos;ll be their first caregiver.</CardDescription>
            </CardHeader>
            <CardContent><PatientForm onSaved={() => qc.invalidateQueries({ queryKey: ['me'] })} /></CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
