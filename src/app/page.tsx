
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Lock } from 'lucide-react';

const AppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-primary">
        <path d="M12 2a10 10 0 0 0-10 10c0 5 4.5 9 10 9s10-4 10-9A10 10 0 0 0 12 2Z"/>
        <path d="M12 12a5 5 0 0 0-5 5"/>
        <path d="M12 7a5 5 0 0 1 5 5"/>
    </svg>
)

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
        toast({
            title: "All fields are required",
            description: "Please enter your email and password.",
            variant: "destructive",
        });
        setLoading(false);
        return;
    }

    // This is a mock authentication/routing logic.
    // In a real app, you would have a proper backend authentication.
    setTimeout(() => {
        toast({ title: "Login Successful", description: "Redirecting to role selection..." });
        router.push('/selection');
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <main className="container flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto shadow-2xl rounded-2xl overflow-hidden border-primary/20">
          <CardHeader className="text-center p-8 bg-card">
             <div className="flex justify-center items-center mb-4">
               <AppIcon />
             </div>
            <CardTitle className="text-4xl font-extrabold tracking-tight lg:text-5xl">Welcome to Neuro-AI</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">Sign in or create an account to continue.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 bg-secondary/30">
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">Email Address</Label>
                    <Input 
                        id="email"
                        type="email"
                        placeholder="patient@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="h-12 text-base"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="password" className="text-base">Password</Label>
                    <Input 
                        id="password"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="h-12 text-base"
                    />
                </div>
                <Button type="submit" size="lg" className="w-full h-12 text-lg" disabled={loading}>
                    {loading ? 'Signing in...' : 'Continue'}
                    {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
