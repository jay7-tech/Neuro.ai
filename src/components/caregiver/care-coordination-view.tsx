
'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { patient as initialPatient } from '@/lib/data';
import { PlusCircle, Trash2, Sun, Moon, Utensils, HeartPulse, Brain } from 'lucide-react';

const initialDailyPlan = [
  { time: '08:00', task: 'Wake up and get dressed', icon: <Sun className="h-6 w-6 text-primary" />, notes: '' },
  { time: '09:00', task: 'Eat breakfast & take pills', icon: <Utensils className="h-6 w-6 text-primary" />, notes: '' },
  { time: '10:00', task: 'Morning walk', icon: <HeartPulse className="h-6 w-6 text-primary" />, notes: 'Remember to wear comfortable shoes.' },
  { time: '15:00', task: 'Read a book', icon: <Brain className="h-6 w-6 text-primary" />, notes: '' },
  { time: '20:00', task: 'Prepare for bed', icon: <Moon className="h-6 w-6 text-primary" />, notes: '' },
];


export function CareCoordinationView() {
    const { toast } = useToast();
    const [medications, setMedications] = useState(initialPatient.medications);
    const [dailyPlan, setDailyPlan] = useState(initialDailyPlan);

    const handlePlanChange = (index: number, field: 'task' | 'time' | 'notes', value: string) => {
        const updatedPlan = [...dailyPlan];
        updatedPlan[index] = { ...updatedPlan[index], [field]: value };
        setDailyPlan(updatedPlan);
    };

    const handleSavePlan = () => {
        toast({
            title: "Patient's Plan Saved!",
            description: "The patient's daily plan has been updated successfully."
        });
    };

    const handleMedicationChange = (index: number, field: 'name' | 'dose' | 'time', value: string) => {
        const updatedMeds = [...medications];
        updatedMeds[index] = { ...updatedMeds[index], [field]: value };
        setMedications(updatedMeds);
    };

    const handleAddMedication = () => {
        setMedications([...medications, { id: Date.now(), name: '', dose: '', time: '' }]);
    };

    const handleRemoveMedication = (id: number) => {
        setMedications(medications.filter(med => med.id !== id));
    };

    const handleSaveMedications = () => {
        toast({
            title: "Patient's Medications Saved!",
            description: "The patient's medication schedule has been updated."
        });
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Care Coordination</h1>
            <p className="text-muted-foreground">Manage the patient's daily routine, memory aids, and medications.</p>
            <Tabs defaultValue="planner">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="planner">Daily Planner</TabsTrigger>
                    <TabsTrigger value="prompts">Memory Prompts</TabsTrigger>
                    <TabsTrigger value="meds">Medications</TabsTrigger>
                </TabsList>
                <TabsContent value="planner" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Daily Planner</CardTitle>
                            <CardDescription>Add, edit, or remove tasks from the patient's daily schedule. Changes will appear in their dashboard.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-4">
                                {dailyPlan.map((item, index) => (
                                    <li key={index} className="flex flex-col gap-3 p-3 rounded-lg bg-secondary/50">
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <div className="flex-grow space-y-1.5">
                                        <Input
                                            type="text"
                                            placeholder="Task description..."
                                            value={item.task}
                                            onChange={(e) => handlePlanChange(index, 'task', e.target.value)}
                                            className="bg-background font-bold text-base h-10"
                                        />
                                        <Input
                                            type="time"
                                            value={item.time}
                                            onChange={(e) => handlePlanChange(index, 'time', e.target.value)}
                                            className="bg-background text-sm text-muted-foreground h-9"
                                        />
                                        </div>
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Add a note for the patient..."
                                        value={item.notes}
                                        onChange={(e) => handlePlanChange(index, 'notes', e.target.value)}
                                        className="bg-background text-sm"
                                    />
                                    </li>
                                ))}
                            </ul>
                            <Button onClick={handleSavePlan} className="w-full mt-4">Save Patient's Plan</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="prompts" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Memory Prompts</CardTitle>
                            <CardDescription>This feature is not yet implemented.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <p className="text-sm text-muted-foreground">The ability to add and manage memory prompts from the caregiver dashboard is coming soon.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="meds" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Medications</CardTitle>
                            <CardDescription>Edit the patient's medication schedule. Changes will be visible to the patient.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {medications.map((med, index) => (
                                <div key={med.id} className="p-3 rounded-lg bg-secondary space-y-2">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Medicine Name"
                                            value={med.name}
                                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                            className="bg-background font-semibold"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveMedication(med.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    <Input
                                        placeholder="Dosage (e.g., 1 tablet)"
                                        value={med.dose}
                                        onChange={(e) => handleMedicationChange(index, 'dose', e.target.value)}
                                        className="bg-background"
                                    />
                                    <Input
                                        type="time"
                                        value={med.time}
                                        onChange={(e) => handleMedicationChange(index, 'time', e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                            ))}
                            <Button variant="outline" onClick={handleAddMedication} className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Medication
                            </Button>
                            <Button onClick={handleSaveMedications} className="w-full">Save Medications</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
