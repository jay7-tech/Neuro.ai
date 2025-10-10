
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Music, Edit, Save, X } from 'lucide-react';

type MusicItem = {
    id: number;
    name: string;
}

const initialMusic: MusicItem[] = [
    { id: 1, name: "Calm Piano" },
    { id: 2, name: "Ocean Waves" },
    { id: 3, name: "Gentle Wind" },
];

export function MusicManager({ patientId }: { patientId: string }) {
    const MUSIC_STORAGE_KEY = `neuro-ai-${patientId}-music`;
    const { toast } = useToast();
    const [musicList, setMusicList] = useState<MusicItem[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [musicBeforeEdit, setMusicBeforeEdit] = useState<MusicItem[]>([]);

    useEffect(() => {
        const storedMusic = localStorage.getItem(MUSIC_STORAGE_KEY);
        if (storedMusic) {
            try { setMusicList(JSON.parse(storedMusic)); } 
            catch { setMusicList(initialMusic); }
        } else { setMusicList(initialMusic); }
    }, [MUSIC_STORAGE_KEY]);

    const saveMusicList = (music: MusicItem[]) => {
        localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(music));
        setMusicList(music);
    }

    const handleMusicChange = (index: number, value: string) => { const updatedMusic = [...musicList]; updatedMusic[index] = { ...updatedMusic[index], name: value }; setMusicList(updatedMusic); };
    const handleAddMusicItem = () => { setMusicList([...musicList, { id: Date.now(), name: 'New Song or Sound' }]); };
    const handleRemoveMusicItem = (id: number) => { setMusicList(musicList.filter(item => item.id !== id)); };

    const handleEdit = () => { setMusicBeforeEdit(JSON.parse(JSON.stringify(musicList))); setIsEditing(true); };
    const handleSave = () => { setIsEditing(false); saveMusicList(musicList); toast({ title: "Music List Saved!", description: "The patient's music list has been updated." }); };
    const handleCancel = () => { setMusicList(musicBeforeEdit); setIsEditing(false); };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manage Music Therapy</CardTitle>
                    <CardDescription>Add, edit, or remove songs and sounds from the patient's list.</CardDescription>
                </div>
                {!isEditing && <Button variant="outline" size="icon" onClick={handleEdit}><Edit className="h-4 w-4" /></Button>}
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-4">
                        {musicList.map((item, index) => (
                            <div key={item.id} className="flex gap-2 items-center p-2 rounded-lg bg-secondary/50">
                                <Music className="h-5 w-5 text-primary" />
                                <Input placeholder="Song or Sound Name" value={item.name} onChange={(e) => handleMusicChange(index, e.target.value)} className="bg-background font-semibold" />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveMusicItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" onClick={handleAddMusicItem} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add Song/Sound</Button>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={handleCancel}><X className="mr-2 h-4 w-4"/>Cancel</Button>
                            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/>Save Music List</Button>
                        </div>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {musicList.map(item => (
                            <li key={item.id} className="p-3 rounded-lg bg-secondary/50 flex items-center gap-3">
                                <Music className="h-5 w-5 text-primary" />
                                <p className="font-semibold">{item.name}</p>
                            </li>
                        ))}
                        {musicList.length === 0 && <p className="text-muted-foreground text-center p-4">No music or sounds added yet.</p>}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
