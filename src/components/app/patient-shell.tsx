'use client';

import { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { Loader2, Siren } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSos } from '@/hooks/api';
import { usePatientEvents } from '@/hooks/use-patient-events';
import { errorMessage } from '@/lib/api-client';
import type { SessionUser } from '@/server/auth/session';
import { LogoMark } from './logo';
import { LiveDot, UserMenu } from './user-menu';

type Ctx = { patientId: string; name: string; meId: string; requestHelp: () => void };
const PatientContext = createContext<Ctx | null>(null);

export function usePatientContext(): Ctx {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatientContext must be used inside PatientShell');
  return ctx;
}

/**
 * Deliberately simple chrome for patients: large type, one always-visible help
 * button, nothing that requires remembering where things are.
 */
export function PatientShell({
  user,
  patientId,
  children,
}: {
  user: SessionUser;
  patientId: string;
  children: React.ReactNode;
}) {
  const live = usePatientEvents(patientId);
  const sos = useSos(patientId);
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);

  const sendSos = () =>
    sos.mutate(undefined, {
      onSuccess: () => toast({ title: 'Help is on the way', description: 'Your care team has been alerted.' }),
      onError: (e) => toast({ title: 'Could not send', description: errorMessage(e), variant: 'destructive' }),
    });

  return (
    <PatientContext.Provider
      value={{ patientId, name: user.name, meId: user.id, requestHelp: () => setConfirming(true) }}
    >
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
          <div className="container flex h-20 items-center gap-4">
            <Link href="/patient" className="flex items-center gap-2 text-xl font-bold">
              <LogoMark className="h-8 w-8" /> Neuro-AI
            </Link>
            <LiveDot state={live} />
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="lg"
                variant="destructive"
                className="h-14 px-6 text-lg"
                onClick={() => setConfirming(true)}
                disabled={sos.isPending}
              >
                {sos.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Siren className="mr-2 h-6 w-6" />}{' '}
                Help
              </Button>
              <UserMenu name={user.name} email={user.email} roleLabel="Patient" />
            </div>
          </div>
        </header>
        <main className="container py-6 md:py-10">{children}</main>
      </div>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Call your care team for help?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Everyone on your care team will get an urgent alert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-lg">No, I&apos;m okay</AlertDialogCancel>
            <AlertDialogAction className="h-12 bg-destructive text-lg hover:bg-destructive/90" onClick={sendSos}>
              Yes, get help
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PatientContext.Provider>
  );
}

export function BackLink() {
  return (
    <Button asChild variant="outline" size="lg" className="mb-6">
      <Link href="/patient">← Back to my day</Link>
    </Button>
  );
}
