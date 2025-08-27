import Link from "next/link";

const AppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
        <path d="M12 2a10 10 0 0 0-10 10c0 5 4.5 9 10 9s10-4 10-9A10 10 0 0 0 12 2Z"/>
        <path d="M12 12a5 5 0 0 0-5 5"/>
        <path d="M12 7a5 5 0 0 1 5 5"/>
    </svg>
)


export function AppHeader({ role }: { role: 'Patient' | 'Caregiver' }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <AppIcon />
          <span className="font-headline">Neuro-AI</span>
        </Link>
        <div className="ml-auto">
          <span className="font-medium text-muted-foreground">{role} View</span>
        </div>
      </div>
    </header>
  );
}
