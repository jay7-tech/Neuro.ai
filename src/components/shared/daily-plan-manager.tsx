
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Sun, Moon, Utensils, HeartPulse, Brain, Edit, Save, X, Calendar } from 'lucide-react';

type PlanItem = {
    id: number;
    time: string;
    task: string;
    icon: JSX.Element;
    notes: string;
    iconName: string;
};

const initialDailyPlan: PlanItem[] = [
  { id: 1, time: '08:00', task: 'Wake up and get dressed', icon: <Sun className="h-6 w-6 text-primary" />, notes: '', iconName: 'Sun' },
  { id: 2, time: '09:00', task: 'Eat breakfast & take pills', icon: <Utensils className="h-6 w-6 text-primary" />, notes: '', iconName: 'Utensils' },
  { id: 3, time: '10:00', task: 'Morning walk', icon: <HeartPulse className="h-6 w-6 text-primary" />, notes: 'Remember to wear comfortable shoes.', iconName: 'HeartPulse' },
  { id: 4, time: '15:00', task: 'Read a book', icon: <Brain className="h-6 w-6 text-primary" />, notes: '', iconName: 'Brain' },
  { id: 5, time: '20:00', task: 'Prepare for bed', icon: <Moon className="h-6 w-6 text-primary" />, notes: '', iconName: 'Moon' },
];

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

export function DailyPlanManager({ patientId, isCaregiverView }: { patientId: string, isCaregiverView: boolean }) {
    const DAILY_PLAN_STORAGE_KEY = `neuro-ai-${patientId}-daily-plan`;
    const { toast } = useToast();
    const [dailyPlan, setDailyPlan] = useState<PlanItem[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [planBeforeEdit, setPlanBeforeEdit] = useState<PlanItem[]>([]);

    useEffect(() => {
        const storedPlan = localStorage.getItem(DAILY_PLAN_STORAGE_KEY);
        if (storedPlan) {
            try {
                const parsedPlan = JSON.parse(storedPlan).map((item: any) => ({ ...item, icon: getIcon(item.iconName) }));
                setDailyPlan(parsedPlan);
            } catch { setDailyPlan(initialDailyPlan); }
        } else { setDailyPlan(initialDailyPlan); }
    }, [DAILY_PLAN_STORAGE_KEY]);

    const saveDailyPlan = (plan: PlanItem[]) => {
        const planToSave = plan.map(item => ({ id: item.id, time: item.time, task: item.task, notes: item.notes, iconName: item.iconName }));
        localStorage.setItem(DAILY_PLAN_STORAGE_KEY, JSON.stringify(planToSave));
        setDailyPlan(plan);
    };

    const handlePlanChange = (index: number, field: 'task' | 'time' | 'notes', value: string) => { const updatedPlan = [...dailyPlan]; if(updatedPlan[index]) { (updatedPlan[index] as any)[field] = value; setDailyPlan(updatedPlan); }};
    const handleAddPlanItem = () => { setDailyPlan([...dailyPlan, { id: Date.now(), time: '12:00', task: 'New Task', icon: getIcon('Brain'), notes: '', iconName: 'Brain' }]); };
    const handleRemovePlanItem = (id: number) => { setDailyPlan(dailyPlan.filter(item => item.id !== id)); };
    
    const handleEdit = () => { setPlanBeforeEdit(JSON.parse(JSON.stringify(dailyPlan))); setIsEditing(true); };
    const handleSave = () => { setIsEditing(false); saveDailyPlan(dailyPlan); toast({ title: "Plan Saved!", description: "The daily plan has been updated." }); };
    const handleCancel = () => { setDailyPlan(planBeforeEdit); setIsEditing(false); };

    return (
        <Card className="shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl flex items-center gap-2"><Calendar /> {isCaregiverView ? 'Manage Daily Planner' : 'Your Day'}</CardTitle>
                    <CardDescription>{isCaregiverView ? "Add, edit, or remove tasks from the patient's schedule." : 'Your daily schedule.'}</CardDescription>
                </div>
                {!isEditing && <Button variant="outline" size="icon" onClick={handleEdit}><Edit className="h-4 w-4" /></Button>}
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-4">
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
                                    <Input type="text" placeholder="Add a note..." value={item.notes} onChange={(e) => handlePlanChange(index, 'notes', e.target.value)} className="bg-background text-sm"/>
                                </li>
                            ))}
                        </ul>
                        <Button variant="outline" onClick={handleAddPlanItem} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add New Task</Button>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="ghost" onClick={handleCancel}><X className="mr-2 h-4 w-4"/>Cancel</Button>
                            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/>Save Plan</Button>
                        </div>
                    </div>
                ) : (
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
    );
}
