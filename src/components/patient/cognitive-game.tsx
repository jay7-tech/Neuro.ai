'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adjustGameDifficulty } from '@/ai/flows/cognitive-game-difficulty-adjustment';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Anchor, Apple, Bike, Bird, Sailboat, Book, Car, Cloud, Cat, Dog, Fish, Flag, Star as StarIcon, Smile, Heart, Bell } from 'lucide-react';

const ALL_ICONS = [
    { name: 'Anchor', component: Anchor }, { name: 'Apple', component: Apple },
    { name: 'Bike', component: Bike }, { name: 'Bird', component: Bird },
    { name: 'Sailboat', component: Sailboat }, { name: 'Book', component: Book },
    { name: 'Car', component: Car }, { name: 'Cloud', component: Cloud },
    { name: 'Cat', component: Cat }, { name: 'Dog', component: Dog },
    { name: 'Fish', component: Fish }, { name: 'Flag', component: Flag },
    { name: 'Star', component: StarIcon }, { name: 'Smile', component: Smile },
    { name: 'Heart', component: Heart }, { name: 'Bell', component: Bell },
];

type CardInfo = {
  id: number;
  icon: { name: string; component: React.ElementType };
  isFlipped: boolean;
  isMatched: boolean;
};

export function CognitiveGame() {
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('easy');
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ newDifficultyLevel: string, assistanceMessage: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const numPairs = useMemo(() => {
    switch (difficulty) {
      case 'easy': return 4;
      case 'medium': return 6;
      case 'hard': return 8;
    }
  }, [difficulty]);

  const startNewGame = useMemo(() => () => {
    const selectedIcons = [...ALL_ICONS].sort(() => 0.5 - Math.random()).slice(0, numPairs);
    const gameCards = [...selectedIcons, ...selectedIcons]
      .sort(() => 0.5 - Math.random())
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(gameCards);
    setFlippedIndices([]);
    setMoves(0);
    setStartTime(Date.now());
    setGameOver(false);
    setAiFeedback(null);
  }, [numPairs]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleCardClick = (index: number) => {
    if (loading || gameOver || cards[index].isFlipped || flippedIndices.length === 2) {
      return;
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    setFlippedIndices(prev => [...prev, index]);
  };

  useEffect(() => {
    if (flippedIndices.length === 2) {
      setMoves(m => m + 1);
      const [firstIndex, secondIndex] = flippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.icon.name === secondCard.icon.name) {
        setTimeout(() => {
            const newCards = cards.map(c => 
                (c.icon.name === firstCard.icon.name) ? { ...c, isMatched: true, isFlipped: true } : c
            );
            setCards(newCards);
            setFlippedIndices([]);
            if (newCards.every(c => c.isMatched)) {
                setGameOver(true);
            }
        }, 500)
      } else {
        setTimeout(() => {
          const newCards = [...cards];
          newCards[firstIndex].isFlipped = false;
          newCards[secondIndex].isFlipped = false;
          setCards(newCards);
          setFlippedIndices([]);
        }, 1200);
      }
    }
  }, [flippedIndices, cards]);
  
  useEffect(() => {
    async function getDifficulty() {
        if (gameOver) {
            setLoading(true);
            const timeTaken = startTime ? (Date.now() - startTime) / 1000 : 0;
            const score = Math.max(0, 100 - moves - Math.floor(timeTaken));

            try {
                const result = await adjustGameDifficulty({
                    gameType: 'Memory Match',
                    playerScore: score,
                    difficultyLevel: difficulty,
                    recentMoves: [`${moves} moves`, `${Math.round(timeTaken)}s`],
                    timeTaken,
                });
                setAiFeedback(result);
            } catch (error) {
                console.error("AI difficulty adjustment failed", error);
                setAiFeedback({ newDifficultyLevel: difficulty, assistanceMessage: "Couldn't get feedback, but you did great!"});
            } finally {
                setLoading(false);
            }
        }
    }
    getDifficulty();
  }, [gameOver, difficulty, moves, startTime]);

  const handlePlayAgain = () => {
    if (aiFeedback) {
        setDifficulty(aiFeedback.newDifficultyLevel as 'easy'|'medium'|'hard');
    } else {
        startNewGame();
    }
  };

  const gridClasses = {
    easy: 'grid-cols-4 grid-rows-2',
    medium: 'grid-cols-4 grid-rows-3',
    hard: 'grid-cols-4 grid-rows-4'
  };

  return (
    <div className="flex flex-col items-center gap-6">
        <div className="text-center">
            <h1 className="text-4xl font-bold font-headline">Cognitive Game: Memory Match</h1>
            <p className="text-muted-foreground text-lg">Find all the matching pairs!</p>
        </div>
        <div className="flex gap-8 items-center font-bold text-xl">
            <span>Moves: {moves}</span>
            <span className="capitalize">Difficulty: {difficulty}</span>
        </div>
        <div className={`grid ${gridClasses[difficulty]} gap-4 w-full max-w-xl [perspective:1000px]`}>
            {cards.map((card, index) => {
                const IconComponent = card.icon.component;
                return (
                    <div key={card.id} onClick={() => handleCardClick(index)} className="relative aspect-square cursor-pointer">
                        <div className={cn("absolute inset-0 w-full h-full transition-transform duration-700 [transform-style:preserve-3d]", card.isFlipped ? '[transform:rotateY(180deg)]' : '')}>
                            <Card className="absolute inset-0 w-full h-full flex items-center justify-center bg-primary/20 [backface-visibility:hidden]">
                                <Brain className="h-1/2 w-1/2 text-primary" />
                            </Card>
                            <Card className={cn("absolute inset-0 w-full h-full flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden]", card.isMatched ? "bg-primary/30 border-2 border-primary" : "bg-accent")}>
                                <IconComponent className="h-1/2 w-1/2" />
                            </Card>
                        </div>
                    </div>
                );
            })}
        </div>

        {gameOver && (
            <Alert className="max-w-md mt-6">
                 <Star className="h-4 w-4"/>
                <AlertTitle className="text-xl font-bold">Great Job!</AlertTitle>
                <AlertDescription className="text-base">
                    {loading ? <Skeleton className="h-12 w-full" /> : (
                        <div className="space-y-4 mt-2">
                            <p>{aiFeedback?.assistanceMessage}</p>
                            <p>Next round will be <span className="font-bold capitalize">{aiFeedback?.newDifficultyLevel}</span>.</p>
                            <Button onClick={handlePlayAgain} className="mt-4 w-full" disabled={loading}>Play Again</Button>
                        </div>
                    )}
                </AlertDescription>
            </Alert>
        )}
    </div>
  );
}
