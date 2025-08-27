import { AppHeader } from "@/components/app/header";
import { ProfileView } from "@/components/patient/profile-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-background">
            <AppHeader role="Patient" />
            <main className="container mx-auto">
                <div className="p-4 md:p-8">
                    <Link href="/patient" passHref>
                        <Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
                    </Link>
                    <ProfileView />
                </div>
            </main>
        </div>
    )
}
