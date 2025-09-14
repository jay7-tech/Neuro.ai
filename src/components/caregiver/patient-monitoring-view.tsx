
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, Map, Info, AlertTriangle, Smile } from "lucide-react";
import Image from "next/image";
import { MoodChart } from "../shared/mood-chart";
import { useEffect, useState } from "react";
import { mockPatientLocation, type PatientLocation } from "@/lib/data";

export function PatientMonitoringView({ patientId }: { patientId: string }) {
    const [patientLocation, setPatientLocation] = useState<PatientLocation | null>(null);

    useEffect(() => {
        // In a real app, this would be a subscription to a location service.
        // For this demo, we'll just load the mock data.
        setPatientLocation(mockPatientLocation);
    }, [])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Patient Monitoring</h1>
            <p className="text-muted-foreground">View patient alerts, mood, and location information.</p>
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell /> Recent Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {patientLocation?.status === 'away' ? (
                             <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Patient Away From Home</AlertTitle>
                                <AlertDescription>
                                    The patient is currently outside of the designated safe zone. Last seen at: {patientLocation.address}.
                                </AlertDescription>
                            </Alert>
                        ) : (
                             <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>All Clear</AlertTitle>
                                <AlertDescription>
                                    There are no new alerts from the patient.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Map /> Patient Location</CardTitle>
                        <CardDescription>
                             {patientLocation?.status === 'home' ? 'Patient is currently at home.' : 'Patient is currently away.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       <div className="aspect-video w-full rounded-lg overflow-hidden border">
                         <Image 
                            src={patientLocation?.mapImage || "https://picsum.photos/800/600"} 
                            width={800} 
                            height={600} 
                            data-ai-hint="street map" 
                            alt="Map of patient location" 
                            className="w-full h-full object-cover" 
                         />
                       </div>
                       <p className="text-sm text-muted-foreground pt-2">Last updated: {patientLocation?.lastUpdated}.</p>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Smile /> Patient Mood Log</CardTitle>
                        <CardDescription>A log of the patient's self-reported mood over the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <MoodChart patientId={patientId} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
