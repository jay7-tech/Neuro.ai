'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Camera, MessageSquare, Music, PhoneCall, HeartPulse, Album, ArrowRight, Users, Smile, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AiCompanion } from "./ai-companion";
import { patient as initialPatient } from "@/lib/data";
import { MoodTracker } from './mood-tracker';
import { CaregiverChat } from './caregiver-chat';
import { DailyPlanManager } from '../shared/daily-plan-manager';
import { MedicationManager } from '../shared/medication-manager';

const PATIENT_STORAGE_KEY = 'neuro-ai-patient-data';

const tools = [
    { name: "Cognitive Games", href: "/patient/games", icon: <Brain className="h-8 w-8 text-primary" /> },
    { name: "Identify Medicine", href: "/patient/med-identifier", icon: <Camera className="h-8 w-8 text-primary" /> },
    { name: "Music Therapy", href: "/patient/music", icon: <Music className="h-8 w-8 text-primary" /> },
    { name: "Gentle Exercises", href: "/patient/exercise", icon: <HeartPulse className="h-8 w-8 text-primary" /> },
    { name: "Memory Lane", href: "/patient/memory-lane", icon: <Album className="h-8 w-8 text-primary" /> },
    { name: "Family Tree", href: "/patient/family-tree", icon: <Users className="h-8 w-8 text-primary" /> }
];

export function PatientDashboard() {
  const [patientData, setPatientData] = useState(initialPatient);
  const patientId = patientData.id;

  useEffect(() => {
    const storedData = localStorage.getItem(PATIENT_STORAGE_KEY);
    if (storedData) {
        setPatientData(JSON.parse(storedData));
    }
  }, []);

  const handleCallHelp = () => {
    if(patientData.caregivers[0]?.phone) {
      window.location.href = `tel:${patientData.caregivers[0].phone}`;
    }
  };

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Main Content Column */}
      <div className="lg:col-span-2 space-y-8">
        <Card className="shadow-xl rounded-2xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
              <Image src={patientData.photo} alt={patientData.name} width={100} height={100} className="rounded-full shadow-md" data-ai-hint="person portrait" />
              <div className="flex-grow">
                <CardTitle className="text-4xl font-bold font-headline">
                  Hi, {patientData.name}!
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">Welcome back. Here is your dashboard for today.</CardDescription>
                <div className="pt-4">
                  <Link href="/patient/profile" passHref>
                      <Button variant="outline" className="shadow-sm">View Full Profile <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Card className="shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Tools to Help</CardTitle>
             <CardDescription>Click on a tool to get started.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Link href={tool.href} passHref key={tool.name}>
                <div className="flex flex-col items-center justify-center text-center p-4 rounded-xl shadow-md transition-transform hover:scale-105 hover:bg-accent/50 cursor-pointer h-36 border">
                  {tool.icon}
                  <span className="mt-2 font-semibold">{tool.name}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <DailyPlanManager patientId={patientId} isCaregiverView={false} />
        
        <MedicationManager patientId={patientId} isCaregiverView={false} />

      </div>

      {/* Right Sidebar Column */}
      <div className="lg:col-span-1 space-y-8">
        <Card className="shadow-xl rounded-2xl border-destructive/50">
            <CardContent className="p-4">
                <Button variant="destructive" size="lg" className="w-full h-24 text-2xl rounded-xl shadow-lg" onClick={handleCallHelp}>
                    <PhoneCall className="mr-4 h-10 w-10" />
                    Call for Help
                </Button>
            </CardContent>
        </Card>

        <Card className="shadow-xl rounded-2xl">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <MessageSquare /> AI Companion
                </CardTitle>
                <CardDescription>Have a question? Ask your AI companion.</CardDescription>
            </CardHeader>
            <CardContent>
                <AiCompanion />
            </CardContent>
        </Card>

        <Card className="shadow-xl rounded-2xl">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <Smile /> How are you feeling?
                </CardTitle>
                <CardDescription>Let your caregiver know how your day is going.</CardDescription>
            </CardHeader>
            <CardContent>
                <MoodTracker patientId={patientId} />
            </CardContent>
        </Card>

        <CaregiverChat patientId={patientId} />
      </div>
    </div>
  );
}
