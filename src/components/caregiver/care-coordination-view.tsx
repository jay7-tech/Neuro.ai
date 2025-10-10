
'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, SendHorizonal } from 'lucide-react';
import { FamilyTreeView } from '@/components/shared/family-tree-view';
import { MemoryLaneView } from '@/components/shared/memory-lane-view';
import { ScrollArea } from '../ui/scroll-area';
import { DailyPlanManager } from '../shared/daily-plan-manager';
import { MedicationManager } from '../shared/medication-manager';
import { MusicManager } from '../shared/music-manager';

type ChatMessage = {
    id: number;
    sender: 'patient' | 'caregiver';
    text: string;
    timestamp: string;
}

export function CareCoordinationView({ patientId }: { patientId: string }) {
    const CHAT_STORAGE_KEY = `neuro-ai-${patientId}-chat`;

    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatViewportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedChat = localStorage.getItem(CHAT_STORAGE_KEY);
        if (storedChat) {
            try { setChat(JSON.parse(storedChat)); }
            catch { setChat([]); }
        } else { setChat([]); }
        
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === CHAT_STORAGE_KEY && event.newValue) {
                setChat(JSON.parse(event.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);

    }, [patientId, CHAT_STORAGE_KEY]);

     useEffect(() => {
        const viewport = chatViewportRef.current;
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, [chat]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const message: ChatMessage = {
            id: Date.now(),
            sender: 'caregiver',
            text: newMessage,
            timestamp: new Date().toISOString()
        };
        const updatedChat = [...chat, message];
        setChat(updatedChat);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedChat));
        setNewMessage('');
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Care Coordination</h1>
            <p className="text-muted-foreground">Manage the patient's daily routine, memories, family contacts, and medications.</p>
            
            <Tabs defaultValue="chat">
                <TabsList className="grid w-full grid-cols-6 max-w-4xl">
                    <TabsTrigger value="chat">Chat with Patient</TabsTrigger>
                    <TabsTrigger value="planner">Daily Planner</TabsTrigger>
                    <TabsTrigger value="meds">Medications</TabsTrigger>
                    <TabsTrigger value="music">Music Therapy</TabsTrigger>
                    <TabsTrigger value="memory-lane">Memory Lane</TabsTrigger>
                    <TabsTrigger value="family-tree">Family Tree</TabsTrigger>
                </TabsList>
                <TabsContent value="chat" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MessageSquare/> Chat with Patient</CardTitle>
                            <CardDescription>Send and receive messages directly with the patient.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col h-[450px]">
                                <ScrollArea className="flex-grow p-4 border rounded-lg mb-4" viewportRef={chatViewportRef}>
                                     <div className="space-y-4">
                                        {chat.length === 0 && (
                                            <div className="text-center text-muted-foreground p-8">
                                                <p>No messages yet. Send a message to start the conversation!</p>
                                            </div>
                                        )}
                                        {chat.map((entry, index) => (
                                            <div key={index} className={`flex items-end gap-2 ${entry.sender === 'caregiver' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`px-4 py-2 rounded-lg max-w-sm text-base ${entry.sender === 'caregiver' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                {entry.text}
                                            </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="text-base h-12"
                                    />
                                    <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
                                        <SendHorizonal className="h-5 w-5" />
                                        <span className="sr-only">Send</span>
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="planner" className="mt-4">
                    <DailyPlanManager patientId={patientId} isCaregiverView={true} />
                </TabsContent>
                <TabsContent value="meds" className="mt-4">
                    <MedicationManager patientId={patientId} isCaregiverView={true} />
                </TabsContent>
                 <TabsContent value="music" className="mt-4">
                    <MusicManager patientId={patientId} />
                </TabsContent>
                <TabsContent value="memory-lane" className="mt-4">
                   <MemoryLaneView isCaregiverView={true} patientId={patientId} />
                </TabsContent>
                 <TabsContent value="family-tree" className="mt-4">
                    <FamilyTreeView isCaregiverView={true} patientId={patientId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
