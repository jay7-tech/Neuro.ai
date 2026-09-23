'use client';

import { useState } from 'react';
import { CalendarCheck, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCompleteTask, useDeleteTask, usePlan, useSaveTask, useTasks } from '@/hooks/api';
import { EmptyState, QueryState } from '@/components/common/query-state';
import { WEEKDAYS } from '@/components/common/format';
import { TaskInput } from '@/lib/contracts';
import { errorMessage } from '@/lib/api-client';
import type { Task } from '@/lib/api-types';
import { cn } from '@/lib/utils';

const CATEGORIES = ['routine', 'meal', 'activity', 'appointment', 'social'] as const;

/** Today's checklist. Used by the patient (large) and staff (compact). */
export function DayPlan({ patientId, variant = 'staff' }: { patientId: string; variant?: 'patient' | 'staff' }) {
  const plan = usePlan(patientId);
  const complete = useCompleteTask(patientId);
  const big = variant === 'patient';

  return (
    <Card className={cn(big && 'rounded-2xl shadow-xl')}>
      <CardHeader>
        <CardTitle className={cn('flex items-center gap-2', big && 'text-2xl')}>
          <CalendarCheck /> {big ? 'My day' : "Today's plan"}
        </CardTitle>
        <QueryState query={plan} skeleton={null}>
          {(d) => {
            const done = d.items.filter((i) => i.completed).length;
            return (
              <CardDescription className="space-y-2">
                <span>
                  {done} of {d.items.length} done
                </span>
                <Progress value={d.items.length ? (done / d.items.length) * 100 : 0} aria-label="Plan progress" />
              </CardDescription>
            );
          }}
        </QueryState>
      </CardHeader>
      <CardContent>
        <QueryState query={plan}>
          {(d) =>
            d.items.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="Nothing planned today" />
            ) : (
              <ul className="space-y-2">
                {d.items.map((i) => (
                  <li key={i.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                        i.completed && 'bg-muted/60',
                        big && 'p-4 text-lg',
                      )}
                    >
                      <Checkbox
                        checked={i.completed}
                        onCheckedChange={(c) => complete.mutate({ taskId: i.id, completed: c === true })}
                        className={cn(big && 'h-6 w-6')}
                        aria-label={`Mark ${i.title} as done`}
                      />
                      <span className="w-14 font-mono text-muted-foreground">{i.time}</span>
                      <span className={cn('flex-1', i.completed && 'text-muted-foreground line-through')}>
                        {i.title}
                      </span>
                      {!big && (
                        <Badge variant="outline" className="capitalize">
                          {i.category}
                        </Badge>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryState>
      </CardContent>
    </Card>
  );
}

function TaskForm({ patientId, task, onDone }: { patientId: string; task?: Task; onDone: () => void }) {
  const save = useSaveTask(patientId);
  const { toast } = useToast();
  const [title, setTitle] = useState(task?.title ?? '');
  const [time, setTime] = useState(task?.time ?? '09:00');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(task?.category ?? 'routine');
  const [days, setDays] = useState<number[]>(task?.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = TaskInput.safeParse({ title, time, category, daysOfWeek: days });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    try {
      await save.mutateAsync({ taskId: task?.id, body: parsed.data });
      toast({ title: task ? 'Task updated' : 'Task added' });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="t-title">Activity</Label>
        <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="t-time">Time</Label>
          <Input id="t-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {WEEKDAYS.map((d, i) => (
          <Button
            key={d}
            type="button"
            size="sm"
            variant={days.includes(i) ? 'default' : 'outline'}
            aria-pressed={days.includes(i)}
            onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i])}
          >
            {d}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
      </Button>
    </form>
  );
}

export function TaskManager({ patientId }: { patientId: string }) {
  const tasks = useTasks(patientId);
  const del = useDeleteTask(patientId);
  const [editing, setEditing] = useState<Task | 'new' | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Routine</CardTitle>
          <CardDescription>A consistent routine reduces anxiety. Tasks repeat on the selected days.</CardDescription>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        <QueryState query={tasks}>
          {(list) =>
            list.length === 0 ? (
              <EmptyState title="No routine yet" />
            ) : (
              <ul className="divide-y">
                {list.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2">
                    <span className="w-14 font-mono text-sm">{t.time}</span>
                    <span className="flex-1">{t.title}</span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {t.daysOfWeek.length === 7 ? 'Daily' : t.daysOfWeek.map((d) => WEEKDAYS[d]).join(' ')}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setEditing(t)} aria-label={`Edit ${t.title}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => del.mutate(t.id)}
                      aria-label={`Delete ${t.title}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryState>
      </CardContent>
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Add to routine' : 'Edit task'}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <TaskForm
              patientId={patientId}
              task={editing === 'new' ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
