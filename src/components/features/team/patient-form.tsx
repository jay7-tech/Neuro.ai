'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreatePatient, useUpdatePatient } from '@/hooks/api';
import { CreatePatientInput } from '@/lib/contracts';
import { errorMessage } from '@/lib/api-client';

type Values = z.input<typeof CreatePatientInput>;

/** Create (caregiver onboarding) or edit a patient profile. */
export function PatientForm({ patientId, initial, onSaved }: { patientId?: string; initial?: Partial<Values>; onSaved?: () => void }) {
  const { toast } = useToast();
  const create = useCreatePatient();
  const update = useUpdatePatient(patientId ?? '');
  const form = useForm<Values>({
    // The schema's input and output types differ (defaults/transforms); RHF only tracks one.
    resolver: zodResolver(CreatePatientInput) as unknown as Resolver<Values>,
    defaultValues: { displayName: '', address: '', medicalSummary: '', timezone: 'Asia/Kolkata', ...initial },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const body = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === '' ? null : v]));
      if (patientId) await update.mutateAsync(body);
      else await create.mutateAsync(body);
      toast({ title: patientId ? 'Profile updated' : 'Patient added' });
      onSaved?.();
    } catch (e) {
      toast({ title: 'Could not save', description: errorMessage(e), variant: 'destructive' });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="displayName" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>Full name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
          <FormItem><FormLabel>Date of birth</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="timezone" render={({ field }) => (
          <FormItem><FormLabel>Timezone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="medicalSummary" render={({ field }) => (
          <FormItem className="sm:col-span-2"><FormLabel>Medical summary</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {patientId ? 'Save changes' : 'Add patient'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
