import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export function AppHeader({ role }: { role: 'Patient' | 'Caregiver' }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-headline">Dementia Assistant AI</span>
        </Link>
        <div className="ml-auto">
          <span className="font-medium text-muted-foreground">{role} View</span>
        </div>
      </div>
    </header>
  );
}
