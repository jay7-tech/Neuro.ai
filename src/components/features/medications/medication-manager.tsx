'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, Pencil, Pill, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDiscontinueMedication, useMedications, useSaveMedication } from '@/hooks/api';
import { EmptyState, QueryState } from '@/components/common/query-state';
import { WEEKDAYS } from '@/components/common/format';
import { MedicationInput } from '@/lib/contracts';
import { errorMessage } from '@/lib/api-client';
import type { Medication } from '@/lib/api-types';
import { cn } from '@/lib/utils';

type FormValues = Omit<z.input<typeof MedicationInput>, 'times'> & { times: { value: string }[] };

const today = () => new Date().toISOString().slice(0, 10);

function MedicationForm({ patientId, med, onDone }: { patientId: string; med?: Medication; onDone: () => void }) {
  const save = useSaveMedication(patientId);
  const { toast } = useToast();
  const form = useForm<FormValues>({
    defaultValues: {
      name: med?.name ?? '',
      dosage: med?.dosage ?? '',
      instructions: med?.instructions ?? '',
      times: (med?.times ?? ['09:00']).map((value) => ({ value })),
      daysOfWeek: med?.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
      startDate: med?.startDate ?? today(),
      endDate: med?.endDate ?? '',
    },
    // Adapt the field-array shape to the shared contract, then validate with it.
    resolver: async (values, ctx, opts) => {
      const shaped = { ...values, times: values.times.map((t) => t.value), endDate: values.endDate || null };
      const r = await zodResolver(MedicationInput)(shaped as never, ctx, opts as never);
      return r as never;
    },
  });
  const times = useFieldArray({ control: form.control, name: 'times' });

  // The resolver has already reshaped and validated the values into the API contract.
  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await save.mutateAsync({ medId: med?.id, body: v as unknown as z.output<typeof MedicationInput> });
      toast({ title: med ? 'Medication updated' : 'Medication added' });
      onDone();
    } catch (e) {
      toast({ title: 'Could not save', description: errorMessage(e), variant: 'destructive' });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Medicine</FormLabel><FormControl><Input placeholder="Donepezil" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="dosage" render={({ field }) => (
            <FormItem><FormLabel>Dosage</FormLabel><FormControl><Input placeholder="5 mg tablet" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="instructions" render={({ field }) => (
          <FormItem><FormLabel>Instructions</FormLabel><FormControl><Input placeholder="With food" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <div>
          <FormLabel>Times</FormLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {times.fields.map((f, i) => (
              <div key={f.id} className="flex items-center gap-1">
                <Input type="time" className="w-32" {...form.register(`times.${i}.value`)} />
                {times.fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => times.remove(i)} aria-label="Remove time"><X className="h-4 w-4" /></Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => times.append({ value: '20:00' })}><Plus className="mr-1 h-3 w-3" /> Time</Button>
          </div>
          <p className="mt-1 text-sm text-destructive">{form.formState.errors.times?.message ?? form.formState.errors.times?.root?.message}</p>
        </div>
        <FormField control={form.control} name="daysOfWeek" render={({ field }) => (
          <FormItem>
            <FormLabel>Days</FormLabel>
            <div className="flex flex-wrap gap-1">
              {WEEKDAYS.map((d, i) => {
                const on = field.value?.includes(i);
                return (
                  <Button key={d} type="button" size="sm" variant={on ? 'default' : 'outline'} aria-pressed={on}
                    onClick={() => field.onChange(on ? field.value!.filter((x) => x !== i) : [...(field.value ?? []), i])}>
                    {d}
                  </Button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem><FormLabel>Start</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem><FormLabel>End (optional)</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
        </Button>
      </form>
    </Form>
  );
}

export function MedicationManager({ patientId, canEdit }: { patientId: string; canEdit: boolean }) {
  const meds = useMedications(patientId);
  const discontinue = useDiscontinueMedication(patientId);
  const { toast } = useToast();
  const [editing, setEditing] = useState<Medication | 'new' | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Pill /> Medications</CardTitle>
          <CardDescription>Recurring schedules. Discontinuing keeps the dose history for reports.</CardDescription>
        </div>
        {canEdit && <Button onClick={() => setEditing('new')}><Plus className="mr-2 h-4 w-4" /> Add</Button>}
      </CardHeader>
      <CardContent>
        <QueryState query={meds}>
          {(list) =>
            list.length === 0 ? (
              <EmptyState icon={Pill} title="No active medications" />
            ) : (
              <ul className="divide-y">
                {list.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{m.name} <span className="font-normal text-muted-foreground">· {m.dosage}</span></p>
                      <p className="text-sm text-muted-foreground">
                        {m.daysOfWeek.length === 7 ? 'Every day' : m.daysOfWeek.map((d) => WEEKDAYS[d]).join(', ')}
                        {m.instructions && ` · ${m.instructions}`}
                      </p>
                    </div>
                    <div className="flex gap-1">{m.times.map((t) => <Badge key={t} variant="outline" className="font-mono">{t}</Badge>)}</div>
                    {canEdit && (
                      <div className="flex">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(m)} aria-label={`Edit ${m.name}`}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label={`Discontinue ${m.name}`}
                          onClick={() => discontinue.mutate(m.id, { onSuccess: () => toast({ title: `${m.name} discontinued` }), onError: (e) => toast({ title: 'Failed', description: errorMessage(e), variant: 'destructive' }) })}>
                          <Trash2 className={cn('h-4 w-4 text-destructive')} />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )
          }
        </QueryState>
      </CardContent>
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Add medication' : 'Edit medication'}</DialogTitle>
            <DialogDescription>Times are in the patient&apos;s local timezone.</DialogDescription>
          </DialogHeader>
          {editing !== null && <MedicationForm patientId={patientId} med={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
