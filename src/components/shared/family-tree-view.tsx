
'use client';
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initialFamilyMembers } from "@/lib/data";
import { Users, Heart, PlusCircle, Edit, Save, X, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import images from "@/lib/placeholder-images.json";

export type FamilyMember = {
    id: number;
    name: string;
    relation: string;
    photo: string;
    message: string;
    hint: string;
};

function EditFamilyMemberView({ 
    member, 
    onSave, 
    onCancel, 
    onDelete,
}: { 
    member: FamilyMember;
    onSave: (member: FamilyMember) => void;
    onCancel: () => void;
    onDelete: (id: number) => void;
}) {
    const [currentMember, setCurrentMember] = useState(member);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveClick = () => {
        onSave(currentMember);
    };
    
    const handleFieldChange = (field: keyof FamilyMember, value: string) => {
        setCurrentMember(prev => ({...prev, [field]: value}));
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleFieldChange('photo', reader.result as string)
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto shadow-2xl">
            <CardHeader>
                <CardTitle>{member.name ? `Edit ${member.name}`: "Add New Family Member"}</CardTitle>
                <CardDescription>Update the details for the family member.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="aspect-square w-full rounded-lg overflow-hidden border mx-auto max-w-sm">
                    <Image src={currentMember.photo} alt="Family member photo" width={400} height={400} className="w-full h-full object-cover" data-ai-hint={currentMember.hint} />
                </div>
                <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Change Photo
                </Button>
                
                <div className="space-y-2">
                    <label htmlFor="name">Name</label>
                    <Input id="name" value={currentMember.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="relation">Relation</label>
                    <Input id="relation" value={currentMember.relation} onChange={(e) => handleFieldChange('relation', e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <label htmlFor="hint">Image Hint</label>
                    <Input id="hint" value={currentMember.hint} onChange={(e) => handleFieldChange('hint', e.target.value)} />
                </div>

                <div>
                    <label htmlFor="message">Message or Memory</label>
                    <Textarea
                        id="message"
                        value={currentMember.message}
                        onChange={(e) => handleFieldChange('message', e.target.value)}
                        placeholder="A special message or memory..."
                        rows={3}
                        className="text-base"
                    />
                </div>
                <div className="flex justify-between pt-4">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this family member.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(member.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                        <Button onClick={handleSaveClick}><Save className="mr-2 h-4 w-4" /> Save</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


export function FamilyTreeView({ isCaregiverView = false, patientId }: { isCaregiverView?: boolean, patientId: string }) {
    const FAMILY_TREE_STORAGE_KEY = `neuro-ai-${patientId}-family-tree`;
    const { toast } = useToast();
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

    useEffect(() => {
        const storedData = localStorage.getItem(FAMILY_TREE_STORAGE_KEY);
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                if (Array.isArray(parsedData)) {
                    setFamilyMembers(parsedData);
                } else {
                     setFamilyMembers(initialFamilyMembers);
                }
            } catch {
                setFamilyMembers(initialFamilyMembers);
            }
        } else {
            setFamilyMembers(initialFamilyMembers);
        }
    }, [FAMILY_TREE_STORAGE_KEY]);

    const saveFamilyTree = (newFamilyTree: FamilyMember[], oldFamilyTreeState?: FamilyMember[]) => {
        try {
            localStorage.setItem(FAMILY_TREE_STORAGE_KEY, JSON.stringify(newFamilyTree));
            setFamilyMembers(newFamilyTree);
        } catch (error) {
             if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                 toast({
                    title: "Failed to Save",
                    description: "The photo you uploaded is too large. Please choose a smaller file.",
                    variant: "destructive",
                });
                if(oldFamilyTreeState) setFamilyMembers(oldFamilyTreeState);
            } else {
                toast({
                    title: "An unexpected error occurred.",
                    description: "Your changes could not be saved.",
                    variant: "destructive",
                });
                if(oldFamilyTreeState) setFamilyMembers(oldFamilyTreeState);
            }
        }
    };

    const handleAddNew = () => {
        const newMember: FamilyMember = {
            id: Date.now(),
            name: "",
            relation: "",
            photo: images.family.newMember.src,
            message: "",
            hint: images.family.newMember.hint
        };
        setEditingMember(newMember);
    };

    const handleSave = (memberToSave: FamilyMember) => {
        const oldFamilyMembers = [...familyMembers];
        let newFamilyMembers;

        const memberIndex = familyMembers.findIndex(m => m.id === memberToSave.id);

        if (memberIndex > -1) {
            newFamilyMembers = [...familyMembers];
            newFamilyMembers[memberIndex] = memberToSave;
        } else {
            newFamilyMembers = [memberToSave, ...familyMembers];
        }
        
        saveFamilyTree(newFamilyMembers, oldFamilyMembers);
        setEditingMember(null);
        toast({ title: "Family Member Saved!", description: "The family member's details have been saved." });
    };

    const handleDelete = (id: number) => {
        const newFamilyMembers = familyMembers.filter(m => m.id !== id);
        saveFamilyTree(newFamilyMembers);
        setEditingMember(null);
        toast({ title: "Family Member Deleted", variant: "destructive" });
    };
    
    if (editingMember) {
        return <EditFamilyMemberView 
            member={editingMember} 
            onSave={handleSave} 
            onCancel={() => setEditingMember(null)} 
            onDelete={handleDelete}
        />;
    }

    return (
        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl font-bold font-headline flex items-center gap-3">
                            <Users /> {isCaregiverView ? "Manage Family Tree" : "My Family"}
                        </CardTitle>
                        <CardDescription className="text-lg">
                            {isCaregiverView ? "Add or edit the patient's family members." : "The people who love you most."}
                        </CardDescription>
                    </div>
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Member
                    </Button>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
                {familyMembers.map(member => (
                    <Card key={member.id} className="shadow-xl rounded-2xl overflow-hidden border relative group">
                         <div className="aspect-square w-full overflow-hidden">
                            <Image src={member.photo} alt={member.name} width={400} height={400} className="w-full h-full object-cover" data-ai-hint={member.hint} />
                        </div>
                        <div className="p-6">
                            <CardHeader className="p-0">
                                <CardTitle className="text-2xl">{member.name}</CardTitle>
                                <CardDescription className="text-md flex items-center gap-2">
                                    <Heart className="text-destructive h-4 w-4" /> {member.relation}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 pt-4">
                                <blockquote className="text-base italic border-l-4 pl-4">
                                    {member.message}
                                </blockquote>
                            </CardContent>
                        </div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="icon" onClick={() => setEditingMember(member)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
                 {familyMembers.length === 0 && (
                    <p className="text-muted-foreground text-center col-span-full py-8">
                        No family members have been added yet. Click "Add Member" to begin.
                    </p>
                )}
            </div>
        </div>
    )
}

    