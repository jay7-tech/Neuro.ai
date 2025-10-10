'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Laugh, Smile, Meh, Frown, Angry, CheckCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";

export type Mood = 'Very Good' | 'Good' | 'Okay' | 'Bad' | 'Very Bad';
export type MoodLogEntry = {
    date: string; // YYYY-MM-DD
    mood: Mood;
    note?: string;
}

const moods: { mood: Mood, icon: JSX.Element, color: string }[] = [
    { mood: 'Very Good', icon: <Laugh className="h-12 w-12" />, color: 'text-green-500' },
    { mood: 'Good', icon: <Smile className="h-12 w-12" />, color: 'text-lime-500' },
    { mood: 'Okay', icon: <Meh className="h-12 w-12" />, color: 'text-yellow-500' },
    { mood: 'Bad', icon: <Frown className="h-12 w-12" />, color: 'text-orange-500' },
    { mood: 'Very Bad', icon: <Angry className="h-12 w-12" />, color: 'text-red-500' },
]

export function MoodTracker({ patientId }: { patientId: string }) {
    const MOOD_LOG_KEY = `neuro-ai-${patientId}-mood-log`;
    const { toast } = useToast();
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [note, setNote] = useState("");
    const [step, setStep] = useState<'selecting' | 'note' | 'completed'>('selecting');
    const [hasLoggedToday, setHasLoggedToday] = useState(false);

    const getTodayString = () => new Date().toISOString().split('T')[0];

    useEffect(() => {
        const log = JSON.parse(localStorage.getItem(MOOD_LOG_KEY) || '[]') as MoodLogEntry[];
        const todayEntry = log.find(entry => entry.date === getTodayString());
        if (todayEntry) {
            setSelectedMood(todayEntry.mood);
            setStep('completed');
            setHasLoggedToday(true);
        }
    }, [MOOD_LOG_KEY]);

    const handleMoodSelect = (mood: Mood) => {
        if (hasLoggedToday) return;
        setSelectedMood(mood);
        setStep('note');
    };

    const handleSave = () => {
        if (!selectedMood) return;

        const today = getTodayString();
        const newEntry: MoodLogEntry = { date: today, mood: selectedMood, note: note.trim() };
        
        const log = JSON.parse(localStorage.getItem(MOOD_LOG_KEY) || '[]') as MoodLogEntry[];
        
        const updatedLog = log.filter(entry => entry.date !== today);
        updatedLog.push(newEntry);

        if(updatedLog.length > 30) {
            updatedLog.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            updatedLog.splice(30);
        }

        localStorage.setItem(MOOD_LOG_KEY, JSON.stringify(updatedLog));
        
        setHasLoggedToday(true);
        setStep('completed');

        toast({
            title: "Mood Logged!",
            description: `Thank you for sharing. We've logged your feelings for today.`,
        });
    };
    
    const handleBack = () => {
        if (step === 'note') {
            setStep('selecting');
            setSelectedMood(null);
        }
    }

    const getSelectedMoodIcon = () => {
        const moodData = moods.find(m => m.mood === selectedMood);
        return moodData ? moodData.icon : null;
    }

    return (
        <div className="p-4 rounded-lg min-h-[220px]">
            {step === 'selecting' && (
                <div className="flex justify-around items-center">
                    {moods.map(({ mood, icon, color }) => (
                        <div key={mood} className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => handleMoodSelect(mood)}
                                className={cn(
                                    "rounded-full p-4 transition-all duration-200 transform hover:scale-110",
                                    `bg-secondary/50 ${color}`
                                )}
                                aria-label={`Select ${mood} mood`}
                            >
                                {icon}
                            </button>
                            <span className="font-semibold text-sm">{mood}</span>
                        </div>
                    ))}
                </div>
            )}
            {step === 'note' && (
                 <div className="flex flex-col items-center gap-4 animate-in fade-in">
                    <h3 className="text-xl font-semibold">What's making you feel this way?</h3>
                    <Textarea 
                        placeholder="It's okay to share what's on your mind... (optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className="text-base"
                    />
                    <div className="flex w-full justify-between">
                         <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                         <Button onClick={handleSave}>Save Mood</Button>
                    </div>
                 </div>
            )}
            {step === 'completed' && (
                <div className="flex flex-col items-center justify-center text-center gap-4 h-full animate-in fade-in">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <h3 className="text-2xl font-bold">Thanks for sharing!</h3>
                    <p className="text-muted-foreground">You've already logged your mood for today as <span className="font-semibold">{selectedMood}</span>.</p>
                </div>
            )}
        </div>
    );
}
