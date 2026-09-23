'use client';

import Link from 'next/link';
import { Album, Brain, Camera, HeartPulse, Music, UserRound, Users } from 'lucide-react';
import { usePatientContext } from '@/components/app/patient-shell';
import { DayPlan } from '@/components/features/plan/day-plan';
import { TodayDoses } from '@/components/features/doses/today-doses';
import { MoodCheckIn } from '@/components/features/mood/mood';
import { Companion } from '@/components/features/ai/companion';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import { LocationSharing } from '@/components/features/location/location';
import { useClientValue } from '@/hooks/use-mounted';

const TOOLS = [
  { href: '/patient/games', label: 'Brain games', icon: Brain },
  { href: '/patient/memory-lane', label: 'Memory lane', icon: Album },
  { href: '/patient/family-tree', label: 'My family', icon: Users },
  { href: '/patient/music', label: 'Music', icon: Music },
  { href: '/patient/med-identifier', label: 'Check a medicine', icon: Camera },
  { href: '/patient/exercise', label: 'Gentle exercise', icon: HeartPulse },
  { href: '/patient/profile', label: 'Me & my team', icon: UserRound },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function PatientHome() {
  const { patientId, name, meId, requestHelp } = usePatientContext();
  // Local time only exists in the browser; rendering it on the server would mismatch.
  const now = useClientValue(() => ({
    greeting: greeting(),
    today: new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
  }));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold md:text-5xl">{now?.greeting ?? 'Hello'}, {name.split(' ')[0]}</h1>
        <p className="mt-2 min-h-8 text-2xl text-muted-foreground">{now && `Today is ${now.today}.`}</p>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <TodayDoses patientId={patientId} variant="patient" />
          <DayPlan patientId={patientId} variant="patient" />
          <Companion patientId={patientId} onSos={requestHelp} />
        </div>
        <div className="space-y-8">
          <MoodCheckIn patientId={patientId} />
          <nav className="grid grid-cols-2 gap-3" aria-label="Activities">
            {TOOLS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-5 text-center text-lg font-semibold shadow-sm transition hover:border-primary hover:shadow-md">
                <Icon className="h-9 w-9 text-primary" /> {label}
              </Link>
            ))}
          </nav>
          <ChatPanel patientId={patientId} meId={meId} large title="Messages" />
          <LocationSharing patientId={patientId} />
        </div>
      </div>
    </div>
  );
}
