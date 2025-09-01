
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

const STARTING_LEVEL = 3;
const MAX_LEVEL = 10;
const SEQUENCE_DISPLAY_TIME = 600; // ms per number

export function SequenceMemoryGame() {
    const { toast } = useToast();
    const [sequence, setSequence] = useState<number[]>([]);
    const [userInput, setUserInput] = useState('');
    const [level, setLevel] = useState(STARTING_LEVEL);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'showing' | 'waiting' | 'feedback'>('waiting');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

    const generateSequence = useCallback(() => {
        const newSequence = Array.from({ length: level }, () => Math.floor(Math.random() * 10));
        setSequence(newSequence);
    }, [level]);

    const startNewRound = useCallback(() => {
        setUserInput('');
        setFeedback(null);
        generateSequence();
        setGameState('showing');
    }, [generateSequence]);

    useEffect(() => {
        if (gameState === 'showing') {
            const timer = setTimeout(() => {
                setGameState('waiting');
            }, sequence.length * SEQUENCE_DISPLAY_TIME + 500); // Add a little buffer
            return () => clearTimeout(timer);
        }
    }, [gameState, sequence]);
    
    useEffect(() => {
      startNewRound();
    }, [level, startNewRound])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || gameState !== 'waiting') return;

        setGameState('feedback');
        if (userInput.trim() === sequence.join('')) {
            setScore(prev => prev + level * 10);
            setFeedback('correct');
            toast({ title: "Correct!", description: `You remembered the sequence! Leveling up.`, duration: 2000 });
            setTimeout(() => {
                if(level < MAX_LEVEL) {
                    setLevel(prev => prev + 1);
                } else {
                    toast({ title: "You win!", description: "You've reached the maximum level!", duration: 3000 });
                    setLevel(STARTING_LEVEL);
                    setScore(0);
                }
            }, 1500);
        } else {
            setFeedback('incorrect');
            toast({ title: "Not Quite", description: "That's not the right sequence. Let's try again.", variant: "destructive", duration: 2000 });
            setTimeout(() => {
                setUserInput('');
                setFeedback(null);
                setGameState('waiting');
            }, 1500);
        }
    };
    
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="text-center">
                <h1 className="text-4xl font-bold font-headline">Cognitive Game: Sequence Memory</h1>
                <p className="text-muted-foreground text-lg">Remember the sequence of numbers as it appears.</p>
            </div>
            <div className="flex gap-8 items-center font-bold text-xl">
                <span>Score: {score}</span>
                <span>Level: {level}</span>
            </div>

            <Card className="w-full max-w-md h-48 p-6 shadow-lg flex items-center justify-center">
                {gameState === 'showing' ? (
                     <div className="flex gap-2">
                        {sequence.map((num, index) => (
                            <div
                                key={index}
                                className="w-16 h-20 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-4xl font-bold animate-in fade-in"
                                style={{ animationDelay: `${index * SEQUENCE_DISPLAY_TIME}ms` }}
                            >
                                {num}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground">
                        {gameState === 'waiting' && 'Now, enter the sequence you saw.'}
                        {gameState === 'feedback' && (feedback === 'correct' ? 'Correct!' : 'Try again!')}
                    </div>
                )}
            </Card>

            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-md">
                <div className="relative w-full">
                    <Input
                        type="number"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type the sequence here..."
                        className={cn(
                            "text-center text-xl h-14",
                            feedback === 'correct' && "border-green-500 ring-green-500",
                            feedback === 'incorrect' && "border-destructive ring-destructive"
                        )}
                        disabled={gameState !== 'waiting'}
                    />
                    {feedback === 'correct' && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-green-500"/>}
                    {feedback === 'incorrect' && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-destructive"/>}
                </div>
                <Button type="submit" disabled={gameState !== 'waiting'} className="w-full h-12 text-lg">
                    Check My Answer
                </Button>
            </form>

             <Button onClick={() => setGameState('showing')} variant="secondary" className="mt-4" disabled={gameState === 'showing'}>
                Replay Sequence
             </Button>
        </div>
    );
}
