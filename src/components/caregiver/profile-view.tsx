
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Pencil, MessageSquare, Calendar } from 'lucide-react';

type CaregiverProfile = {
    name: string;
    relationship: string;
}

const CAREGIVER_PROFILE_KEY = 'neuro-ai-caregiver-profile';

export function ProfileView() {
    const { toast } = useToast();
    const [profile, setProfile] = useState<CaregiverProfile>({ name: 'Jane Smith', relationship: 'Daughter' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const storedProfile = localStorage.getItem(CAREGIVER_PROFILE_KEY);
        if (storedProfile) {
            try {
                setProfile(JSON.parse(storedProfile));
            } catch (e) {
                console.error("Failed to parse caregiver profile", e);
            }
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
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3"><User />Your Profile</h1>
                    <p className="text-muted-foreground">Manage your personal information and collaboration settings.</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="font-semibold">Name</label>
                        {isEditing ? (
                            <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                        ) : (
                            <p className="p-3 bg-muted rounded-md">{profile.name}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="relationship" className="font-semibold">Relationship to Patient</label>
                        {isEditing ? (
                            <Input id="relationship" value={profile.relationship} onChange={(e) => setProfile({ ...profile, relationship: e.target.value })} />
                        ) : (
                            <p className="p-3 bg-muted rounded-md">{profile.relationship}</p>
                        )}
                    </div>
                    {isEditing && (
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Collaboration Tools</CardTitle>
                    <CardDescription>Connect with the patient's doctor and other care team members.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 text-lg" disabled>
                        <MessageSquare className="mr-2" /> Secure Messaging
                    </Button>
                    <Button variant="outline" className="h-20 text-lg" disabled>
                        <Calendar className="mr-2" /> Book a Session
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
