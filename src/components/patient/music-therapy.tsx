
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Waves, Wind, Leaf, Coffee, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { patient as initialPatient } from '@/lib/data';

type MusicItem = {
    id: number;
    name: string;
}

const initialMusicList: MusicItem[] = [
    { id: 1, name: "Calm Piano" },
    { id: 2, name: "Ocean Waves" },
    { id: 3, name: "Gentle Wind" },
];


export function MusicTherapy() {
    const patientId = initialPatient.id;
    const MUSIC_STORAGE_KEY = `neuro-ai-${patientId}-music`;
    
    const { toast } = useToast();
    const [nowPlaying, setNowPlaying] = useState<string | null>(null);
    const [musicList, setMusicList] = useState<MusicItem[]>([]);

    useEffect(() => {
        const storedMusic = localStorage.getItem(MUSIC_STORAGE_KEY);
        if (storedMusic) {
            try {
                const parsedMusic = JSON.parse(storedMusic);
                if (Array.isArray(parsedMusic) && parsedMusic.length > 0) {
                    setMusicList(parsedMusic);
                } else {
                    setMusicList(initialMusicList);
                }
            } catch {
                setMusicList(initialMusicList);
            }
        } else {
            setMusicList(initialMusicList);
        }
    }, [MUSIC_STORAGE_KEY]);

    const handlePlay = (sound: { name: string, id: number }) => {
        setNowPlaying(sound.name);
        toast({
            title: "Now Playing",
            description: `The sound "${sound.name}" has started.`,
        });
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                    <Music className="h-8 w-8 text-primary" />
                    Music & Soundscape Therapy
                </CardTitle>
                <CardDescription className="text-lg">
                    Select a sound below to play some calming audio.
                    {nowPlaying && <div className="mt-2 text-base font-semibold text-primary">Now Playing: {nowPlaying}</div>}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {musicList.map((sound) => (
                        <Button 
                            key={sound.id}
                            variant="outline"
                            className="h-32 text-lg rounded-xl shadow-md transition-transform hover:scale-105 hover:bg-accent/50 flex-col gap-2"
                            onClick={() => handlePlay(sound)}
                        >
                            <Music className="h-10 w-10 text-primary" />
                            {sound.name}
                        </Button>
                    ))}
                    {musicList.length === 0 && (
                        <p className="text-muted-foreground text-center col-span-full py-8">
                            Your caregiver hasn't added any custom music yet.
                        </p>
                    )}
                </div>
                 <div className="mt-6 text-center text-muted-foreground">
                    <p>Audio playback is simulated for this demonstration.</p>
                </div>
            </CardContent>
        </Card>
    );
}
