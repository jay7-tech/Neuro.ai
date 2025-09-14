
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Smile, Frown, Meh } from "lucide-react";
import { cn } from "@/lib/utils";

type Mood = 'Happy' | 'Okay' | 'Sad';
type MoodLogEntry = {
    date: string; // YYYY-MM-DD
    mood: Mood;
}

const moods: { mood: Mood, icon: JSX.Element, color: string }[] = [
    { mood: 'Happy', icon: <Smile className="h-12 w-12" />, color: 'text-green-500' },
    { mood: 'Okay', icon: <Meh className="h-12 w-12" />, color: 'text-yellow-500' },
    { mood: 'Sad', icon: <Frown className="h-12 w-12" />, color: 'text-red-500' },
]

export function MoodTracker({ patientId }: { patientId: string }) {
    const MOOD_LOG_KEY = `neuro-ai-${patientId}-mood-log`;
    const { toast } = useToast();
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [hasLoggedToday, setHasLoggedToday] = useState(false);

    const getTodayString = () => new Date().toISOString().split('T')[0];

    useEffect(() => {
        const log = JSON.parse(localStorage.getItem(MOOD_LOG_KEY) || '[]') as MoodLogEntry[];
        const todayEntry = log.find(entry => entry.date === getTodayString());
        if (todayEntry) {
            setSelectedMood(todayEntry.mood);
            setHasLoggedToday(true);
        }
    }, [MOOD_LOG_KEY])

    const handleMoodSelect = (mood: Mood) => {
        if (hasLoggedToday) {
            toast({
                title: "Mood Already Logged",
                description: "You've already logged your mood for today.",
            });
            return;
        }

        setSelectedMood(mood);
        
        const today = getTodayString();
        const newEntry: MoodLogEntry = { date: today, mood };
        
        const log = JSON.parse(localStorage.getItem(MOOD_LOG_KEY) || '[]') as MoodLogEntry[];
        
        // Remove today's entry if it exists, then add the new one
        const updatedLog = log.filter(entry => entry.date !== today);
        updatedLog.push(newEntry);

        // Keep only the last 30 days to prevent storage bloat
        if(updatedLog.length > 30) {
            updatedLog.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            updatedLog.splice(30);
        }

        localStorage.setItem(MOOD_LOG_KEY, JSON.stringify(updatedLog));
        
        setHasLoggedToday(true);

        toast({
            title: "Mood Logged!",
            description: `Thank you for sharing. We've logged that you're feeling ${mood.toLowerCase()}.`,
        });
    }

    return (
        <div className="flex justify-around items-center p-4 rounded-lg">
            {moods.map(({ mood, icon, color }) => (
                <div key={mood} className="flex flex-col items-center gap-2">
                    <button
                        onClick={() => handleMoodSelect(mood)}
                        className={cn(
                            "rounded-full p-4 transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                            selectedMood === mood ? `bg-accent shadow-lg ring-2 ring-primary ${color}` : `bg-secondary/50 ${color}`,
                            selectedMood && selectedMood !== mood && 'opacity-50'
                        )}
                        disabled={hasLoggedToday}
                        aria-label={`Select ${mood} mood`}
                    >
                        {icon}
                    </button>
                    <span className="font-semibold">{mood}</span>
                </div>
            ))}
        </div>
    );
}
