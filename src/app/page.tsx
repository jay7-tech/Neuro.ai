import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User } from "lucide-react";
import Link from "next/link";

const AppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-primary">
        <path d="M12 2a10 10 0 0 0-10 10c0 5 4.5 9 10 9s10-4 10-9A10 10 0 0 0 12 2Z"/>
        <path d="M12 12a5 5 0 0 0-5 5"/>
        <path d="M12 7a5 5 0 0 1 5 5"/>
    </svg>
)

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <main className="container flex items-center justify-center">
        <Card className="w-full max-w-lg mx-auto shadow-2xl rounded-2xl overflow-hidden border-primary/20">
          <CardHeader className="text-center p-8 bg-card">
             <div className="flex justify-center items-center mb-4">
               <AppIcon />
             </div>
            <CardTitle className="text-4xl font-extrabold tracking-tight lg:text-5xl">Neuro-AI</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">Please select your role to get started.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 p-8 bg-secondary/30">
            <Button asChild variant="outline" size="lg" className="flex-1 w-full h-32 text-xl rounded-xl shadow-lg transition-transform hover:scale-105">
              <Link href="/patient">
                <User className="mr-4 h-10 w-10" />
                I'm a Patient
              </Link>
            </Button>
            <Button asChild size="lg" className="flex-1 w-full h-32 text-xl bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-transform hover:scale-105">
              <Link href="/caregiver">
                <Users className="mr-4 h-10 w-10" />
                I'm a Caregiver
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
