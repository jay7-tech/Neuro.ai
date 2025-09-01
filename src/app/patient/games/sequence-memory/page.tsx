
import { AppHeader } from "@/components/app/header";
import { SequenceMemoryGame } from "@/components/patient/sequence-memory-game";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SequenceMemoryPage() {
    return (
        <div className="min-h-screen bg-background">
            <AppHeader role="Patient" />
            <main className="container mx-auto">
                <div className="p-4 md:p-8">
                     <Link href="/patient/games" passHref>
                        <Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Games</Button>
                    </Link>
                    <SequenceMemoryGame />
                </div>
            </main>
        </div>
    )
}
