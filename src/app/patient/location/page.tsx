
import { AppHeader } from "@/components/app/header";
import { LocationView } from "@/components/patient/location-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LocationPage() {
    return (
        <div className="min-h-screen bg-background">
            <AppHeader role="Patient" />
            <main className="container mx-auto">
                <div className="p-4 md:p-8">
                    <Link href="/patient" passHref>
                        <Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
                    </Link>
                    <LocationView />
                </div>
            </main>
        </div>
    )
}
