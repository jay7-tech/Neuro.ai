'use client';

import { Bell, CalendarCheck, MessageSquare, Pill } from 'lucide-react';
import { PageHeader, useActivePatient } from '@/components/app/staff-shell';
import { AlertsPanel } from '@/components/features/alerts/alerts-panel';
import { TodayDoses } from '@/components/features/doses/today-doses';
import { DayPlan } from '@/components/features/plan/day-plan';
import { MoodChart } from '@/components/features/mood/mood';
import { CaregiverTip } from '@/components/features/ai/caregiver-tip';
import { usePlan, useTodayDoses } from '@/hooks/api';

function Kpi({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <Icon className="h-8 w-8 text-primary" />
      <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>
    </div>
  );
}

export default function CaregiverOverview() {
  const { patient } = useActivePatient();
  const doses = useTodayDoses(patient.id);
  const plan = usePlan(patient.id);
  const taken = doses.data?.doses.filter((d) => d.state === 'taken' || d.state === 'taken_late').length ?? 0;
  const done = plan.data?.items.filter((i) => i.completed).length ?? 0;

  return (
    <>
      <PageHeader title={`${patient.displayName} today`} description="Live view — updates as the patient and team act." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Pill} label="Doses taken" value={doses.data ? `${taken} / ${doses.data.doses.length}` : '…'} />
        <Kpi icon={CalendarCheck} label="Plan done" value={plan.data ? `${done} / ${plan.data.items.length}` : '…'} />
        <Kpi icon={Bell} label="Open alerts" value={String(patient.openAlerts)} />
        <Kpi icon={MessageSquare} label="Unread messages" value={String(patient.unreadMessages)} />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <AlertsPanel patientId={patient.id} canAct />
        <TodayDoses patientId={patient.id} />
        <DayPlan patientId={patient.id} />
        <div className="space-y-6">
          <CaregiverTip />
          <MoodChart patientId={patient.id} days={14} />
        </div>
      </div>
    </>
  );
}
