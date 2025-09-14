
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Pencil, Stethoscope, FileText, BriefcaseMedical } from 'lucide-react';
import { patient as mockPatientData } from '@/lib/data';
import { format } from 'date-fns';

type CaregiverProfile = {
    name: string;
    relationship: string;
}

type ClinicalNote = {
    id: number;
    date: string;
    content: string;
}

const CAREGIVER_PROFILE_KEY = 'neuro-ai-caregiver-profile';
// In a real app, the doctor's info would come from a database. We'll use a mock object.
const mockDoctor = {
    name: "Dr. Evelyn Reed",
    specialty: "Neurology",
};

export function ProfileView() {
    const { toast } = useToast();
    const [profile, setProfile] = useState<CaregiverProfile>({ name: 'Jane Smith', relationship: 'Daughter' });
    const [isEditing, setIsEditing] = useState(false);
    const [patient, setPatient] = useState(mockPatientData);
    const [notes, setNotes] = useState<ClinicalNote[]>([]);

    useEffect(() => {
        const storedProfile = localStorage.getItem(CAREGIVER_PROFILE_KEY);
        if (storedProfile) {
            try {
                setProfile(JSON.parse(storedProfile));
            } catch (e) {
                console.error("Failed to parse caregiver profile", e);
            }
        }
        
        // In a real app, the active patient would be passed as a prop or context
        const linkedPatientId = JSON.parse(localStorage.getItem('neuro-ai-caregiver-linked-patient') || 'null')?.id || mockPatientData.id;
        const storedPatient = localStorage.getItem(`neuro-ai-${linkedPatientId}-patient-data`);
        if (storedPatient) {
            setPatient(JSON.parse(storedPatient));
        }

        const NOTES_STORAGE_KEY = `neuro-ai-${linkedPatientId}-clinical-notes`;
        const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
        if (storedNotes) {
            setNotes(JSON.parse(storedNotes));
        }

    }, []);

    const handleSave = () => {
        localStorage.setItem(CAREGIVER_PROFILE_KEY, JSON.stringify(profile));
        setIsEditing(false);
        toast({
            title: "Profile Saved",
            description: "Your profile information has been updated.",
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3"><BriefcaseMedical />Your Care Team</h1>
                    <p className="text-muted-foreground">An overview of the patient, caregivers, and medical professionals involved.</p>
                </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Patient Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User /> Patient</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-bold text-lg">{patient.name}</p>
                        <p className="text-muted-foreground">ID: {patient.id}</p>
                    </CardContent>
                </Card>

                {/* Caregiver Card */}
                <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2"><User /> Caregiver</CardTitle>
                        </div>
                        {!isEditing && <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4" /></Button>}
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {isEditing ? (
                            <div className="space-y-4">
                                <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                                <Input id="relationship" value={profile.relationship} onChange={(e) => setProfile({ ...profile, relationship: e.target.value })} />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="font-bold text-lg">{profile.name}</p>
                                <p className="text-muted-foreground">{profile.relationship}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Doctor Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Stethoscope /> Doctor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-bold text-lg">{mockDoctor.name}</p>
                        <p className="text-muted-foreground">{mockDoctor.specialty}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Shared Clinical Notes</CardTitle>
                    <CardDescription>A read-only view of the notes from the patient's doctor.</CardDescription>
                </CardHeader>
                <CardContent>
                     {notes.length > 0 ? (
                        <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                            {notes.map(note => (
                                <li key={note.id} className="p-4 border rounded-lg bg-secondary/50">
                                    <p className="text-sm font-semibold text-muted-foreground mb-2">
                                        {format(new Date(note.date), "PPP p")} - by {mockDoctor.name}
                                    </p>
                                    <p className="text-base whitespace-pre-wrap">{note.content}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground p-8">No clinical notes have been shared for this patient yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
