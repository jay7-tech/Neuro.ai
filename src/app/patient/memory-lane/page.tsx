
import { AppHeader } from "@/components/app/header";
import { MemoryLaneView } from "@/components/shared/memory-lane-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { patient } from "@/lib/data";


export default function MemoryLanePage() {
    // In a real app with authentication, you'd get the patient ID from the session.
    // For this demo, we use a static ID from mock data.
    const patientId = patient.id;

    return (
        <div className="min-h-screen bg-background">
            <AppHeader role="Patient" />
            <main className="container mx-auto">
                <div className="p-4 md:p-8">
                    <Link href="/patient" passHref>
                        <Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
                    </Link>
                    <MemoryLaneView patientId={patientId} />
                </div>
            </main>
        </div>
    )
}
