import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Bell, Brain, CalendarCheck, HeartHandshake, MapPin, MessagesSquare, Pill, ShieldCheck, Stethoscope } from 'lucide-react';
import { getCurrentUser, homePathFor } from '@/server/auth/current';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';

const ROLES = [
  {
    icon: HeartHandshake,
    title: 'For patients',
    points: ['Large, calm daily plan and medicine reminders', 'A companion that answers from their own facts', 'Memory lane, family tree, music and brain games', 'One-tap help button'],
  },
  {
    icon: Bell,
    title: 'For caregivers',
    points: ['Live alerts for missed doses, wandering and mood dips', 'Medication schedules with adherence tracking', 'Safe-zone geofence with GPS-noise filtering', 'Invite family and doctors with one-time codes'],
  },
  {
    icon: Stethoscope,
    title: 'For clinicians',
    points: ['30-day summary with automatic risk flags', 'Adherence, mood trend and cognitive-game performance', 'Timestamped clinical notes shared with the team', 'Full audit trail of every change'],
  },
];

const FEATURES = [
  { icon: Pill, label: 'Adherence engine', text: 'Timezone-aware schedules, grace windows, streaks and late-dose detection.' },
  { icon: MapPin, label: 'Geofencing', text: 'Haversine distance with accuracy-aware, debounced breach detection.' },
  { icon: Brain, label: 'Adaptive games', text: 'Deterministic difficulty policy with asymmetric promote/demote thresholds.' },
  { icon: MessagesSquare, label: 'Realtime', text: 'Postgres LISTEN/NOTIFY fanned out over Server-Sent Events.' },
  { icon: CalendarCheck, label: 'Background jobs', text: 'Missed-dose and mood-decline scans with advisory-lock leader election.' },
  { icon: ShieldCheck, label: 'Security', text: 'Hashed session tokens, relationship-based access control, CSRF and rate limits.' },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  return (
    <div className="min-h-screen">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link href="/api-docs">API</Link></Button>
          <Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button>
          <Button asChild><Link href="/register">Get started</Link></Button>
        </nav>
      </header>

      <main>
        <section className="container py-16 text-center md:py-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">One care circle for people living with dementia</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Neuro-AI connects the patient, their family caregivers and their doctor around the same live picture of medication, routine, mood and safety.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg"><Link href="/register">Create a care team</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/login">Try the demo</Link></Button>
          </div>
        </section>

        <section className="container grid gap-6 pb-16 md:grid-cols-3">
          {ROLES.map(({ icon: Icon, title, points }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <Icon className="h-8 w-8 text-primary" />
              <h2 className="mt-4 text-xl font-semibold">{title}</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {points.map((p) => <li key={p}>• {p}</li>)}
              </ul>
            </div>
          ))}
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="container">
            <h2 className="text-center text-2xl font-bold">Under the hood</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, label, text }) => (
                <div key={label} className="flex gap-3 rounded-xl bg-card p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="container py-8 text-center text-sm text-muted-foreground">
        Neuro-AI is a portfolio project and not a certified medical device.
      </footer>
    </div>
  );
}
