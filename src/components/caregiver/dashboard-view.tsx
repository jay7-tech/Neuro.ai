'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bell, Images, ListTodo, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DashboardView() {
  const caregiverId = "C-ABCDE12";
  const { toast } = useToast();
  const [patientId, setPatientId] = useState('');

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

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Caregiver Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Your Caregiver ID is <span className="font-bold text-foreground">{caregiverId}</span>. Share this with patients if needed.</p>
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
