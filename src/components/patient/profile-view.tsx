
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, MapPin, Droplets, Calendar, Stethoscope, Phone, Settings, Shield, Bell, Languages, Baseline, Pencil, Save, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { patient as initialPatient } from '@/lib/data';
import { useState, useEffect, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';

const PATIENT_STORAGE_KEY = 'neuro-ai-patient-data';

export function ProfileView() {
    const { toast } = useToast();
    const [patient, setPatient] = useState(initialPatient);
    const [isEditing, setIsEditing] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState('en');
    const [textSize, setTextSize] = useState(16);
    const fileInputRef = useRef<HTMLInputElement>(null);

     useEffect(() => {
        const storedData = localStorage.getItem(PATIENT_STORAGE_KEY);
        if (storedData) {
            setPatient(JSON.parse(storedData));
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDark]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.style.fontSize = `${textSize}px`;
    }, [textSize]);
    
    const handleFieldChange = (field: keyof typeof patient, value: any) => {
        setPatient(prev => ({...prev, [field]: value}));
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


    const handleSave = () => {
        localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(patient));
        setIsEditing(false);
        toast({
            title: "Profile Saved",
            description: "Your changes have been saved successfully.",
        });
    }

    const handleCancel = () => {
        const storedData = localStorage.getItem(PATIENT_STORAGE_KEY);
        if (storedData) {
            setPatient(JSON.parse(storedData));
        } else {
            setPatient(initialPatient);
        }
        setIsEditing(false);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <Image
                            src={patient.photo}
                            alt="Patient photo"
                            width={150}
                            height={150}
                            className="rounded-full border-4 border-primary shadow-lg"
                            data-ai-hint="person portrait"
                        />
                         {isEditing && (
                            <>
                                <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" /> Change Photo
                                </Button>
                            </>
                        )}
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-4xl font-bold font-headline">{patient.name}</h1>
                        <p className="text-lg text-muted-foreground">Patient ID: {patient.id}</p>
                    </div>
                    <div>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
                                <Button onClick={handleCancel} variant="outline"><X className="mr-2 h-4 w-4"/>Cancel</Button>
                            </div>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}><Pencil className="mr-2 h-4 w-4" /> Edit Profile</Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="personal">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal"><User className="mr-2 h-4 w-4" />Personal</TabsTrigger>
                    <TabsTrigger value="caregivers"><Stethoscope className="mr-2 h-4 w-4" />Caregivers</TabsTrigger>
                    <TabsTrigger value="family"><Users className="mr-2 h-4 w-4" />Family</TabsTrigger>
                    <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-lg">
                             <div className="flex items-center gap-4 p-3 border-b">
                                <User className="h-6 w-6 text-muted-foreground mt-1" />
                                <Label htmlFor="name" className="w-32 font-bold">Name</Label>
                                {isEditing ? <Input id="name" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})}/> : <div>{patient.name}</div>}
                            </div>
                            <div className="flex items-center gap-4 p-3 border-b">
                                <Calendar className="h-6 w-6 text-muted-foreground mt-1" />
                                <Label htmlFor="age" className="w-32 font-bold">Age</Label>
                                {isEditing ? <Input id="age" type="number" value={patient.age} onChange={e => setPatient({...patient, age: parseInt(e.target.value, 10)})}/> : <div>{patient.age}</div>}
                            </div>
                            <div className="flex items-center gap-4 p-3 border-b">
                                <Droplets className="h-6 w-6 text-muted-foreground mt-1" />
                                <Label htmlFor="bloodGroup" className="w-32 font-bold">Blood Group</Label>
                                {isEditing ? <Input id="bloodGroup" value={patient.bloodGroup} onChange={e => setPatient({...patient, bloodGroup: e.target.value})}/> : <div>{patient.bloodGroup}</div>}
                            </div>
                            <div className="flex items-center gap-4 p-3 border-b">
                                <MapPin className="h-6 w-6 text-muted-foreground mt-1" />
                                <Label htmlFor="address" className="w-32 font-bold">Address</Label>
                                {isEditing ? <Textarea id="address" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})}/> : <div>{patient.address}</div>}
                            </div>
                            <div className="flex items-start gap-4 p-3">
                                <Shield className="h-6 w-6 text-muted-foreground mt-1" />
                                <Label htmlFor="medicalInfo" className="w-32 font-bold">Medical Info</Label>
                                {isEditing ? <Textarea id="medicalInfo" value={patient.medicalInfo} onChange={e => setPatient({...patient, medicalInfo: e.target.value})} /> : <div>{patient.medicalInfo}</div>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="caregivers" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Caregivers Contact</CardTitle>
                            <CardDescription>Your primary medical and support contacts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {patient.caregivers.map((contact, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-accent/30">
                                    <div>
                                        <p className="font-bold text-lg">{contact.name}</p>
                                        <p className="text-muted-foreground">{contact.relation}</p>
                                    </div>
                                    <Button variant="outline"><Phone className="mr-2 h-4 w-4" />{contact.phone}</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="family" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Family Members Contact</CardTitle>
                            <CardDescription>Your personal and emergency contacts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {patient.family.map((contact, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-bold text-lg">{contact.name}</p>
                                        <p className="text-muted-foreground">{contact.relation}</p>
                                    </div>
                                    <Button variant="outline"><Phone className="mr-2 h-4 w-4" />{contact.phone}</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>Manage your application settings and preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <Label htmlFor="dark-mode" className="flex items-center gap-3 text-lg">
                                    <Settings className="h-6 w-6" />
                                    Dark Mode
                                </Label>
                                <Switch id="dark-mode" checked={isDark} onCheckedChange={setIsDark} />
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <Label htmlFor="notifications" className="flex items-center gap-3 text-lg">
                                    <Bell className="h-6 w-6" />
                                    Enable Notifications
                                </Label>
                                <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                            </div>
                             <div className="flex items-center justify-between p-4 border rounded-lg">
                                <Label htmlFor="language" className="flex items-center gap-3 text-lg">
                                    <Languages className="h-6 w-6" />
                                    Language
                                </Label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger id="language" className="w-[180px]">
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="es">Español</SelectItem>
                                        <SelectItem value="fr">Français</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-4 p-4 border rounded-lg">
                                 <Label htmlFor="text-size" className="flex items-center gap-3 text-lg">
                                    <Baseline className="h-6 w-6" />
                                    Text Size
                                </Label>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm">Small</span>
                                    <Slider
                                        id="text-size"
                                        min={12}
                                        max={20}
                                        step={1}
                                        value={[textSize]}
                                        onValueChange={(value) => setTextSize(value[0])}
                                    />
                                    <span className="text-sm">Large</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
