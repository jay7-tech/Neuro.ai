import Link from 'next/link';
import { Brain, Hash, Palette, Shuffle } from 'lucide-react';
import { BackLink } from '@/components/app/patient-shell';

export const metadata = { title: 'Brain games' };

const GAMES = [
  { href: 'memory-match', title: 'Memory match', text: 'Find the matching pairs of pictures.', icon: Brain },
  { href: 'color-match', title: 'Colour match', text: 'Tap the colour the word names.', icon: Palette },
  { href: 'sequence-memory', title: 'Number memory', text: 'Remember a short sequence of numbers.', icon: Hash },
  { href: 'word-scramble', title: 'Word puzzle', text: 'Unscramble everyday words.', icon: Shuffle },
];

export default function GamesPage() {
  return (
    <div>
      <BackLink />
      <h1 className="text-4xl font-bold">Brain games</h1>
      <p className="mt-2 text-xl text-muted-foreground">The level adjusts to you automatically.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {GAMES.map(({ href, title, text, icon: Icon }) => (
          <Link key={href} href={`/patient/games/${href}`} className="flex items-center gap-5 rounded-2xl border bg-card p-6 shadow-sm transition hover:border-primary hover:shadow-md">
            <Icon className="h-12 w-12 shrink-0 text-primary" />
            <span><span className="block text-2xl font-bold">{title}</span><span className="text-lg text-muted-foreground">{text}</span></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
