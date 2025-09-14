
'use client'
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserPlus, Bell, AlertTriangle, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from './doctor-dashboard';
import { patient as mockPatientData } from '@/lib/data';
import { MoodChart } from '../shared/mood-chart';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type PatientsViewProps = {
    addPatient: (patient: Patient) => void;
    changeActivePatient: (patient: Patient) => void;
    patients: Patient[];
    activePatient: Patient | null;
}

export function PatientsView({ addPatient, changeActivePatient, patients, activePatient }: PatientsViewProps) {
  const { toast } = useToast();
  const [patientIdInput, setPatientIdInput] = useState('');

  const handleAddPatient = () => {
    if (!patientIdInput.trim()) {
        toast({
            title: "Patient ID Required",
            description: "Please enter a valid Patient ID.",
            variant: "destructive",
        });
        return;
    }
    
    // In a real app, you'd fetch patient details from a backend.
    const newPatient: Patient = {
        id: patientIdInput.trim(),
        name: mockPatientData.name 
    }

    addPatient(newPatient);

    toast({
        title: "Patient Added",
        description: `You can now manage ${newPatient.name}.`,
    })
    setPatientIdInput('');
  }

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Doctor Dashboard</h1>
        
        {!activePatient ? (
            <Card className='border-primary'>
                <CardHeader>
                    <CardTitle>Welcome, Doctor!</CardTitle>
                    <CardDescription>To get started, add a patient to your list and select them to view their clinical data.</CardDescription>
                </CardHeader>
            </Card>
        ) : (
             <p className="text-muted-foreground">You are currently viewing the chart for <span className="font-bold text-foreground">{activePatient.name}</span>.</p>
        )}
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus />Add New Patient</CardTitle>
                <CardDescription>Enter the Patient's unique ID to add them to your list.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 max-w-sm">
                    <Input 
                        placeholder="Patient ID (e.g., P-12345XYZ)" 
                        value={patientIdInput}
                        onChange={(e) => setPatientIdInput(e.target.value)}
                    />
                    <Button onClick={handleAddPatient}>Add Patient</Button>
                </div>
            </CardContent>
        </Card>

       {activePatient && (
         <div className="grid lg:grid-cols-2 gap-6 items-start">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell /> Critical Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Medication Missed</AlertTitle>
                        <AlertDescription>
                            Patient missed their 8:00 PM dose of Namenda yesterday.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Smile /> Patient Mood Log</CardTitle>
                    <CardDescription>Self-reported mood over the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <MoodChart patientId={activePatient.id} />
                    </div>
                </CardContent>
            </Card>
        </div>
       )}
    </div>
  )
}
