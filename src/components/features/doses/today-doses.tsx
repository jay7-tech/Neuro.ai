'use client';

import { Check, Clock, Pill, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRecordDose, useTodayDoses } from '@/hooks/api';
import { EmptyState, QueryState } from '@/components/common/query-state';
import { errorMessage } from '@/lib/api-client';
import type { DoseItem } from '@/lib/api-types';
import { cn } from '@/lib/utils';

const STATE: Record<DoseItem['state'], { label: string; className: string }> = {
  upcoming: { label: 'Upcoming', className: 'bg-muted text-muted-foreground' },
  due: { label: 'Due now', className: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100' },
  taken: { label: 'Taken', className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100' },
  taken_late: { label: 'Taken late', className: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100' },
  skipped: { label: 'Skipped', className: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100' },
  missed: { label: 'Missed', className: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100' },
};

/**
 * Today's doses. The patient variant has large touch targets; staff can record on
 * the patient's behalf (e.g. a caregiver who handed over the pill).
 */
export function TodayDoses({ patientId, variant = 'staff' }: { patientId: string; variant?: 'patient' | 'staff' }) {
  const q = useTodayDoses(patientId);
  const record = useRecordDose(patientId);
  const { toast } = useToast();
  const big = variant === 'patient';

  const mark = (d: DoseItem, status: 'taken' | 'skipped') =>
    record.mutate(
      { medicationId: d.medicationId, scheduledFor: d.scheduledFor, status },
      {
        onSuccess: () => big && status === 'taken' && toast({ title: 'Well done!', description: `${d.name} marked as taken.` }),
        onError: (e) => toast({ title: 'Could not save', description: errorMessage(e), variant: 'destructive' }),
      },
    );

  return (
    <Card className={cn(big && 'rounded-2xl shadow-xl')}>
      <CardHeader>
        <CardTitle className={cn('flex items-center gap-2', big && 'text-2xl')}><Pill /> {big ? 'My medicine today' : "Today's doses"}</CardTitle>
        <CardDescription>{big ? 'Tap the green button after you take each one.' : 'Live status. Doses count as missed 60 minutes after their time.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <QueryState query={q}>
          {(data) =>
            data.doses.length === 0 ? (
              <EmptyState icon={Pill} title="No medicine scheduled today" />
            ) : (
              <ul className="space-y-3">
                {data.doses.map((d) => {
                  const actionable = d.state === 'due' || d.state === 'upcoming' || d.state === 'missed';
                  return (
                    <li key={`${d.medicationId}-${d.scheduledFor}`} className={cn('flex flex-wrap items-center gap-3 rounded-xl border p-3', big && 'p-4')}>
                      <div className={cn('flex w-16 items-center gap-1 font-mono', big ? 'text-xl' : 'text-sm')}>
                        <Clock className="h-4 w-4 text-muted-foreground" /> {d.localTime}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('font-semibold', big && 'text-lg')}>{d.name}</p>
                        <p className="text-sm text-muted-foreground">{d.dosage}{d.instructions ? ` · ${d.instructions}` : ''}</p>
                      </div>
                      <Badge className={cn('border-0', STATE[d.state].className)}>{STATE[d.state].label}</Badge>
                      {actionable && (
                        <div className="flex gap-2">
                          <Button size={big ? 'lg' : 'sm'} className="bg-emerald-600 hover:bg-emerald-700" onClick={() => mark(d, 'taken')} disabled={record.isPending}>
                            <Check className="mr-1 h-4 w-4" /> Taken
                          </Button>
                          {!big && (
                            <Button size="sm" variant="outline" onClick={() => mark(d, 'skipped')} disabled={record.isPending}>
                              <X className="mr-1 h-4 w-4" /> Skip
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )
          }
        </QueryState>
      </CardContent>
    </Card>
  );
}
