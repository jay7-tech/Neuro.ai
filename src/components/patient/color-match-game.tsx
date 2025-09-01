
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const COLORS = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Yellow', hex: '#eab308' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Black', hex: '#1f2937' },
];

export function ColorMatchGame() {
    const { toast } = useToast();
    const [targetColor, setTargetColor] = useState<{ name: string, hex: string } | null>(null);
    const [colorOptions, setColorOptions] = useState<{ name: string, hex: string }[]>([]);
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

    const startNewRound = useMemo(() => () => {
        const shuffled = [...COLORS].sort(() => 0.5 - Math.random());
        const target = shuffled[0];
        const options = shuffled.slice(0, 4).sort(() => 0.5 - Math.random());
        
        setTargetColor(target);
        setColorOptions(options);
        setFeedback(null);
    }, []);

    useEffect(() => {
        startNewRound();
    }, [startNewRound]);

    const handleColorClick = (clickedColor: { name: string, hex: string }) => {
        if (feedback) return;

        setAttempts(prev => prev + 1);
        if (clickedColor.name === targetColor?.name) {
            setScore(prev => prev + 1);
            setFeedback('correct');
            toast({ title: "Correct!", description: "You picked the right color. Great job!", duration: 2000 });
            setTimeout(startNewRound, 1500);
        } else {
            setFeedback('incorrect');
            toast({ title: "Not Quite", description: "That wasn't the right color. Try again!", variant: "destructive", duration: 2000 });
            setTimeout(() => setFeedback(null), 1500);
        }
    };

    if (!targetColor) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="text-center">
                <h1 className="text-4xl font-bold font-headline">Cognitive Game: Color Match</h1>
                <p className="text-muted-foreground text-lg">Select the box that matches the color name.</p>
            </div>
            <div className="flex gap-8 items-center font-bold text-xl">
                <span>Score: {score}</span>
                <span>Attempts: {attempts}</span>
            </div>

            <Card className="w-full max-w-md p-6 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center gap-6 p-0">
                    <h2 className="text-5xl font-bold" style={{ color: COLORS.sort(() => 0.5 - Math.random())[0].hex }}>
                        {targetColor.name}
                    </h2>
                    <p className="text-muted-foreground">Which color is this?</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {colorOptions.map((color) => (
                    <button
                        key={color.name}
                        onClick={() => handleColorClick(color)}
                        disabled={!!feedback}
                        className={cn(
                            "h-32 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105",
                            feedback && color.name === targetColor.name && "border-4 border-green-500 scale-105",
                            feedback === 'incorrect' && "opacity-50"
                        )}
                        style={{ backgroundColor: color.hex }}
                        aria-label={`Color option ${color.name}`}
                    />
                ))}
            </div>

             <Button onClick={startNewRound} variant="secondary" className="mt-4">Next Round</Button>
        </div>
    );
}
