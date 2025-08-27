import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <main className="container flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 shadow-2xl rounded-xl">
          <CardHeader className="text-center p-8">
            <CardTitle className="text-4xl font-headline tracking-tight">Dementia Assistant AI</CardTitle>
            <CardDescription className="text-lg pt-2">Welcome. Please select your role to continue.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-8 pt-0">
            <Link href="/patient" asChild>
              <Button variant="outline" size="lg" className="w-full h-28 text-xl rounded-lg">
                <User className="mr-4 h-10 w-10" />
                I&apos;m a Patient
              </Button>
            </Link>
            <Link href="/caregiver" asChild>
              <Button size="lg" className="w-full h-28 text-xl bg-primary hover:bg-primary/90 rounded-lg">
                <Users className="mr-4 h-10 w-10" />
                I&apos;m a Caregiver
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
