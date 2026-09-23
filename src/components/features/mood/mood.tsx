'use client';

import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Smile, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMood, useRecordMood } from '@/hooks/api';
import { QueryState } from '@/components/common/query-state';
import { cn } from '@/lib/utils';

const FACES = [
  { score: 1, emoji: '😢', label: 'Very sad' },
  { score: 2, emoji: '🙁', label: 'Sad' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😄', label: 'Great' },
];

export function MoodCheckIn({ patientId }: { patientId: string }) {
  const record = useRecordMood(patientId);
  const { toast } = useToast();
  const [chosen, setChosen] = useState<number | null>(null);

  const pick = (score: number) => {
    setChosen(score);
    record.mutate(
      { score },
      {
        onSuccess: () =>
          toast({ title: 'Thank you for sharing', description: 'Your care team can see how you are feeling.' }),
      },
    );
  };

  return (
    <Card className="rounded-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Smile /> How are you feeling?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Mood">
          {FACES.map((f) => (
            <button
              key={f.score}
              type="button"
              role="radio"
              aria-checked={chosen === f.score}
              aria-label={f.label}
              onClick={() => pick(f.score)}
              disabled={record.isPending}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-4xl transition hover:bg-muted',
                chosen === f.score ? 'border-primary bg-primary/10' : 'border-transparent',
              )}
            >
              {f.emoji}
              <span className="text-xs text-muted-foreground">{f.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const TrendIcon = { improving: TrendingUp, declining: TrendingDown, stable: Minus } as const;

export function MoodChart({ patientId, days = 30 }: { patientId: string; days?: number }) {
  const q = useMood(patientId, days);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smile /> Mood
        </CardTitle>
        <CardDescription>
          Daily average of self-reported mood (1–5) over {days} days, compared against the patient&apos;s own baseline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <QueryState query={q}>
          {(m) => {
            const Icon = TrendIcon[m.trend.direction];
            return (
              <>
                {m.decline.status === 'decline' && (
                  <Alert variant="destructive">
                    <TrendingDown className="h-4 w-4" />
                    <AlertTitle>Noticeable drop in mood</AlertTitle>
                    <AlertDescription>
                      Last 3 days average {m.decline.recentMean} vs. {m.decline.baselineMean} over the previous two
                      weeks (z = {m.decline.zScore}).
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-6 text-sm">
                  <span className="flex items-center gap-1">
                    <Icon className="h-4 w-4" /> Trend: <b className="capitalize">{m.trend.direction}</b>
                  </span>
                  <span>
                    {m.trend.slopePerDay > 0 ? '+' : ''}
                    {m.trend.slopePerDay} / day
                  </span>
                </div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={m.daily} margin={{ left: -20, right: 8 }}>
                      <defs>
                        <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                      <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} fontSize={12} tickLine={false} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                        }}
                      />
                      {m.decline.status !== 'insufficient_data' && (
                        <ReferenceLine
                          y={m.decline.baselineMean}
                          strokeDasharray="4 4"
                          className="stroke-muted-foreground"
                          label={{ value: 'baseline', fontSize: 11, position: 'insideTopRight' }}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="average"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#moodFill)"
                        name="Mood"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            );
          }}
        </QueryState>
      </CardContent>
    </Card>
  );
}
