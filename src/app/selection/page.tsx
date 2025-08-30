
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield } from 'lucide-react';
import { AppHeader } from '@/components/app/header';

export default function SelectionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                    <path d="M12 2a10 10 0 0 0-10 10c0 5 4.5 9 10 9s10-4 10-9A10 10 0 0 0 12 2Z"/>
                    <path d="M12 12a5 5 0 0 0-5 5"/>
                    <path d="M12 7a5 5 0 0 1 5 5"/>
                </svg>
                <span className="font-headline">Neuro-AI</span>
            </Link>
        </div>
      </header>
      <div className="flex items-center justify-center p-4" style={{minHeight: 'calc(100vh - 64px)'}}>
        <main className="container flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">Choose Your Role</h1>
          <p className="text-lg text-muted-foreground mb-12">Please select which dashboard you would like to proceed to.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <Link href="/patient" className="flex">
                <Card className="w-full hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-8 rounded-2xl">
                    <User className="h-20 w-20 text-primary mb-6" />
                    <CardTitle className="text-3xl">Patient</CardTitle>
                    <CardDescription className="mt-2 text-base">Access your personal dashboard, cognitive games, and daily plan.</CardDescription>
                </Card>
            </Link>
            <Link href="/caregiver" className="flex">
                <Card className="w-full hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-8 rounded-2xl">
                    <Shield className="h-20 w-20 text-primary mb-6" />
                    <CardTitle className="text-3xl">Caregiver</CardTitle>
                    <CardDescription className="mt-2 text-base">Access patient monitoring, care coordination, and daily planning tools.</CardDescription>
                </Card>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
