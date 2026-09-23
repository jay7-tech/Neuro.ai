'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useMe } from '@/hooks/api';
import { usePatientEvents } from '@/hooks/use-patient-events';
import type { PatientListItem } from '@/lib/api-types';
import type { SessionUser } from '@/server/auth/session';
import { cn } from '@/lib/utils';
import { LogoMark } from './logo';
import { LiveDot, UserMenu } from './user-menu';
import { Onboarding } from '@/components/features/team/onboarding';

export type NavItem = { href: string; label: string; icon: React.ElementType; needsPatient?: boolean };

type Ctx = { patient: PatientListItem; patients: PatientListItem[] };
const ActivePatientContext = createContext<Ctx | null>(null);

export function useActivePatient(): Ctx {
  const ctx = useContext(ActivePatientContext);
  if (!ctx) throw new Error('useActivePatient must be used inside StaffShell with a selected patient');
  return ctx;
}

const STORAGE_KEY = 'neuro-ai-active-patient';

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * App shell for caregivers and clinicians: sidebar navigation, patient switcher with
 * unread/alert badges, and a realtime connection for the selected patient.
 */
export function StaffShell({ user, nav, children }: { user: SessionUser; nav: NavItem[]; children: React.ReactNode }) {
  const me = useMe();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => setSelectedId(readStored()), []);

  const patients = useMemo(() => me.data?.patients ?? [], [me.data]);
  const patient = patients.find((p) => p.id === selectedId) ?? patients[0];

  const select = (id: string) => {
    setSelectedId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* private mode: selection just won't persist */
    }
  };

  const live = usePatientEvents(patient?.id, (e) => {
    if (e.type === 'alert.created') {
      toast({ title: 'New alert', description: `There is a new alert for ${patient?.displayName}.`, variant: 'destructive' });
    }
  });

  const roleLabel = user.role === 'clinician' ? 'Clinician' : 'Caregiver';

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 px-5 font-bold">
          <LogoMark /> Neuro-AI
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} disabled={item.needsPatient && !patient} />
          ))}
        </nav>
        <p className="px-5 py-4 text-xs text-muted-foreground">{roleLabel} workspace</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <div className="md:hidden">
            <LogoMark />
          </div>
          {me.isPending ? (
            <Skeleton className="h-10 w-56" />
          ) : patients.length > 0 && patient ? (
            <Select value={patient.id} onValueChange={select}>
              <SelectTrigger className="w-64" aria-label="Active patient">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      {p.displayName}
                      {p.openAlerts > 0 && <Badge variant="destructive">{p.openAlerts}</Badge>}
                      {p.unreadMessages > 0 && <Badge variant="secondary">{p.unreadMessages} new</Badge>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {patient && <LiveDot state={live} />}
          <div className="ml-auto">
            <UserMenu name={user.name} email={user.email} roleLabel={roleLabel} />
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b px-2 py-2 md:hidden">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} disabled={item.needsPatient && !patient} compact />
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8">
          {me.isPending ? (
            <Skeleton className="h-64 w-full" />
          ) : !patient ? (
            <Onboarding role={user.role} onDone={() => qc.invalidateQueries({ queryKey: ['me'] })} />
          ) : (
            <ActivePatientContext.Provider value={{ patient, patients }}>
              {/* Keyed so per-patient local state resets when switching patients. */}
              <div key={patient.id}>{children}</div>
            </ActivePatientContext.Provider>
          )}
        </main>
      </div>
    </div>
  );
}

function NavLink({ item, active, disabled, compact }: { item: NavItem; active: boolean; disabled?: boolean; compact?: boolean }) {
  const Icon = item.icon;
  const cls = cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    disabled && 'pointer-events-none opacity-40',
    compact && 'shrink-0 whitespace-nowrap',
  );
  return (
    <Link href={item.href} className={cls} aria-current={active ? 'page' : undefined}>
      <Icon className="h-4 w-4" /> {item.label}
    </Link>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
