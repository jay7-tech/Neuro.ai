
'use client'
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Patient } from './doctor-dashboard';
import { FileText, PlusCircle, Save } from 'lucide-react';

type ClinicalNote = {
    id: number;
    date: string; // ISO string
    content: string;
}

export function ClinicalNotesView({ patient }: { patient: Patient }) {
    const NOTES_STORAGE_KEY = `neuro-ai-${patient.id}-clinical-notes`;
    const { toast } = useToast();
    const [notes, setNotes] = useState<ClinicalNote[]>([]);
    const [newNote, setNewNote] = useState("");

    useEffect(() => {
        const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
        if (storedNotes) {
            setNotes(JSON.parse(storedNotes));
        }
    }, [NOTES_STORAGE_KEY]);

    const handleSaveNote = () => {
        if (!newNote.trim()) {
            toast({
                title: "Note is empty",
                description: "Please write something before saving.",
                variant: "destructive",
            });
            return;
        }

        const noteToSave: ClinicalNote = {
            id: Date.now(),
            date: new Date().toISOString(),
            content: newNote.trim(),
        };

        const updatedNotes = [noteToSave, ...notes];
        setNotes(updatedNotes);
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
        setNewNote("");
        toast({
            title: "Note Saved",
            description: "The clinical note has been added to the patient's record.",
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-3"><FileText />Clinical Notes for {patient.name}</h1>
            <p className="text-muted-foreground">Log observations, assessment results, and other clinical information.</p>
            
            <Card>
                <CardHeader>
                    <CardTitle>Add a New Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        placeholder={`Start writing a new note for ${patient.name}...`}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={6}
                        className="text-base"
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleSaveNote}><Save className="mr-2 h-4 w-4"/> Save Note</Button>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Note History</CardTitle>
                    <CardDescription>Previously saved notes for this patient.</CardDescription>
                </CardHeader>
                <CardContent>
                    {notes.length > 0 ? (
                        <ul className="space-y-4">
                            {notes.map(note => (
                                <li key={note.id} className="p-4 border rounded-lg bg-secondary/50">
                                    <p className="text-sm font-semibold text-muted-foreground mb-2">
                                        {format(new Date(note.date), "PPP p")}
                                    </p>
                                    <p className="text-base whitespace-pre-wrap">{note.content}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground p-8">No clinical notes have been saved for this patient yet.</p>
                    )}
                </CardContent>
            </Card>

        </div>
    )
}
