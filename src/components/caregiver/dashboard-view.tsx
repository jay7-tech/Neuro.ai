'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bell, Images, ListTodo, UserPlus, Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCaregiverTip } from '@/ai/flows/caregiver-tips';

export function DashboardView() {
  const caregiverId = "C-ABCDE12";
  const { toast } = useToast();
  const [patientId, setPatientId] = useState('');
  const [tip, setTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(true);

  const handleLink = () => {
    if (!patientId.trim()) {
        toast({
            title: "Patient ID Required",
            description: "Please enter a valid Patient ID to link accounts.",
            variant: "destructive",
        });
        return;
    }
    toast({
        title: "Patient Linked",
        description: "You are now successfully linked to the patient's account.",
    })
    setPatientId('');
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
        <p className="text-muted-foreground">Welcome back! Your Caregiver ID is <span className="font-bold text-foreground">{caregiverId}</span>. Share this with patients if needed.</p>
        
        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus />Link to a Patient</CardTitle>
                    <CardDescription>Enter the Patient's ID to link your accounts and start coordinating care.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 max-w-sm">
                        <Input 
                            placeholder="Patient ID (e.g., P-12345XYZ)" 
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                        />
                        <Button onClick={handleLink}>Link Account</Button>
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


        <Card>
            <CardHeader>
                <CardTitle>Quick Overview</CardTitle>
                <CardDescription>A summary of the linked patient's current setup.</CardDescription>
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
    </div>
  )
}
