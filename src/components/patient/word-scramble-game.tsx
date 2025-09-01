
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Check, X, Shuffle } from 'lucide-react';

const WORDS = [
    'APPLE', 'BEACH', 'CHAIR', 'DANCE', 'EARTH', 'FRUIT', 'GLASS', 'HEART',
    'ISLAND', 'JELLY', 'KITTEN', 'LEMON', 'MUSIC', 'NURSE', 'OCEAN', 'PANDA'
];

function scrambleWord(word: string): string {
    const a = word.split('');
    const n = a.length;

    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    const scrambled = a.join('');
    // Ensure the scrambled word is not the same as the original
    if (scrambled === word) {
        return scrambleWord(word);
    }
    return scrambled;
}

export function WordScrambleGame() {
    const { toast } = useToast();
    const [targetWord, setTargetWord] = useState('');
    const [scrambledWord, setScrambledWord] = useState('');
    const [userInput, setUserInput] = useState('');
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

    const startNewRound = useMemo(() => () => {
        const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        setTargetWord(newWord);
        setScrambledWord(scrambleWord(newWord));
        setUserInput('');
        setFeedback(null);
    }, []);

    useEffect(() => {
        startNewRound();
    }, [startNewRound]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || feedback) return;

        setAttempts(prev => prev + 1);
        if (userInput.trim().toUpperCase() === targetWord) {
            setScore(prev => prev + 1);
            setFeedback('correct');
            toast({ title: "Correct!", description: "You unscrambled the word perfectly!", duration: 2000 });
            setTimeout(startNewRound, 1500);
        } else {
            setFeedback('incorrect');
            toast({ title: "Not Quite", description: "That's not the right word. Keep trying!", variant: "destructive", duration: 2000 });
            setTimeout(() => setFeedback(null), 1500);
        }
    };

    const handleShuffle = () => {
        setScrambledWord(scrambleWord(targetWord));
    }

    if (!targetWord) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="text-center">
                <h1 className="text-4xl font-bold font-headline">Cognitive Game: Word Scramble</h1>
                <p className="text-muted-foreground text-lg">Unscramble the letters to form a word.</p>
            </div>
            <div className="flex gap-8 items-center font-bold text-xl">
                <span>Score: {score}</span>
                <span>Attempts: {attempts}</span>
            </div>

            <Card className="w-full max-w-md p-6 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center gap-6 p-0">
                    <div className="flex items-center gap-4">
                        <p className="text-5xl font-bold tracking-widest text-primary">
                            {scrambledWord}
                        </p>
                        <Button variant="ghost" size="icon" onClick={handleShuffle} aria-label="Shuffle letters">
                            <Shuffle className="h-6 w-6"/>
                        </Button>
                    </div>
                    <p className="text-muted-foreground">Try to unscramble the word above.</p>
                </CardContent>
            </Card>

            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-md">
                <div className="relative w-full">
                    <Input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Your answer..."
                        className={cn(
                            "text-center text-xl h-14",
                            feedback === 'correct' && "border-green-500 ring-green-500",
                            feedback === 'incorrect' && "border-destructive ring-destructive"
                        )}
                        disabled={!!feedback}
                    />
                    {feedback === 'correct' && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-green-500"/>}
                    {feedback === 'incorrect' && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-destructive"/>}
                </div>
                <Button type="submit" disabled={!!feedback} className="w-full h-12 text-lg">
                    Check Answer
                </Button>
            </form>

             <Button onClick={startNewRound} variant="secondary" className="mt-4">Skip to Next Word</Button>
        </div>
    );
}
