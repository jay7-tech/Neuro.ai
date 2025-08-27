'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, MapPin, Droplets, Calendar, Stethoscope, Phone, Settings, Shield } from 'lucide-react';

const patient = {
    name: 'John Doe',
    id: 'P-12345XYZ',
    photo: 'https://picsum.photos/200/200',
    age: 78,
    bloodGroup: 'O+',
    address: '123 Memory Lane, Suite 101, Sunnyvale, CA 94086',
    medicalInfo: 'Mild cognitive impairment. Allergic to penicillin.',
    caregivers: [
        { name: 'Jane Smith', relation: 'Primary Caregiver', phone: '555-0101' },
        { name: 'Dr. Emily White', relation: 'Neurologist', phone: '555-0102' },
    ],
    family: [
        { name: 'Peter Doe', relation: 'Son', phone: '555-0103' },
        { name: 'Mary Doe', relation: 'Daughter', phone: '555-0104' },
    ],
};


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
                        className="rounded-full border-4 border-primary"
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
                            <div className="flex items-start gap-4">
                                <Calendar className="h-6 w-6 text-muted-foreground mt-1" />
                                <div><strong>Age:</strong> {patient.age}</div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Droplets className="h-6 w-6 text-muted-foreground mt-1" />
                                <div><strong>Blood Group:</strong> {patient.bloodGroup}</div>
                            </div>
                            <div className="flex items-start gap-4">
                                <MapPin className="h-6 w-6 text-muted-foreground mt-1" />
                                <div><strong>Address:</strong> {patient.address}</div>
                            </div>
                            <div className="flex items-start gap-4">
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
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {patient.caregivers.map((contact, index) => (
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

                <TabsContent value="family" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Family Members Contact</CardTitle>
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
                            <p className="text-muted-foreground">Settings related to the app would be displayed here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
