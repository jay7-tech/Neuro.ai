'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Flame, Pill } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdherence } from '@/hooks/api';
import { QueryState } from '@/components/common/query-state';
import { pct } from '@/components/common/format';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AdherenceCard({ patientId, days = 14 }: { patientId: string; days?: number }) {
  const q = useAdherence(patientId, days);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Pill /> Medication adherence</CardTitle>
        <CardDescription>Last {days} days. Late = recorded more than 60 minutes after the scheduled time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <QueryState query={q}>
          {(a) => (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Adherence" value={pct(a.adherenceRate)} />
                <Stat label="On time" value={pct(a.onTimeRate)} />
                <Stat label="Missed" value={String(a.counts.missed)} hint={`${a.counts.skipped} skipped`} />
                <Stat label="Streak" value={`${a.streakDays}d`} hint="fully adherent days" />
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={a.daily.map((d) => ({ ...d, pct: d.rate === null ? null : Math.round(d.rate * 100) }))} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(8)} fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} fontSize={11} tickLine={false} unit="%" />
                    <Tooltip formatter={(v) => [`${v}%`, 'Taken']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1 text-sm">
                {a.byMedication.map((m) => (
                  <li key={m.medicationId} className="flex justify-between"><span>{m.name}</span><span className="font-mono">{pct(m.rate)} <span className="text-muted-foreground">({m.taken}/{m.settled})</span></span></li>
                ))}
              </ul>
              {a.streakDays >= 3 && <p className="flex items-center gap-1 text-sm text-emerald-600"><Flame className="h-4 w-4" /> {a.streakDays}-day streak</p>}
            </>
          )}
        </QueryState>
      </CardContent>
    </Card>
  );
}
