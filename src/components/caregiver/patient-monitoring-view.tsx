import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, Map, Info } from "lucide-react";
import Image from "next/image";

export function PatientMonitoringView() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Patient Monitoring</h1>
            <p className="text-muted-foreground">View patient alerts and location information.</p>
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell /> Recent Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>All Clear</AlertTitle>
                            <AlertDescription>
                                There are no new alerts from the patient.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Map /> Patient Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       <div className="aspect-video w-full rounded-lg overflow-hidden border">
                         <Image src="https://picsum.photos/800/600" width={800} height={600} data-ai-hint="street map" alt="Map of patient location" className="w-full h-full object-cover" />
                       </div>
                       <p className="text-sm text-muted-foreground pt-2">Last updated: 2 minutes ago. Patient is at home.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
