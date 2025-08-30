
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, MapPin, Droplets, Calendar, Stethoscope, Phone, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { patient } from '@/lib/data';


export function ProfileView() {
    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <Image
                        src={patient.photo}
                        alt="Patient photo"
                        width={150}
                        height={150}
                        className="rounded-full border-4 border-primary shadow-lg"
                        data-ai-hint="person portrait"
                    />
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold font-headline">{patient.name}</h1>
                        <p className="text-lg text-muted-foreground">Patient ID: {patient.id}</p>
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
                            <div className="flex items-start gap-4 p-3 border-b">
                                <Calendar className="h-6 w-6 text-muted-foreground mt-1" />
                                <div><strong>Age:</strong> {patient.age}</div>
                            </div>
                            <div className="flex items-start gap-4 p-3 border-b">
                                <Droplets className="h-6 w-6 text-muted-foreground mt-1" />
                                <div><strong>Blood Group:</strong> {patient.bloodGroup}</div>
                            </div>
                            <div className="flex items-start gap-4 p-3 border-b">
                                <MapPin className="h-6 w-6 text-muted-foreground mt-1" />
                                <div><strong>Address:</strong> {patient.address}</div>
                            </div>
                            <div className="flex items-start gap-4 p-3">
                                <Shield className="h-6 w-6 text-muted-foreground mt-1" />
                                <div><strong>Medical Info:</strong> {patient.medicalInfo}</div>
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
                            <CardDescription>Manage your application settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Settings related to the app, such as notifications, theme, and language, would be displayed here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
