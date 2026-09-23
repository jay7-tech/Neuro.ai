'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNextLevel, useRecordGame } from '@/hooks/api';
import type { GameResult } from '@/lib/api-types';

export type Level = 'easy' | 'medium' | 'hard';
export type Game = 'memory_match' | 'color_match' | 'sequence_memory' | 'word_scramble';
export type Outcome = { score: number; maxScore: number; mistakes: number };
export type GameProps = { level: Level; onFinish: (o: Outcome) => void };

/**
 * Shared lifecycle for every game: fetch the recommended level, time the round,
 * submit the result, and show the server's recommendation for the next round.
 * Individual games only implement play and call onFinish.
 */
export function GameShell({
  patientId,
  game,
  title,
  instructions,
  children,
}: {
  patientId: string;
  game: Game;
  title: string;
  instructions: string;
  children: (props: GameProps) => React.ReactNode;
}) {
  const next = useNextLevel(patientId, game);
  const record = useRecordGame(patientId);
  const [override, setOverride] = useState<Level | null>(null);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const startedAt = useRef(Date.now());
  const level: Level | undefined = override ?? next.data?.level;

  const onFinish = useCallback(
    (o: Outcome) => {
      if (!level) return;
      record.mutate(
        { game, difficulty: level, ...o, durationMs: Math.max(1_000, Date.now() - startedAt.current) },
        { onSuccess: setResult },
      );
    },
    [game, level, record],
  );

  const playAgain = () => {
    if (result) setOverride(result.recommendation.level);
    setResult(null);
    setRound((r) => r + 1);
    startedAt.current = Date.now();
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between">
        <Button asChild variant="ghost">
          <Link href="/patient/games">
            <ArrowLeft className="mr-2 h-4 w-4" /> All games
          </Link>
        </Button>
        {level && (
          <Badge variant="secondary" className="text-sm capitalize">
            Level: {level}
          </Badge>
        )}
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{instructions}</p>
      </div>

      {!level ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : result ? (
        <Card className="w-full max-w-md rounded-2xl shadow-xl">
          <CardContent className="space-y-4 p-6 text-center">
            <Star className="mx-auto h-12 w-12 text-yellow-500" />
            <p className="text-2xl font-bold">Well played!</p>
            <p className="text-lg">
              You scored {result.session.score} of {result.session.maxScore}.
            </p>
            <p className="text-muted-foreground">{result.recommendation.message}</p>
            {result.recommendation.change !== 'hold' && (
              <p className="flex items-center justify-center gap-2 font-medium">
                {result.recommendation.change === 'promote' ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                Next round: <span className="capitalize">{result.recommendation.level}</span>
              </p>
            )}
            <Button size="lg" className="w-full" onClick={playAgain}>
              Play again
            </Button>
          </CardContent>
        </Card>
      ) : record.isPending ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <div key={`${round}-${level}`} className="w-full">
          {children({ level, onFinish })}
        </div>
      )}
    </div>
  );
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
