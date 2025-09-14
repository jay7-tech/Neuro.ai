
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star } from 'lucide-react';

export function MessageBoard({ patientId }: { patientId: string }) {
    const MESSAGE_BOARD_KEY = `neuro-ai-${patientId}-message-board`;
    const [message, setMessage] = useState('');

    useEffect(() => {
        const storedMessage = localStorage.getItem(MESSAGE_BOARD_KEY);
        if (storedMessage) {
            setMessage(storedMessage);
        }

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === MESSAGE_BOARD_KEY && event.newValue) {
                setMessage(event.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };

    }, [MESSAGE_BOARD_KEY]);

    if (!message) {
        return null; // Don't render the card if there's no message
    }

    return (
        <Card className="shadow-xl rounded-2xl bg-accent/50 border-accent-foreground/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500" /> A Note From Your Caregiver
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg italic">"{message}"</p>
            </CardContent>
        </Card>
    );
}
