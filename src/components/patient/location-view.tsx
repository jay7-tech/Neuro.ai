
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { patient } from '@/lib/data';

export function LocationView() {
    return (
        <div className="flex justify-center">
            <Card className="w-full max-w-4xl shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-bold font-headline flex items-center justify-center gap-3"><MapPin className="h-10 w-10 text-primary" /> My Location</CardTitle>
                    <CardDescription className="text-lg">This is your current location and home address.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="aspect-video w-full rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg">
                     <Image src="https://picsum.photos/1200/800" width={1200} height={800} data-ai-hint="street map" alt="Map of patient location" className="w-full h-full object-cover" />
                   </div>
                   <div className="text-center p-6 bg-accent/50 rounded-xl border">
                        <h3 className="text-xl font-semibold text-muted-foreground">Your Home Address Is:</h3>
                        <p className="text-2xl font-bold mt-2">{patient.address}</p>
                   </div>
                </CardContent>
            </Card>
        </div>
    )
}
