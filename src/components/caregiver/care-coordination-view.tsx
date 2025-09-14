

'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Sun, Moon, Utensils, HeartPulse, Brain, Edit, Save, X, MessageSquare, SendHorizonal, Star } from 'lucide-react';
import { FamilyTreeView } from '@/components/shared/family-tree-view';
import { MemoryLaneView } from '@/components/shared/memory-lane-view';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';


type PlanItem = {
    id: number;
    time: string;
    task: string;
    icon: JSX.Element;
    notes: string;
    iconName: string;
};

type Medication = {
    id: number;
    name: string;
    dose: string;
    time: string;
};

type ChatMessage = {
    id: number;
    sender: 'patient' | 'caregiver';
    text: string;
    timestamp: string;
}

const initialDailyPlan = [
  { id: 1, time: '08:00', task: 'Wake up and get dressed', icon: <Sun className="h-6 w-6 text-primary" />, notes: '', iconName: 'Sun' },
  { id: 2, time: '09:00', task: 'Eat breakfast & take pills', icon: <Utensils className="h-6 w-6 text-primary" />, notes: '', iconName: 'Utensils' },
  { id: 3, time: '10:00', task: 'Morning walk', icon: <HeartPulse className="h-6 w-6 text-primary" />, notes: 'Remember to wear comfortable shoes.', iconName: 'HeartPulse' },
  { id: 4, time: '15:00', task: 'Read a book', icon: <Brain className="h-6 w-6 text-primary" />, notes: '', iconName: 'Brain' },
  { id: 5, time: '20:00', task: 'Prepare for bed', icon: <Moon className="h-6 w-6 text-primary" />, notes: '', iconName: 'Moon' },
];

const initialMedications: Medication[] = [
    { id: 1, name: 'Aricept', dose: '1 tablet', time: '09:00' },
    { id: 2, name: 'Namenda', dose: '1 tablet', time: '20:00' },
];


