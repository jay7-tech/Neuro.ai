
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Pill, Edit, Save, X } from 'lucide-react';

type Medication = {
    id: number;
    name: string;
    dose: string;
    time: string;
};

const initialMedications: Medication[] = [
    { id: 1, name: 'Aricept', dose: '1 tablet', time: '09:00' },
    { id: 2, name: 'Namenda', dose: '1 tablet', time: '20:00' },
];

export function MedicationManager({ patientId, isCaregiverView }: { patientId: string, isCaregiverView: boolean }) {
    const MEDICATIONS_STORAGE_KEY = `neuro-ai-${patientId}-medications`;
    const { toast } = useToast();
    const [medications, setMedications] = useState<Medication[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [medsBeforeEdit, setMedsBeforeEdit] = useState<Medication[]>([]);

    useEffect(() => {
        const storedMeds = localStorage.getItem(MEDICATIONS_STORAGE_KEY);
        if (storedMeds) {
            try { setMedications(JSON.parse(storedMeds)); }
            catch { setMedications(initialMedications); }
        } else { setMedications(initialMedications); }
    }, [MEDICATIONS_STORAGE_KEY]);

    const saveMedications = (meds: Medication[]) => {
        localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(meds));
        setMedications(meds);
    }

    const handleMedicationChange = (index: number, field: 'name' | 'dose' | 'time', value: string) => { const updatedMeds = [...medications]; updatedMeds[index] = { ...updatedMeds[index], [field]: value }; setMedications(updatedMeds); };
    const handleAddMedication = () => { setMedications([...medications, { id: Date.now(), name: '', dose: '', time: '' }]); };
    const handleRemoveMedication = (id: number) => { setMedications(medications.filter(med => med.id !== id)); };

    const handleEdit = () => { setMedsBeforeEdit(JSON.parse(JSON.stringify(medications))); setIsEditing(true); };
    const handleSave = () => { setIsEditing(false); saveMedications(medications); toast({ title: "Medications Saved!", description: "The medication schedule has been updated." }); };
    const handleCancel = () => { setMedications(medsBeforeEdit); setIsEditing(false); };

    return (
        <Card className="shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl flex items-center gap-2"><Pill /> {isCaregiverView ? 'Manage Medications' : 'Medication'}</CardTitle>
                    <CardDescription>{isCaregiverView ? "Edit the patient's medication schedule." : 'Your daily medication schedule.'}</CardDescription>
                </div>
                {!isEditing && <Button variant="outline" size="icon" onClick={handleEdit}><Edit className="h-4 w-4" /></Button>}
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-4">
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
                            <Button variant="ghost" onClick={handleCancel}><X className="mr-2 h-4 w-4"/>Cancel</Button>
                            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/>Save Medications</Button>
                        </div>
                    </div>
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
                        {medications.length === 0 && <p className="text-muted-foreground text-center p-4">No medications scheduled.</p>}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
