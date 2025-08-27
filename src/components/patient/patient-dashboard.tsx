'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Pill, Puzzle, Camera, MessageSquare, Calendar, User, Bell, Sun, Moon, Utensils } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AiCompanion } from "./ai-companion";

const dailyPlan = [
  { time: '08:00 AM', task: 'Wake up and get dressed', icon: <Sun className="h-8 w-8 text-primary" /> },
  { time: '09:00 AM', task: 'Eat breakfast & take pills', icon: <Utensils className="h-8 w-8 text-primary" /> },
  { time: '10:00 AM', task: 'Morning walk', icon: <Calendar className="h-8 w-8 text-primary" /> },
  { time: '03:00 PM', task: 'Read a book', icon: <Brain className="h-8 w-8 text-primary" /> },
  { time: '08:00 PM', task: 'Prepare for bed', icon: <Moon className="h-8 w-8 text-primary" /> },
];

const memoryPrompt = {
  image: "https://picsum.photos/600/400",
  story: "This photo was taken during our family trip to the beach in 2012. Remember how much fun we had building sandcastles?",
  prompt: "What was your favorite part of that day?"
};

export function PatientDashboard() {
  const patientId = "P-12345XYZ";

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <User className="h-8 w-8"/> Welcome Back!
            </CardTitle>
            <CardDescription className="text-base">Your Patient ID for linking with a caregiver is: <span className="font-bold text-foreground">{patientId}</span></CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tools to Help</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/patient/games" asChild>
              <Button variant="outline" className="flex flex-col h-32 w-full text-center text-lg rounded-lg">
                <Puzzle className="h-10 w-10 mb-2 mx-auto" />
                Cognitive Games
              </Button>
            </Link>
            <Link href="/patient/med-identifier" asChild>
              <Button variant="outline" className="flex flex-col h-32 w-full text-center text-lg rounded-lg">
                <Camera className="h-10 w-10 mb-2 mx-auto" />
                Identify Medicine
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <MessageSquare /> AI Companion
                </CardTitle>
                <CardDescription>Have a question? Ask me anything!</CardDescription>
            </CardHeader>
            <CardContent>
                <AiCompanion />
            </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar /> Your Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              {dailyPlan.map((item, index) => (
                <li key={index} className="flex items-center gap-4">
                  {item.icon}
                  <div>
                    <p className="font-bold text-lg">{item.task}</p>
                    <p className="text-base text-muted-foreground">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Bell /> Medication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/50">
                <Pill className="h-8 w-8 text-primary mt-1" />
                <div>
                    <p className="font-bold text-lg">Morning Pills</p>
                    <p className="text-base text-muted-foreground">Take 1 tablet of Aricept at 9:00 AM</p>
                </div>
            </div>
             <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/50">
                <Pill className="h-8 w-8 text-primary mt-1" />
                <div>
                    <p className="font-bold text-lg">Evening Pills</p>
                    <p className="text-base text-muted-foreground">Take 1 tablet of Namenda at 8:00 PM</p>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">A walk down memory lane...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Image 
              src={memoryPrompt.image} 
              alt="Memory prompt" 
              width={600} 
              height={400} 
              className="rounded-lg w-full object-cover" 
              data-ai-hint="family beach"
            />
            <p className="text-base">{memoryPrompt.story}</p>
            <p className="font-semibold text-base">{memoryPrompt.prompt}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
