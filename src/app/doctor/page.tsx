'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, useActivePatient } from '@/components/app/staff-shell';
import { InsightsPanel } from '@/components/features/insights/insights-panel';
import { usePatient } from '@/hooks/api';

export default function DoctorOverview() {
  const { patient, patients } = useActivePatient();
  const detail = usePatient(patient.id);
  return (
    <>
      <PageHeader title={patient.displayName} description="30-day clinical summary." />
      <div className="grid items-start gap-6 xl:grid-cols-4">
        <div className="space-y-6 xl:col-span-3">
          {detail.data?.medicalSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medical summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{detail.data.medicalSummary}</CardContent>
            </Card>
          )}
          <InsightsPanel patientId={patient.id} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My patients ({patients.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patients.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span className={p.id === patient.id ? 'font-semibold' : ''}>{p.displayName}</span>
                <span className="flex gap-1">
                  {p.openAlerts > 0 && <Badge variant="destructive">{p.openAlerts}</Badge>}
                  {p.unreadMessages > 0 && <Badge variant="secondary">{p.unreadMessages}</Badge>}
                </span>
              </div>
            ))}
            <p className="pt-2 text-xs text-muted-foreground">Switch patients from the selector at the top.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
