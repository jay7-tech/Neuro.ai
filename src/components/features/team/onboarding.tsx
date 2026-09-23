'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JoinTeamForm } from './join-team';
import { PatientForm } from './patient-form';

export function Onboarding({ role, onDone }: { role: 'patient' | 'caregiver' | 'clinician'; onDone: () => void }) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Join an existing care team</CardTitle>
          <CardDescription>
            Ask the patient or their caregiver for an invite code from their <em>Care team</em> page. Codes work once and expire after 72 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinTeamForm onJoined={onDone} />
        </CardContent>
      </Card>
      {role === 'caregiver' && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Add someone you care for</CardTitle>
            <CardDescription>For a loved one who won&apos;t use the app themselves. You can invite family and their doctor afterwards.</CardDescription>
          </CardHeader>
          <CardContent>
            <PatientForm onSaved={onDone} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
