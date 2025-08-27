import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, BrainCircuit } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <main className="container flex items-center justify-center">
        <Card className="w-full max-w-lg mx-auto shadow-2xl rounded-2xl overflow-hidden border-primary/20">
          <CardHeader className="text-center p-8 bg-card">
             <div className="flex justify-center items-center mb-4">
               <BrainCircuit className="h-16 w-16 text-primary"/>
             </div>
            <CardTitle className="text-4xl font-extrabold tracking-tight lg:text-5xl">Dementia Assistant AI</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">Please select your role to get started.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 p-8 bg-secondary/30">
            <Link href="/patient" passHref className="flex-1">
              <Button variant="outline" size="lg" className="w-full h-32 text-xl rounded-xl shadow-lg transition-transform hover:scale-105">
                <User className="mr-4 h-10 w-10" />
                I'm a Patient
              </Button>
            </Link>
            <Link href="/caregiver" passHref className="flex-1">
              <Button size="lg" className="w-full h-32 text-xl bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-transform hover:scale-105">
                <Users className="mr-4 h-10 w-10" />
                I'm a Caregiver
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
