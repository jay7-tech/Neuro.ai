'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Anchor,
  Apple,
  Bell,
  Bike,
  Bird,
  Book,
  Brain,
  Car,
  Cat,
  Cloud,
  Dog,
  Fish,
  Flag,
  Heart,
  Sailboat,
  Smile,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { shuffle, type GameProps, type Level } from './game-shell';

/* ------------------------------ Memory match ------------------------------ */

const ICONS = [Anchor, Apple, Bike, Bird, Sailboat, Book, Car, Cloud, Cat, Dog, Fish, Flag, Star, Smile, Heart, Bell];
const PAIRS: Record<Level, number> = { easy: 4, medium: 6, hard: 8 };

export function MemoryMatch({ level, onFinish }: GameProps) {
  const pairs = PAIRS[level];
  const deck = useMemo(() => {
    const icons = shuffle(ICONS.map((_, i) => i)).slice(0, pairs);
    return shuffle([...icons, ...icons]).map((icon, id) => ({ id, icon }));
  }, [pairs]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open;
    const same = deck[a].icon === deck[b].icon;
    const t = setTimeout(
      () => {
        if (same) setMatched((m) => new Set([...m, deck[a].icon]));
        else setMistakes((x) => x + 1);
        setOpen([]);
      },
      same ? 400 : 1100,
    );
    return () => clearTimeout(t);
  }, [open, deck]);

  useEffect(() => {
    if (matched.size === pairs) onFinish({ score: pairs, maxScore: pairs, mistakes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched.size]);

  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || matched.has(deck[i].icon)) return;
    setOpen([...open, i]);
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-lg font-semibold">
        Pairs found: {matched.size} / {pairs} · Misses: {mistakes}
      </p>
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-3">
        {deck.map((c, i) => {
          const shown = open.includes(i) || matched.has(c.icon);
          const Icon = ICONS[c.icon];
          return (
            <button
              key={c.id}
              onClick={() => flip(i)}
              aria-label={shown ? 'Revealed card' : 'Hidden card'}
              className={cn(
                'flex aspect-square items-center justify-center rounded-xl border-2 text-primary shadow transition-all',
                shown ? 'bg-card' : 'bg-primary/20 hover:bg-primary/30',
                matched.has(c.icon) && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
              )}
            >
              {shown ? <Icon className="h-1/2 w-1/2" /> : <Brain className="h-1/3 w-1/3 opacity-60" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- Colour match ------------------------------ */

const COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Brown', hex: '#92400e' },
];
const COLOR_ROUNDS = 8;
const OPTIONS: Record<Level, number> = { easy: 3, medium: 4, hard: 6 };

/** Medium/hard use a Stroop effect: the word is printed in a different colour. */
export function ColorMatch({ level, onFinish }: GameProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [missedThisRound, setMissedThisRound] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);

  const { target, options, ink } = useMemo(() => {
    const opts = shuffle(COLORS).slice(0, OPTIONS[level]);
    const t = opts[Math.floor(Math.random() * opts.length)];
    const others = COLORS.filter((c) => c.name !== t.name);
    return {
      target: t,
      options: opts,
      ink: level === 'easy' ? '#111827' : others[Math.floor(Math.random() * others.length)].hex,
    };
    // `round` is intentionally a dependency: each new round re-randomises the puzzle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, level]);

  const pick = (name: string) => {
    if (name === target.name) {
      const s = score + (missedThisRound ? 0 : 1);
      setScore(s);
      setMissedThisRound(false);
      setWrong(null);
      if (round + 1 === COLOR_ROUNDS) onFinish({ score: s, maxScore: COLOR_ROUNDS, mistakes });
      else setRound(round + 1);
    } else {
      setMistakes(mistakes + 1);
      setMissedThisRound(true);
      setWrong(name);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <p className="text-center text-lg font-semibold">
        Round {round + 1} / {COLOR_ROUNDS} · Score {score}
      </p>
      <Card className="p-8 text-center">
        <p className="text-5xl font-extrabold" style={{ color: ink }}>
          {target.name}
        </p>
        <p className="mt-2 text-muted-foreground">Tap the colour this word names</p>
      </Card>
      <div className={cn('grid gap-3', options.length > 4 ? 'grid-cols-3' : 'grid-cols-2')}>
        {options.map((c) => (
          <button
            key={c.name}
            onClick={() => pick(c.name)}
            aria-label={c.name}
            className={cn(
              'h-24 rounded-xl shadow transition-transform hover:scale-105',
              wrong === c.name && 'opacity-40 ring-4 ring-destructive',
            )}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Sequence memory ---------------------------- */

const SEQ_ROUNDS = 5;
const SEQ_LEN: Record<Level, number> = { easy: 3, medium: 5, hard: 7 };

export function SequenceMemory({ level, onFinish }: GameProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase] = useState<'show' | 'answer' | 'feedback'>('show');
  const [answer, setAnswer] = useState('');
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const seq = useMemo(
    () => Array.from({ length: SEQ_LEN[level] }, () => Math.floor(Math.random() * 10)),
    // `round` is intentionally a dependency: each new round draws a new sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round, level],
  );

  useEffect(() => {
    if (phase !== 'show') return;
    const t = setTimeout(() => setPhase('answer'), 800 * seq.length + 800);
    return () => clearTimeout(t);
  }, [phase, seq]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = answer.replace(/\D/g, '') === seq.join('');
    const s = score + (ok ? 1 : 0);
    const m = mistakes + (ok ? 0 : 1);
    setScore(s);
    setMistakes(m);
    setLastCorrect(ok);
    setPhase('feedback');
    setTimeout(() => {
      if (round + 1 === SEQ_ROUNDS) return onFinish({ score: s, maxScore: SEQ_ROUNDS, mistakes: m });
      setRound(round + 1);
      setAnswer('');
      setPhase('show');
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <p className="text-lg font-semibold">
        Round {round + 1} / {SEQ_ROUNDS} · Score {score}
      </p>
      <Card className="flex min-h-40 items-center justify-center gap-2 p-6">
        {phase === 'show' &&
          seq.map((n, i) => (
            <span
              key={i}
              className="flex h-16 w-12 items-center justify-center rounded-lg bg-primary text-3xl font-bold text-primary-foreground opacity-0 animate-in fade-in fill-mode-forwards"
              style={{ animationDelay: `${i * 800}ms`, animationDuration: '400ms' }}
            >
              {n}
            </span>
          ))}
        {phase === 'answer' && <p className="text-xl">What were the numbers?</p>}
        {phase === 'feedback' && (
          <p className={cn('text-2xl font-bold', lastCorrect ? 'text-emerald-600' : 'text-destructive')}>
            {lastCorrect ? 'Correct!' : `It was ${seq.join(' ')}`}
          </p>
        )}
      </Card>
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          inputMode="numeric"
          disabled={phase !== 'answer'}
          className="h-14 text-center text-2xl tracking-[0.4em]"
          aria-label="Sequence"
          autoFocus
        />
        <Button type="submit" size="lg" className="h-14" disabled={phase !== 'answer' || !answer}>
          Check
        </Button>
      </form>
    </div>
  );
}

/* ------------------------------ Word scramble ----------------------------- */

const WORDS: Record<Level, string[]> = {
  easy: ['TEA', 'CAT', 'SUN', 'BOOK', 'MILK', 'RAIN', 'BIRD', 'SHOE', 'TREE', 'FISH'],
  medium: ['APPLE', 'BEACH', 'CHAIR', 'MUSIC', 'OCEAN', 'LEMON', 'GARDEN', 'TEMPLE', 'MANGO', 'SMILE'],
  hard: [
    'KITCHEN',
    'BLANKET',
    'PICTURE',
    'HOLIDAY',
    'MORNING',
    'WEDDING',
    'BICYCLE',
    'COTTAGE',
    'FESTIVAL',
    'BREAKFAST',
  ],
};
const WORD_ROUNDS = 5;

function scramble(w: string): string {
  let s = w;
  for (let i = 0; i < 10 && s === w; i++) s = shuffle(w.split('')).join('');
  return s;
}

export function WordScramble({ level, onFinish }: GameProps) {
  const words = useMemo(() => shuffle(WORDS[level]).slice(0, WORD_ROUNDS), [level]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [guess, setGuess] = useState('');
  const [hint, setHint] = useState(false);
  const [wrong, setWrong] = useState(false);
  const word = words[i];
  const letters = useMemo(() => scramble(word), [word]);

  const advance = (s: number, m: number) => {
    if (i + 1 === WORD_ROUNDS) return onFinish({ score: s, maxScore: WORD_ROUNDS, mistakes: m });
    setI(i + 1);
    setGuess('');
    setHint(false);
    setWrong(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim().toUpperCase() === word) {
      const s = score + 1;
      setScore(s);
      advance(s, mistakes);
    } else {
      setMistakes(mistakes + 1);
      setWrong(true);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <p className="text-lg font-semibold">
        Word {i + 1} / {WORD_ROUNDS} · Score {score}
      </p>
      <Card className="p-8">
        <p className="text-4xl font-extrabold tracking-[0.3em] text-primary">{letters}</p>
        {hint && (
          <p className="mt-3 text-muted-foreground">
            Starts with <b>{word[0]}</b>, {word.length} letters
          </p>
        )}
        {wrong && <p className="mt-3 text-destructive">Not quite — try again!</p>}
      </Card>
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value);
            setWrong(false);
          }}
          className="h-14 text-center text-2xl uppercase"
          aria-label="Your answer"
          autoFocus
        />
        <Button type="submit" size="lg" className="h-14" disabled={!guess.trim()}>
          Check
        </Button>
      </form>
      <div className="flex justify-center gap-2">
        <Button variant="ghost" onClick={() => setHint(true)} disabled={hint}>
          Hint
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            const m = mistakes + 1;
            setMistakes(m);
            advance(score, m);
          }}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
