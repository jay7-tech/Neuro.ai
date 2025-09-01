
'use client';
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { familyTree as initialFamilyTree } from "@/lib/data";
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

type FamilyMember = {
    id: number;
    name: string;
    relation: string;
    photo: string;
    quote: string;
};

type FamilyTree = {
    spouse: FamilyMember;
    children: FamilyMember[];
};

const FAMILY_TREE_STORAGE_KEY = 'neuro-ai-family-tree';

export function FamilyTreeView() {
    const { toast } = useToast();
    const [familyTree, setFamilyTree] = useState<FamilyTree>(initialFamilyTree);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

    useEffect(() => {
        const storedData = localStorage.getItem(FAMILY_TREE_STORAGE_KEY);
        if (storedData) {
            setFamilyTree(JSON.parse(storedData));
        } else {
             // Add unique IDs to initial data if no stored data
            const initialDataWithIds = {
                spouse: { ...initialFamilyTree.spouse, id: Date.now() },
                children: initialFamilyTree.children.map((child, index) => ({ ...child, id: Date.now() + index + 1 }))
            };
            setFamilyTree(initialDataWithIds);
        }
    }, []);

    const saveFamilyTree = (newFamilyTree: FamilyTree) => {
        setFamilyTree(newFamilyTree);
        localStorage.setItem(FAMILY_TREE_STORAGE_KEY, JSON.stringify(newFamilyTree));
    };

    const handleAddNew = () => {
        const newMember: FamilyMember = {
            id: Date.now(),
            name: "",
            relation: "",
            photo: "https://picsum.photos/400/400",
            quote: ""
        };
        setEditingMember(newMember);
    };

    const handleSave = (memberToSave: FamilyMember) => {
        let isNew = true;
        let newFamilyTree: FamilyTree;

        // Check if it's the spouse
        if (familyTree.spouse.id === memberToSave.id) {
            newFamilyTree = { ...familyTree, spouse: memberToSave };
            isNew = false;
        } else {
             const childIndex = familyTree.children.findIndex(c => c.id === memberToSave.id);
             if (childIndex > -1) {
                const updatedChildren = [...familyTree.children];
                updatedChildren[childIndex] = memberToSave;
                newFamilyTree = { ...familyTree, children: updatedChildren };
                isNew = false;
             } else {
                newFamilyTree = { ...familyTree, children: [...familyTree.children, memberToSave] };
             }
        }
        
        saveFamilyTree(newFamilyTree);
        setEditingMember(null);
        toast({ title: "Family Member Saved!", description: "Your changes have been saved." });
    };

    const handleDelete = (id: number) => {
        const newFamilyTree = {
            ...familyTree,
            children: familyTree.children.filter(c => c.id !== id)
        };
        saveFamilyTree(newFamilyTree);
        toast({ title: "Family Member Deleted", variant: "destructive" });
    };

    const { spouse, children } = familyTree;
    
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
            <div className="text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-headline flex items-center justify-center md:justify-start gap-3"><Users /> My Family</h1>
                    <p className="text-lg text-muted-foreground">The people who love you most.</p>
                </div>
                 <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Member
                </Button>
            </div>
            
            <Card className="shadow-2xl rounded-2xl overflow-hidden max-w-lg mx-auto border-2 border-primary/30 relative group">
                <div className="flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-2/5">
                        <Image src={spouse.photo} alt={spouse.name} width={400} height={400} className="object-cover w-full h-full" data-ai-hint="person portrait" />
                    </div>
                    <div className="w-full md:w-3/5 p-6">
                        <CardHeader className="p-0">
                            <CardTitle className="text-3xl">{spouse.name}</CardTitle>
                            <CardDescription className="text-lg flex items-center gap-2"><Heart className="text-destructive" /> {spouse.relation}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 pt-4">
                            <blockquote className="text-base italic border-l-4 pl-4">
                                {spouse.quote}
                            </blockquote>
                        </CardContent>
                    </div>
                </div>
                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="icon" onClick={() => setEditingMember(spouse)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                {children.map(child => (
                    <Card key={child.id} className="shadow-xl rounded-2xl overflow-hidden border relative group">
                         <div className="aspect-square w-full overflow-hidden">
                            <Image src={child.photo} alt={child.name} width={400} height={400} className="w-full h-full object-cover" data-ai-hint="person portrait" />
                        </div>
                        <div className="p-6">
                            <CardHeader className="p-0">
                                <CardTitle className="text-2xl">{child.name}</CardTitle>
                                <CardDescription className="text-md">{child.relation}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 pt-4">
                                <blockquote className="text-base italic border-l-4 pl-4">
                                    {child.quote}
                                </blockquote>
                            </CardContent>
                        </div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="icon" onClick={() => setEditingMember(child)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function EditFamilyMemberView({ member, onSave, onCancel, onDelete }: { member: FamilyMember, onSave: (member: FamilyMember) => void, onCancel: () => void, onDelete: (id: number) => void }) {
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
                <CardTitle>{member.name ? `Edit ${member.name}`: "Add a New Family Member"}</CardTitle>
                <CardDescription>Update the details for your family member.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="aspect-square w-full rounded-lg overflow-hidden border mx-auto max-w-sm">
                    <Image src={currentMember.photo} alt="Family member photo" width={400} height={400} className="w-full h-full object-cover" />
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

                <div>
                    <label htmlFor="quote">Quote or Memory</label>
                    <Textarea
                        id="quote"
                        value={currentMember.quote}
                        onChange={(e) => handleFieldChange('quote', e.target.value)}
                        placeholder="A special quote or memory..."
                        rows={3}
                        className="text-base"
                    />
                </div>
                <div className="flex justify-between pt-4">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           {/* Do not show delete for the initial spouse who cannot be deleted from the data structure */}
                           { familyTree.spouse.id !== member.id && <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>}
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

    