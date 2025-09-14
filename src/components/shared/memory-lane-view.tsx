
'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Edit, Save, X, Album, Upload } from "lucide-react";
import Image from "next/image";
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


const initialMemories = [
    {
        id: 1,
        image: "https://picsum.photos/seed/family1/600/400",
        story: "This photo was taken during our family trip to the beach in 2012. Remember how much fun we had building sandcastles? The sun was warm and the ocean was so blue.",
        hint: "family beach"
    },
    {
        id: 2,
        image: "https://picsum.photos/seed/family2/600/400",
        story: "This was at Grandma's 70th birthday party. All the family was there, and we had that amazing chocolate cake.",
        hint: "birthday party"
    },
];

type Memory = {
    id: number;
    image: string;
    story: string;
    hint: string;
};


export function MemoryLaneView({ isCaregiverView = false, patientId }: { isCaregiverView?: boolean, patientId: string }) {
    const MEMORIES_STORAGE_KEY = `neuro-ai-${patientId}-memories`;
    const { toast } = useToast();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

     useEffect(() => {
        const storedData = localStorage.getItem(MEMORIES_STORAGE_KEY);
        if (storedData) {
            try {
                setMemories(JSON.parse(storedData));
            } catch {
                setMemories(initialMemories);
            }
        } else {
            setMemories(initialMemories);
        }
    }, [MEMORIES_STORAGE_KEY]);

    const saveMemories = (newMemories: Memory[], oldMemoriesState?: Memory[]) => {
        setMemories(newMemories);
        try {
            localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(newMemories));
        } catch (error) {
             if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                 toast({
                    title: "Failed to Save Memory",
                    description: "The photo you uploaded is too large. Please choose a smaller file.",
                    variant: "destructive",
                });
                if(oldMemoriesState) setMemories(oldMemoriesState);

            } else {
                toast({
                    title: "An unexpected error occurred.",
                    description: "Your memory could not be saved.",
                    variant: "destructive",
                });
                 if(oldMemoriesState) setMemories(oldMemoriesState);
            }
        }
    }

    const handleAddNew = () => {
        const newMemory: Memory = {
            id: Date.now(),
            image: "https://picsum.photos/600/400",
            story: "",
            hint: "new memory"
        };
        setEditingMemory(newMemory);
    };

    const handleSave = (memoryToSave: Memory) => {
        const oldMemories = [...memories];
        let newMemories;
        const index = memories.findIndex(m => m.id === memoryToSave.id);
        
        if (index > -1) {
            newMemories = [...memories];
            newMemories[index] = memoryToSave;
        } else {
            newMemories = [memoryToSave, ...memories];
        }
        
        saveMemories(newMemories, oldMemories);
        setEditingMemory(null);
        toast({ title: "Memory Saved!", description: "Your precious memory has been saved." });
    };

    const handleDelete = (id: number) => {
        const newMemories = memories.filter(m => m.id !== id);
        saveMemories(newMemories);
        setEditingMemory(null);
        toast({ title: "Memory Deleted", description: "The memory has been removed from your album.", variant: "destructive" });
    };

    if (editingMemory) {
        return <EditMemoryView memory={editingMemory} onSave={handleSave} onCancel={() => setEditingMemory(null)} />;
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl font-bold font-headline flex items-center gap-3"><Album /> {isCaregiverView ? "Manage Memories" : "Memory Lane"}</CardTitle>
                        <CardDescription className="text-lg">{isCaregiverView ? "Add or edit memories for the patient." : "A collection of your cherished moments."}</CardDescription>
                    </div>
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Memory
                    </Button>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {memories.map(memory => (
                    <Card key={memory.id} className="flex flex-col shadow-xl rounded-2xl overflow-hidden">
                        <div className="aspect-video w-full overflow-hidden">
                            <Image src={memory.image} alt="Memory" width={600} height={400} className="w-full h-full object-cover" data-ai-hint={memory.hint} />
                        </div>
                        <CardContent className="p-6 flex-grow flex flex-col">
                            <p className="text-base flex-grow mb-4">{memory.story}</p>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="icon" onClick={() => setEditingMemory(memory)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this memory.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(memory.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                            </div>
                        </CardContent>
                    </Card>
                ))}
                {memories.length === 0 && <p className="text-muted-foreground text-center col-span-full">No memories yet. Click "Add New Memory" to create one.</p>}
            </div>
        </div>
    );
}


function EditMemoryView({ memory, onSave, onCancel }: { memory: Memory, onSave: (memory: Memory) => void, onCancel: () => void }) {
    const [currentMemory, setCurrentMemory] = useState(memory);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveClick = () => {
        onSave(currentMemory);
    };

    const handleFieldChange = (field: keyof Omit<Memory, 'id'>, value: string) => {
        setCurrentMemory(prev => ({...prev, [field]: value}));
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleFieldChange('image', reader.result as string)
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto shadow-2xl">
            <CardHeader>
                <CardTitle>{memory.story ? "Edit Your Memory" : "Add a New Memory"}</CardTitle>
                <CardDescription>Share the story behind the photo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="aspect-video w-full rounded-lg overflow-hidden border">
                    <Image src={currentMemory.image} alt="Memory" width={600} height={400} className="w-full h-full object-cover" />
                </div>
                <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Change Photo
                </Button>
                <div>
                    <label htmlFor="story" className="font-semibold mb-2 block">Your Story</label>
                    <Textarea
                        id="story"
                        value={currentMemory.story}
                        onChange={(e) => handleFieldChange('story', e.target.value)}
                        placeholder="What's the story behind this photo?"
                        rows={5}
                        className="text-base"
                    />
                </div>
                 <div>
                    <label htmlFor="hint" className="font-semibold mb-2 block">Image Hint</label>
                    <Input
                        id="hint"
                        value={currentMemory.hint}
                        onChange={(e) => handleFieldChange('hint', e.target.value)}
                        placeholder="e.g., family beach"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={onCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                    <Button onClick={handleSaveClick}><Save className="mr-2 h-4 w-4" /> Save Memory</Button>
                </div>
            </CardContent>
        </Card>
    );
}
