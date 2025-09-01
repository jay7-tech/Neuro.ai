
'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { patient as initialPatient } from '@/lib/data';
import { PlusCircle, Trash2 } from 'lucide-react';

export function CareCoordinationView() {
    const { toast } = useToast();
    const [medications, setMedications] = useState(initialPatient.medications);

    const handleAddTask = () => {
        toast({ title: "Task Added", description: "The new task has been added to the patient's daily plan." });
    }

    const handleAddPrompt = () => {
        toast({ title: "Prompt Added", description: "The new memory prompt is now available for the patient." });
    }

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
            title: "Medication Plan Saved!",
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
                            <CardDescription>Add, edit, or remove tasks from the patient's daily schedule.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 border rounded-lg space-y-2">
                                <h3 className="font-semibold">Add New Task</h3>
                                <div className="flex flex-col md:flex-row gap-2">
                                    <Input placeholder="Task description (e.g., Morning walk)" />
                                    <Input type="time" className="w-auto" />
                                    <Button onClick={handleAddTask} className="w-full md:w-auto">Add Task</Button>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Current Schedule</h3>
                                <p className="text-sm text-muted-foreground">This is where the list of current tasks would be displayed for editing or removal.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="prompts" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Memory Prompts</CardTitle>
                            <CardDescription>Add photos and stories to help with memory recall.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 border rounded-lg space-y-2">
                                <h3 className="font-semibold">Add New Prompt</h3>
                                 <div className="flex flex-col gap-2">
                                    <Input placeholder="Image URL (e.g., from https://picsum.photos)" />
                                    <Textarea placeholder="Story behind the photo..." />
                                    <Textarea placeholder="Prompt question (e.g., What do you remember about this day?)" />
                                    <Button onClick={handleAddPrompt} className="self-start">Add Prompt</Button>
                                </div>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">Current Prompts</h3>
                                <p className="text-sm text-muted-foreground">This is where existing memory prompts would be listed.</p>
                            </div>
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
