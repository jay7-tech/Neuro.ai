'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, errorMessage } from '@/lib/api-client';
import { LoginInput, RegisterInput } from '@/lib/contracts';
import type { SessionUser } from '@/server/auth/session';

const HOME: Record<SessionUser['role'], string> = { patient: '/patient', caregiver: '/caregiver', clinician: '/doctor' };

function useAfterAuth() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  return (user: SessionUser) => {
    // Only follow same-site relative paths (prevents open redirects via ?next=).
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
    router.replace(safeNext ?? HOME[user.role]);
    router.refresh();
  };
}

const DEMO = [
  ['Patient', 'john@demo.neuro.ai'],
  ['Caregiver', 'jane@demo.neuro.ai'],
  ['Clinician', 'emily@demo.neuro.ai'],
] as const;

export function LoginForm() {
  const done = useAfterAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(LoginInput), defaultValues: { email: '', password: '' } });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const { user } = await api.post<{ user: SessionUser }>('/auth/login', values);
      done(user);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <Card className="w-full max-w-md rounded-2xl shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your care space.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" autoComplete="email" className="h-12 text-base" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" autoComplete="current-password" className="h-12 text-base" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
            </Button>
          </form>
        </Form>
        <div className="mt-6 rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="mb-2 font-medium">Demo accounts (password <code>neuro-demo-2026</code>)</p>
          <div className="flex flex-wrap gap-2">
            {DEMO.map(([label, email]) => (
              <Button key={email} type="button" variant="outline" size="sm" onClick={() => form.reset({ email, password: 'neuro-demo-2026' })}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        New here?&nbsp;<Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link>
      </CardFooter>
    </Card>
  );
}

const ROLES = [
  { value: 'caregiver', label: 'Caregiver', hint: 'I look after someone with memory loss' },
  { value: 'patient', label: 'Patient', hint: 'I want support with my own day' },
  { value: 'clinician', label: 'Clinician', hint: 'I treat patients and join their care teams' },
] as const;

export function RegisterForm() {
  const done = useAfterAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterInput>({ resolver: zodResolver(RegisterInput), defaultValues: { name: '', email: '', password: '', role: 'caregiver' } });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const { user } = await api.post<{ user: SessionUser }>('/auth/register', values);
      done(user);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <Card className="w-full max-w-lg rounded-2xl shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Create your account</CardTitle>
        <CardDescription>Everyone on a care team has their own login and permissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>I am a…</FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2">
                    {ROLES.map((r) => (
                      <label key={r.value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value={r.value} />
                        <span>
                          <span className="font-medium">{r.label}</span>
                          <span className="block text-sm text-muted-foreground">{r.hint}</span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl><Input autoComplete="name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                <FormDescription>At least 10 characters, with a number.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;<Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </CardFooter>
    </Card>
  );
}
