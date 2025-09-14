
'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bell, Images, ListTodo, UserPlus, Lightbulb, Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCaregiverTip } from '@/ai/flows/caregiver-tips';
import type { Patient } from './caregiver-dashboard';
import { patient as mockPatientData } from '@/lib/data';

type DashboardViewProps = {
    addPatient: (patient: Patient) => void;
    changeActivePatient: (patient: Patient) => void;
    patients: Patient[];
    activePatient: Patient | null;
}

export function DashboardView({ addPatient, changeActivePatient, patients, activePatient }: DashboardViewProps) {
  const { toast } = useToast();
  const [patientIdInput, setPatientIdInput] = useState('');
  const [tip, setTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(true);

  const handleLink = () => {
    if (!patientIdInput.trim()) {
        toast({
            title: "Patient ID Required",
            description: "Please enter a valid Patient ID to link accounts.",
            variant: "destructive",
        });
        return;
    }
    
    // In a real app, you'd fetch patient details from a backend.
    // For this demo, we'll use a mock name based on the ID.
    const newPatient: Patient = {
        id: patientIdInput.trim(),
        name: mockPatientData.name // for simplicity, let's assume it's always John Doe
    }

    addPatient(newPatient);

    toast({
        title: "Patient Added",
        description: `You can now manage ${newPatient.name}.`,
    })
    setPatientIdInput('');
  }

  const fetchTip = async () => {
    setLoadingTip(true);
    try {
        const topics = ['Communication', 'Daily Activities', 'Safety', 'Managing Frustration', 'Self-Care'];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const result = await getCaregiverTip({ topic: randomTopic });
        setTip(result.tip);
    } catch (error) {
        console.error("Failed to fetch caregiver tip:", error);
        setTip("Could not load a tip right now. Remember to take a deep breath and be kind to yourself.");
    } finally {
        setLoadingTip(false);
    }
  }

  useEffect(() => {
    fetchTip();
  }, []);

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Caregiver Dashboard</h1>
        
        {!activePatient ? (
            <Card className='border-primary'>
                <CardHeader>
                    <CardTitle>Welcome, Caregiver!</CardTitle>
                    <CardDescription>To get started, please add a patient to your list and select them.</CardDescription>
                </CardHeader>
            </Card>
        ) : (
             <p className="text-muted-foreground">You are currently managing <span className="font-bold text-foreground">{activePatient.name}</span>. Use the sidebar to navigate.</p>
        )}
        
        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus />Add a New Patient</CardTitle>
                    <CardDescription>Enter the Patient's ID to add them to your managed list.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 max-w-sm">
                        <Input 
                            placeholder="Patient ID (e.g., P-12345XYZ)" 
                            value={patientIdInput}
                            onChange={(e) => setPatientIdInput(e.target.value)}
                        />
                        <Button onClick={handleLink}>Add Patient</Button>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lightbulb /> AI Caregiver Assistant</CardTitle>
                    <CardDescription>A daily tip to help you on your caregiving journey.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingTip ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Getting a helpful tip for you...</span>
                        </div>
                    ) : (
                         <p className="text-base italic p-4 bg-accent/50 rounded-lg border-l-4 border-accent-foreground/50">
                            {tip}
                        </p>
                    )}
                    <Button variant="secondary" onClick={fetchTip} disabled={loadingTip}>
                        Get a New Tip
                    </Button>
                </CardContent>
            </Card>
        </div>


       {activePatient && (
         <Card>
            <CardHeader>
                <CardTitle>Quick Overview for {activePatient.name}</CardTitle>
                <CardDescription>A summary of the selected patient's current setup.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
                 <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><ListTodo /> Today's Plan</h3>
                    <p className="text-2xl font-bold">6 activities</p>
                    <p className="text-sm">scheduled for today.</p>
                </div>
                 <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><Bell /> Medication</h3>
                    <p className="text-2xl font-bold">2 reminders</p>
                    <p className="text-sm">set for today.</p>
                </div>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><Images /> Memory Prompts</h3>
                    <p className="text-2xl font-bold">1 new prompt</p>
                    <p className="text-sm">added this week.</p>
                </div>
            </CardContent>
        </Card>
       )}
    </div>
  )
}
