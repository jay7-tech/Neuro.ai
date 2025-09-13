

'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { patient as initialPatient } from '@/lib/data';
import { PlusCircle, Trash2, Sun, Moon, Utensils, HeartPulse, Brain, Edit, Save, X } from 'lucide-react';

const DAILY_PLAN_STORAGE_KEY = 'neuro-ai-daily-plan';

const initialDailyPlan = [
  { id: 1, time: '08:00', task: 'Wake up and get dressed', icon: <Sun className="h-6 w-6 text-primary" />, notes: '' },
  { id: 2, time: '09:00', task: 'Eat breakfast & take pills', icon: <Utensils className="h-6 w-6 text-primary" />, notes: '' },
  { id: 3, time: '10:00', task: 'Morning walk', icon: <HeartPulse className="h-6 w-6 text-primary" />, notes: 'Remember to wear comfortable shoes.' },
  { id: 4, time: '15:00', task: 'Read a book', icon: <Brain className="h-6 w-6 text-primary" />, notes: '' },
  { id: 5, time: '20:00', task: 'Prepare for bed', icon: <Moon className="h-6 w-6 text-primary" />, notes: '' },
];


export function CareCoordinationView() {
    const { toast } = useToast();
    const [medications, setMedications] = useState(initialPatient.medications);
    const [dailyPlan, setDailyPlan] = useState(initialDailyPlan);
    
    const [isEditingPlan, setIsEditingPlan] = useState(false);
    const [planBeforeEdit, setPlanBeforeEdit] = useState(initialDailyPlan);

    const [isEditingMeds, setIsEditingMeds] = useState(false);
    const [medsBeforeEdit, setMedsBeforeEdit] = useState(initialPatient.medications);

    useEffect(() => {
        const storedPlan = localStorage.getItem(DAILY_PLAN_STORAGE_KEY);
        if (storedPlan) {
            try {
                const parsedPlan = JSON.parse(storedPlan).map((item: any) => {
                    const iconMap: { [key: string]: JSX.Element } = {
                        Sun: <Sun className="h-6 w-6 text-primary" />,
                        Utensils: <Utensils className="h-6 w-6 text-primary" />,
                        HeartPulse: <HeartPulse className="h-6 w-6 text-primary" />,
                        Brain: <Brain className="h-6 w-6 text-primary" />,
                        Moon: <Moon className="h-6 w-6 text-primary" />,
                    };
                    const iconName = item.iconName || 'Brain';
                    return { ...item, icon: iconMap[iconName] };
                });
                setDailyPlan(parsedPlan);
            } catch {
                setDailyPlan(initialDailyPlan);
            }
        }
    }, []);

    const saveDailyPlan = (plan: typeof initialDailyPlan) => {
        const planWithIconNames = plan.map(item => ({
            ...item,
            iconName: (item.icon.type as any).displayName
        }));
        localStorage.setItem(DAILY_PLAN_STORAGE_KEY, JSON.stringify(planWithIconNames));
        setDailyPlan(plan);
    };


    const handlePlanChange = (index: number, field: 'task' | 'time' | 'notes', value: string) => {
        const updatedPlan = [...dailyPlan];
        const planItem = updatedPlan[index];
        if (planItem) {
            (planItem as any)[field] = value;
            setDailyPlan(updatedPlan);
        }
    };

    const handleEditPlan = () => {
        setPlanBeforeEdit(dailyPlan.map(p => ({...p})));
        setIsEditingPlan(true);
    };

    const handleSavePlan = () => {
        setIsEditingPlan(false);
        saveDailyPlan(dailyPlan);
        toast({
            title: "Patient's Plan Saved!",
            description: "The patient's daily plan has been updated successfully."
        });
    };

    const handleCancelPlan = () => {
        setDailyPlan(planBeforeEdit);
        setIsEditingPlan(false);
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

    const handleEditMeds = () => {
        setMedsBeforeEdit(medications.map(m => ({...m})));
        setIsEditingMeds(true);
    }

    const handleSaveMedications = () => {
        setIsEditingMeds(false);
        toast({
            title: "Patient's Medications Saved!",
            description: "The patient's medication schedule has been updated."
        });
    };
    
    const handleCancelMeds = () => {
        setMedications(medsBeforeEdit);
        setIsEditingMeds(false);
    }


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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Manage Daily Planner</CardTitle>
                                <CardDescription>Add, edit, or remove tasks from the patient's daily schedule. Changes will appear in their dashboard.</CardDescription>
                            </div>
                            {!isEditingPlan && <Button variant="outline" size="icon" onClick={handleEditPlan}><Edit className="h-4 w-4" /></Button>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditingPlan ? (
                                <>
                                    <ul className="space-y-4">
                                        {dailyPlan.map((item, index) => (
                                            <li key={item.id} className="flex flex-col gap-3 p-3 rounded-lg bg-secondary/50">
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
                                     <div className="flex justify-end gap-2">
                                        <Button variant="ghost" onClick={handleCancelPlan}><X className="mr-2 h-4 w-4"/>Cancel</Button>
                                        <Button onClick={handleSavePlan}><Save className="mr-2 h-4 w-4"/>Save Patient's Plan</Button>
                                    </div>
                                </>
                            ): (
                                <ul className="space-y-4">
                                    {dailyPlan.map((item) => (
                                         <li key={item.id} className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50">
                                            <div className="pt-1">{item.icon}</div>
                                            <div className="flex-grow">
                                            <p className="font-bold">{item.task}</p>
                                            <p className="text-sm text-muted-foreground">{item.time}</p>
                                            {item.notes && <p className="text-sm mt-1 italic">{item.notes}</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Manage Medications</CardTitle>
                                <CardDescription>Edit the patient's medication schedule. Changes will be visible to the patient.</CardDescription>
                            </div>
                            {!isEditingMeds && <Button variant="outline" size="icon" onClick={handleEditMeds}><Edit className="h-4 w-4" /></Button>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {isEditingMeds ? (
                                <>
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
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={handleCancelMeds}><X className="mr-2 h-4 w-4"/>Cancel</Button>
                                    <Button onClick={handleSaveMedications}><Save className="mr-2 h-4 w-4"/>Save Medications</Button>
                                </div>
                                </>
                           ) : (
                                <ul className="space-y-2">
                                    {medications.map(med => (
                                        <li key={med.id} className="p-3 rounded-lg bg-secondary/50 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold">{med.name}</p>
                                                <p className="text-sm text-muted-foreground">{med.dose}</p>
                                            </div>
                                            <p className="font-mono text-lg">{med.time}</p>
                                        </li>
                                    ))}
                                </ul>
                           )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
