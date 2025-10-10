
'use client';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizonal, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

type ChatMessage = {
    id: number;
    sender: 'patient' | 'caregiver';
    text: string;
    timestamp: string;
}

export function CaregiverChat({ patientId }: { patientId: string }) {
    const CHAT_STORAGE_KEY = `neuro-ai-${patientId}-chat`;
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const viewportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedChat = localStorage.getItem(CHAT_STORAGE_KEY);
        if (storedChat) {
            try {
                setConversation(JSON.parse(storedChat));
            } catch {
                setConversation([]);
            }
        }

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === CHAT_STORAGE_KEY && event.newValue) {
                try {
                    setConversation(JSON.parse(event.newValue));
                } catch {
                     // handle broken json
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [CHAT_STORAGE_KEY]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, [conversation]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newMessage: ChatMessage = {
            id: Date.now(),
            sender: 'patient',
            text: message,
            timestamp: new Date().toISOString()
        };

        const updatedConversation = [...conversation, newMessage];
        setConversation(updatedConversation);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedConversation));
        setMessage('');
    };

    return (
        <Card className="shadow-xl rounded-2xl bg-accent/50 border-accent-foreground/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500" /> Chat with Your Caregiver
                </CardTitle>
                <CardDescription>Send and receive messages from your caregiver.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col h-[400px]">
                    <ScrollArea className="flex-grow p-4 border rounded-lg mb-4 bg-background" viewportRef={viewportRef}>
                        <div className="space-y-4">
                            {conversation.length === 0 && (
                                <div className="text-center text-muted-foreground p-8">
                                <p>No messages yet. Your caregiver can send you a message here!</p>
                                </div>
                            )}
                            {conversation.map((entry, index) => (
                                <div key={index} className={`flex items-end gap-2 ${entry.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2 rounded-lg max-w-sm text-base ${entry.sender === 'patient' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {entry.text}
                                </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="text-base h-12 bg-background"
                        />
                        <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
                            <SendHorizonal className="h-5 w-5" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
