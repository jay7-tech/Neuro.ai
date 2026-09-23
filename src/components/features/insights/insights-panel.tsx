'use client';

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Brain, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInsights } from '@/hooks/api';
import { EmptyState, QueryState } from '@/components/common/query-state';
import { ago, pct } from '@/components/common/format';

const GAME_LABEL: Record<string, string> = {
  memory_match: 'Memory match',
  color_match: 'Colour match',
  sequence_memory: 'Sequence memory',
  word_scramble: 'Word scramble',
};

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** 30-day clinical overview with rule-based risk flags computed on the server. */
export function InsightsPanel({ patientId }: { patientId: string }) {
  const q = useInsights(patientId);
  return (
    <QueryState query={q}>
      {(s) => (
        <div className="space-y-6">
          {s.flags.length ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Needs attention</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {s.flags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>No risk flags in the last 30 days</AlertTitle>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Adherence (30d)" value={pct(s.adherence.rate)} sub={`${pct(s.adherence.onTimeRate)} on time`} />
            <Kpi label="Mood trend" value={s.mood.trend.direction} sub={`${s.mood.trend.slopePerDay} pts/day`} />
            <Kpi label="Game sessions (30d)" value={String(s.games.perGame.reduce((a, g) => a + g.sessions, 0))} />
            <Kpi label="Open alerts" value={String(s.openAlerts)} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain /> Cognitive games
              </CardTitle>
              <CardDescription>
                Weekly mean performance (0–1): accuracy, speed against target, and error rate.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              {s.games.weekly.length === 0 ? (
                <EmptyState title="No games played yet" />
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={s.games.weekly} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                      <XAxis dataKey="week" tickFormatter={(w: string) => w.slice(5)} fontSize={11} />
                      <YAxis domain={[0, 1]} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgPerformance"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot
                        name="Performance"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Avg</TableHead>
                    <TableHead>Last</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.games.perGame.map((g) => (
                    <TableRow key={g.game}>
                      <TableCell>{GAME_LABEL[g.game] ?? g.game}</TableCell>
                      <TableCell>{g.sessions}</TableCell>
                      <TableCell>{g.avgPerformance.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ago(g.lastPlayed)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </QueryState>
  );
}
