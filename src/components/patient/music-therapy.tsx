
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Waves, Wind, Leaf, Coffee, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { patient as initialPatient } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type MusicItem = {
    id: number;
    name: string;
}

const defaultSounds = [
    { id: 1, name: "Ocean Waves", icon: <Waves className="h-10 w-10 text-primary" /> },
    { id: 2, name: "Gentle Wind", icon: <Wind className="h-10 w-10 text-primary" /> },
    { id: 3, name: "Forest Leaves", icon: <Leaf className="h-10 w-10 text-primary" /> },
    { id: 4, name: "Cozy Cafe", icon: <Coffee className="h-10 w-10 text-primary" /> },
]


export function MusicTherapy() {
    const patientId = initialPatient.id;
    const MUSIC_STORAGE_KEY = `neuro-ai-${patientId}-music`;
    
    const { toast } = useToast();
    const [nowPlaying, setNowPlaying] = useState<string | null>(null);
    const [caregiverMusicList, setCaregiverMusicList] = useState<MusicItem[]>([]);

    useEffect(() => {
        const storedMusic = localStorage.getItem(MUSIC_STORAGE_KEY);
        if (storedMusic) {
            try {
                const parsedMusic = JSON.parse(storedMusic);
                 if (Array.isArray(parsedMusic)) {
                    setCaregiverMusicList(parsedMusic);
                }
            } catch {
                setCaregiverMusicList([]);
            }
        } else {
            setCaregiverMusicList([]);
        }
    }, [MUSIC_STORAGE_KEY]);

    const handlePlay = (soundName: string) => {
        setNowPlaying(soundName);
        toast({
            title: "Now Playing",
            description: `The sound "${soundName}" has started.`,
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
                <Tabs defaultValue="calm">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="calm">Calming Sounds</TabsTrigger>
                        <TabsTrigger value="caregiver">From Your Caregiver</TabsTrigger>
                    </TabsList>
                    <TabsContent value="calm" className="mt-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {defaultSounds.map((sound) => (
                                <Button 
                                    key={sound.id}
                                    variant="outline"
                                    className="h-32 text-lg rounded-xl shadow-md transition-transform hover:scale-105 hover:bg-accent/50 flex-col gap-2"
                                    onClick={() => handlePlay(sound.name)}
                                >
                                    {sound.icon}
                                    {sound.name}
                                </Button>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="caregiver" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {caregiverMusicList.map((sound) => (
                                <Button 
                                    key={sound.id}
                                    variant="outline"
                                    className="h-32 text-lg rounded-xl shadow-md transition-transform hover:scale-105 hover:bg-accent/50 flex-col gap-2"
                                    onClick={() => handlePlay(sound.name)}
                                >
                                    <Star className="h-10 w-10 text-yellow-400" />
                                    {sound.name}
                                </Button>
                            ))}
                            {caregiverMusicList.length === 0 && (
                                <p className="text-muted-foreground text-center col-span-full py-8">
                                    Your caregiver hasn't added any custom music or sounds for you yet.
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
                 <div className="mt-6 text-center text-muted-foreground">
                    <p>Audio playback is simulated for this demonstration.</p>
                </div>
            </CardContent>
        </Card>
    );
}