export function CareCoordinationView({ patientId }: { patientId: string }) {
    const DAILY_PLAN_STORAGE_KEY = `neuro-ai-${patientId}-daily-plan`;
    const MEDICATIONS_STORAGE_KEY = `neuro-ai-${patientId}-medications`;
    const CHAT_STORAGE_KEY = `neuro-ai-${patientId}-chat`;

    const { toast } = useToast();
    const [medications, setMedications] = useState<Medication[]>([]);
    const [dailyPlan, setDailyPlan] = useState<PlanItem[]>([]);
    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatViewportRef = useRef<HTMLDivElement>(null);
    
    const [isEditingPlan, setIsEditingPlan] = useState(false);
    const [planBeforeEdit, setPlanBeforeEdit] = useState<PlanItem[]>([]);

    const [isEditingMeds, setIsEditingMeds] = useState(false);
    const [medsBeforeEdit, setMedsBeforeEdit] = useState<Medication[]>([]);

    const getIcon = (iconName: string) => {
        const iconMap: { [key: string]: JSX.Element } = {
            Sun: <Sun className="h-6 w-6 text-primary" />,
            Utensils: <Utensils className="h-6 w-6 text-primary" />,
            HeartPulse: <HeartPulse className="h-6 w-6 text-primary" />,
            Brain: <Brain className="h-6 w-6 text-primary" />,
            Moon: <Moon className="h-6 w-6 text-primary" />,
        };
        return iconMap[iconName] || <Brain className="h-6 w-6 text-primary" />;
    };

    useEffect(() => {
        // Load Daily Plan
        const storedPlan = localStorage.getItem(DAILY_PLAN_STORAGE_KEY);
        if (storedPlan) {
            try {
                const parsedPlan = JSON.parse(storedPlan).map((item: any) => ({ ...item, icon: getIcon(item.iconName) }));
                setDailyPlan(parsedPlan);
            } catch { setDailyPlan(initialDailyPlan); }
        } else { setDailyPlan(initialDailyPlan); }

        // Load Medications
        const storedMeds = localStorage.getItem(MEDICATIONS_STORAGE_KEY);
        if (storedMeds) {
            try { setMedications(JSON.parse(storedMeds)); } 
            catch { setMedications(initialMedications); }
        } else { setMedications(initialMedications); }

        // Load Chat
        const storedChat = localStorage.getItem(CHAT_STORAGE_KEY);
        if (storedChat) {
            try { setChat(JSON.parse(storedChat)); }
            catch { setChat([]); }
        } else { setChat([]); }
        
        // Listen for storage changes from other tabs/windows
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === CHAT_STORAGE_KEY && event.newValue) {
                setChat(JSON.parse(event.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);

    }, [patientId, DAILY_PLAN_STORAGE_KEY, MEDICATIONS_STORAGE_KEY, CHAT_STORAGE_KEY]);

     useEffect(() => {
        const viewport = chatViewportRef.current;
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, [chat]);


    const saveDailyPlan = (plan: PlanItem[]) => {
        const planToSave = plan.map(item => ({ id: item.id, time: item.time, task: item.task, notes: item.notes, iconName: item.iconName }));
        localStorage.setItem(DAILY_PLAN_STORAGE_KEY, JSON.stringify(planToSave));
        setDailyPlan(plan);
    };

    const saveMedications = (meds: Medication[]) => {
        localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(meds));
        setMedications(meds);
    }
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const message: ChatMessage = {
            id: Date.now(),
            sender: 'caregiver',
            text: newMessage,
            timestamp: new Date().toISOString()
        };
        const updatedChat = [...chat, message];
        setChat(updatedChat);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedChat));
        setNewMessage('');
    }

    // Daily Plan handlers
    const handlePlanChange = (index: number, field: 'task' | 'time' | 'notes', value: string) => { const updatedPlan = [...dailyPlan]; if(updatedPlan[index]) { (updatedPlan[index] as any)[field] = value; setDailyPlan(updatedPlan); }};
    const handleAddPlanItem = () => { setDailyPlan([...dailyPlan, { id: Date.now(), time: '12:00', task: 'New Task', icon: getIcon('Brain'), notes: '', iconName: 'Brain' }]); };
    const handleRemovePlanItem = (id: number) => { setDailyPlan(dailyPlan.filter(item => item.id !== id)); };
    const handleEditPlan = () => { setPlanBeforeEdit(JSON.parse(JSON.stringify(dailyPlan))); setIsEditingPlan(true); };
    const handleSavePlan = () => { setIsEditingPlan(false); saveDailyPlan(dailyPlan); toast({ title: "Patient's Plan Saved!", description: "The patient's daily plan has been updated." }); };
    const handleCancelPlan = () => { setDailyPlan(planBeforeEdit); setIsEditingPlan(false); };

    // Medication handlers
    const handleMedicationChange = (index: number, field: 'name' | 'dose' | 'time', value: string) => { const updatedMeds = [...medications]; updatedMeds[index] = { ...updatedMeds[index], [field]: value }; setMedications(updatedMeds); };
    const handleAddMedication = () => { setMedications([...medications, { id: Date.now(), name: '', dose: '', time: '' }]); };
    const handleRemoveMedication = (id: number) => { setMedications(medications.filter(med => med.id !== id)); };
    const handleEditMeds = () => { setMedsBeforeEdit(JSON.parse(JSON.stringify(medications))); setIsEditingMeds(true); };
    const handleSaveMedications = () => { setIsEditingMeds(false); saveMedications(medications); toast({ title: "Patient's Medications Saved!", description: "The patient's medication schedule has been updated." }); };
    const handleCancelMeds = () => { setMedications(medsBeforeEdit); setIsEditingMeds(false); };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Care Coordination</h1>
            <p className="text-muted-foreground">Manage the patient's daily routine, memories, family contacts, and medications.</p>
            
            <Tabs defaultValue="chat">
                <TabsList className="grid w-full grid-cols-5 max-w-2xl">
                    <TabsTrigger value="chat">Chat with Patient</TabsTrigger>
                    <TabsTrigger value="planner">Daily Planner</TabsTrigger>
                    <TabsTrigger value="meds">Medications</TabsTrigger>
                    <TabsTrigger value="memory-lane">Memory Lane</TabsTrigger>
                    <TabsTrigger value="family-tree">Family Tree</TabsTrigger>
                </TabsList>
                <TabsContent value="chat" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MessageSquare/> Chat with Patient</CardTitle>
                            <CardDescription>Send and receive messages directly with the patient.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col h-[450px]">
                                <ScrollArea className="flex-grow p-4 border rounded-lg mb-4" viewportRef={chatViewportRef}>
                                     <div className="space-y-4">
                                        {chat.length === 0 && (
                                            <div className="text-center text-muted-foreground p-8">
                                                <p>No messages yet. Send a message to start the conversation!</p>
                                            </div>
                                        )}
                                        {chat.map((entry, index) => (
                                            <div key={index} className={`flex items-end gap-2 ${entry.sender === 'caregiver' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`px-4 py-2 rounded-lg max-w-sm text-base ${entry.sender === 'caregiver' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                {entry.text}
                                            </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="text-base h-12"
                                    />
                                    <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
                                        <SendHorizonal className="h-5 w-5" />
                                        <span className="sr-only">Send</span>
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="planner" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Manage Daily Planner</CardTitle>
                                <CardDescription>Add, edit, or remove tasks from the patient's daily schedule.</CardDescription>
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
                                                    <Input type="text" placeholder="Task description..." value={item.task} onChange={(e) => handlePlanChange(index, 'task', e.target.value)} className="bg-background font-bold text-base h-10"/>
                                                    <Input type="time" value={item.time} onChange={(e) => handlePlanChange(index, 'time', e.target.value)} className="bg-background text-sm text-muted-foreground h-9"/>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemovePlanItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                            <Input type="text" placeholder="Add a note for the patient..." value={item.notes} onChange={(e) => handlePlanChange(index, 'notes', e.target.value)} className="bg-background text-sm"/>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button variant="outline" onClick={handleAddPlanItem} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add New Task</Button>
                                     <div className="flex justify-end gap-2 mt-4">
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
                                            <Input placeholder="Medicine Name" value={med.name} onChange={(e) => handleMedicationChange(index, 'name', e.target.value)} className="bg-background font-semibold" />
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveMedication(med.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                        <Input placeholder="Dosage (e.g., 1 tablet)" value={med.dose} onChange={(e) => handleMedicationChange(index, 'dose', e.target.value)} className="bg-background"/>
                                        <Input type="time" value={med.time} onChange={(e) => handleMedicationChange(index, 'time', e.target.value)} className="bg-background"/>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={handleAddMedication} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add Medication</Button>
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
                                    {medications.length === 0 && <p className="text-muted-foreground text-center p-4">No medications found.</p>}
                                </ul>
                           )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="memory-lane" className="mt-4">
                   <MemoryLaneView isCaregiverView={true} patientId={patientId} />
                </TabsContent>
                 <TabsContent value="family-tree" className="mt-4">
                    <FamilyTreeView isCaregiverView={true} patientId={patientId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
