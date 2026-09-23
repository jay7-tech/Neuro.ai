'use client';

import { AlertTriangle, Bell, BellOff, Check, CheckCheck, MapPin, Pill, Smile, Siren } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useAlerts, useUpdateAlert } from '@/hooks/api';
import { EmptyState, QueryState } from '@/components/common/query-state';
import { ago } from '@/components/common/format';
import type { AlertItem } from '@/lib/api-types';
import { cn } from '@/lib/utils';

const ICON: Record<AlertItem['type'], React.ElementType> = {
  missed_dose: Pill,
  geofence_exit: MapPin,
  mood_decline: Smile,
  sos: Siren,
};
const SEVERITY: Record<AlertItem['severity'], string> = {
  critical: 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40',
  warning: 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40',
  info: '',
};

export function AlertsPanel({ patientId, canAct }: { patientId: string; canAct: boolean }) {
  const [tab, setTab] = useState<'open' | 'all'>('open');
  const q = useAlerts(patientId, tab);
  const update = useUpdateAlert(patientId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell /> Alerts
          </CardTitle>
          <CardDescription>Raised automatically by the monitoring jobs, or by the help button.</CardDescription>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'open' | 'all')}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="all">History</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <QueryState query={q}>
          {(list) =>
            list.length === 0 ? (
              <EmptyState icon={BellOff} title={tab === 'open' ? 'All clear — no open alerts' : 'No alerts yet'} />
            ) : (
              <ul className="space-y-2">
                {list.map((a) => {
                  const Icon = ICON[a.type] ?? AlertTriangle;
                  return (
                    <li
                      key={a.id}
                      className={cn(
                        'flex flex-wrap items-center gap-3 rounded-xl border p-3',
                        a.status === 'open' && SEVERITY[a.severity],
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ago(a.createdAt)}
                          {a.acknowledgedAt && ` · acknowledged ${ago(a.acknowledgedAt)}`}
                        </p>
                      </div>
                      <Badge variant={a.status === 'open' ? 'destructive' : 'secondary'} className="capitalize">
                        {a.status}
                      </Badge>
                      {canAct && a.status !== 'resolved' && (
                        <div className="flex gap-1">
                          {a.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => update.mutate({ alertId: a.id, status: 'acknowledged' })}
                            >
                              <Check className="mr-1 h-3 w-3" /> Ack
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => update.mutate({ alertId: a.id, status: 'resolved' })}
                          >
                            <CheckCheck className="mr-1 h-3 w-3" /> Resolve
                          </Button>
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
