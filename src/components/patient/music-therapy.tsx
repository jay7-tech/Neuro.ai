'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Waves, Wind, Leaf, Coffee, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const soundscapes = [
    { name: "Calm Piano", icon: Music, id: 'piano' },
    { name: "Ocean Waves", icon: Waves, id: 'ocean' },
    { name: "Gentle Wind", icon: Wind, id: 'wind' },
    { name: "Forest Leaves", icon: Leaf, id: 'forest' },
    { name: "Cozy Cafe", icon: Coffee, id: 'cafe' },
    { name: "Family Care", icon: Heart, id: 'family' },
]

export function MusicTherapy() {
    const { toast } = useToast();
    const [nowPlaying, setNowPlaying] = useState<string | null>(null);

    const handlePlay = (sound: { name: string, id: string }) => {
        setNowPlaying(sound.name);
        toast({
            title: "Now Playing",
            description: `The ${sound.name} soundscape has started.`,
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
                    {soundscapes.map((sound) => {
                        const Icon = sound.icon;
                        return (
                            <Button 
                                key={sound.id}
                                variant="outline"
                                className="h-32 text-lg rounded-xl shadow-md transition-transform hover:scale-105 hover:bg-accent/50 flex-col gap-2"
                                onClick={() => handlePlay(sound)}
                            >
                                <Icon className="h-10 w-10 text-primary" />
                                {sound.name}
                            </Button>
                        )
                    })}
                </div>
                 <div className="mt-6 text-center text-muted-foreground">
                    <p>Audio playback is simulated for this demonstration.</p>
                </div>
            </CardContent>
        </Card>
    );
}
