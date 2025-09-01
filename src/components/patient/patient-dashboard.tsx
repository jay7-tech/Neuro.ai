
'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Pill, Camera, MessageSquare, Calendar, Sun, Moon, Utensils, ArrowRight, Music, PhoneCall, HeartPulse, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AiCompanion } from "./ai-companion";
import { patient as initialPatient, familyTree } from "@/lib/data";
import { Separator } from "../ui/separator";
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';

const initialDailyPlan = [
  { time: '08:00', task: 'Wake up and get dressed', icon: <Sun className="h-6 w-6 text-primary" />, notes: '' },
  { time: '09:00', task: 'Eat breakfast & take pills', icon: <Utensils className="h-6 w-6 text-primary" />, notes: '' },
  { time: '10:00', task: 'Morning walk', icon: <HeartPulse className="h-6 w-6 text-primary" />, notes: 'Remember to wear comfortable shoes.' },
  { time: '15:00', task: 'Read a book', icon: <Brain className="h-6 w-6 text-primary" />, notes: '' },
  { time: '20:00', task: 'Prepare for bed', icon: <Moon className="h-6 w-6 text-primary" />, notes: '' },
];

const memoryPrompt = {
  image: "https://picsum.photos/600/400",
  story: "This photo was taken during our family trip to the beach in 2012. Remember how much fun we had building sandcastles?",
  prompt: "What was your favorite part of that day?"
};

const tools = [
  {
    name: "Cognitive Games",
    href: "/patient/games",
    icon: <Brain className="h-8 w-8 text-primary" />,
  },
  {
    name: "Identify Medicine",
    href: "/patient/med-identifier",
    icon: <Camera className="h-8 w-8 text-primary" />,
  },
  {
    name: "Music Therapy",
    href: "/patient/music",
    icon: <Music className="h-8 w-8 text-primary" />,
  },
  {
    name: "Gentle Exercises",
    href: "/patient/exercise",
    icon: <HeartPulse className="h-8 w-8 text-primary" />,
  }
]

export function PatientDashboard() {
  const [dailyPlan, setDailyPlan] = useState(initialDailyPlan);
  const [medications, setMedications] = useState(initialPatient.medications);
  const { toast } = useToast();

  const handlePlanChange = (index: number, field: 'task' | 'time' | 'notes', value: string) => {
    const updatedPlan = [...dailyPlan];
    updatedPlan[index] = { ...updatedPlan[index], [field]: value };
    setDailyPlan(updatedPlan);
  };

  const handleSavePlan = () => {
    toast({
      title: "Daily Plan Saved!",
      description: "Your changes have been successfully saved."
    })
  }
  
  const handleMedicationChange = (index: number, field: 'name' | 'dose' | 'time', value: string) => {
    const updatedMeds = [...medications];
    updatedMeds[index] = { ...updatedMeds[index], [field]: value };
    setMedications(updatedMeds);
  };

  const handleAddMedication = () => {
    setMedications([...medications, { id: Date.now(), name: '', dose: '', time: '' }]);
  };

  const handleRemoveMedication = (id: number) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const handleSaveMedications = () => {
    toast({
      title: "Medication Plan Saved!",
      description: "Your medication schedule has been updated."
    });
  };

  const handleCallHelp = () => {
    // This will attempt to open the phone app on mobile devices
    if(initialPatient.caregivers[0]?.phone) {
      window.location.href = `tel:${initialPatient.caregivers[0].phone}`;
    }
  };

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      {/* Main Content Column */}
      <div className="xl:col-span-2 space-y-6">
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
              <Image src={initialPatient.photo} alt={initialPatient.name} width={80} height={80} className="rounded-full border-4 border-primary" data-ai-hint="person portrait" />
              <div className="flex-grow">
                <CardTitle className="text-3xl font-bold">
                  Hi, {initialPatient.name}!
                </CardTitle>
                <CardDescription className="text-lg">This is your personal dashboard.</CardDescription>
                <div className="pt-4">
                  <Link href="/patient/profile" passHref>
                      <Button variant="outline" className="shadow-sm">View Full Profile <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Tools to Help</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        <Card className="shadow-lg rounded-2xl">
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

      {/* Right Sidebar Column */}
      <div className="xl:col-span-1 space-y-6">
        <Card className="shadow-lg rounded-2xl border-destructive/50">
            <CardContent className="p-4">
                <Button variant="destructive" size="lg" className="w-full h-24 text-2xl rounded-xl shadow-lg" onClick={handleCallHelp}>
                    <PhoneCall className="mr-4 h-10 w-10" />
                    Call for Help
                </Button>
            </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar /> Your Day
            </CardTitle>
            <CardDescription>Add notes to your plan for the day.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {dailyPlan.map((item, index) => (
                <li key={index} className="flex flex-col gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <div className="flex-grow space-y-1.5">
                      <Input
                        type="text"
                        placeholder="Task description..."
                        value={item.task}
                        onChange={(e) => handlePlanChange(index, 'task', e.target.value)}
                        className="bg-background font-bold text-base h-10"
                      />
                      <Input
                        type="time"
                        value={item.time}
                        onChange={(e) => handlePlanChange(index, 'time', e.target.value)}
                        className="bg-background text-sm text-muted-foreground h-9"
                      />
                    </div>
                  </div>
                  <Input
                    type="text"
                    placeholder="Add a note..."
                    value={item.notes}
                    onChange={(e) => handlePlanChange(index, 'notes', e.target.value)}
                    className="bg-background text-sm"
                  />
                </li>
              ))}
            </ul>
             <Button onClick={handleSavePlan} className="w-full mt-4">Save Plan</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Pill /> Medication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {medications.map((med, index) => (
              <div key={med.id} className="p-3 rounded-lg bg-accent/50 space-y-2">
                <div className="flex gap-2">
                    <Input
                      placeholder="Medicine Name"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      className="bg-background font-semibold"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMedication(med.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
                <Input
                  placeholder="Dosage (e.g., 1 tablet)"
                  value={med.dose}
                  onChange={(e) => handleMedicationChange(index, 'dose', e.target.value)}
                  className="bg-background"
                />
                <Input
                  type="time"
                  value={med.time}
                  onChange={(e) => handleMedicationChange(index, 'time', e.target.value)}
                  className="bg-background"
                />
              </div>
            ))}
            <Button variant="outline" onClick={handleAddMedication} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Medication
            </Button>
            <Button onClick={handleSaveMedications} className="w-full">Save Medications</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">A walk down memory lane...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Image 
              src={memoryPrompt.image} 
              alt="Memory prompt" 
              width={600} 
              height={400} 
              className="rounded-xl w-full object-cover shadow-md" 
              data-ai-hint="family beach"
            />
            <p className="text-base pt-2">{memoryPrompt.story}</p>
            <p className="font-semibold text-base">{memoryPrompt.prompt}</p>

            <Separator className="my-4" />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">Your Family Tree</h3>
              <div className="flex flex-col items-center gap-4">
                  {/* Patient */}
                  <div className="flex flex-col items-center">
                      <Image src={initialPatient.photo} alt={initialPatient.name} width={100} height={100} className="rounded-full border-4 border-primary shadow-lg" data-ai-hint="person portrait" />
                      <p className="font-bold mt-2">{initialPatient.name} (Me)</p>
                  </div>
                  
                  {/* Connection Line */}
                  <div className="w-px h-6 bg-border"></div>

                  {/* Spouse */}
                   <div className="flex items-center gap-4">
                       <div className="flex flex-col items-center">
                          <Image src={familyTree.spouse.photo} alt={familyTree.spouse.name} width={90} height={90} className="rounded-full shadow-md" data-ai-hint="person portrait" />
                          <p className="font-bold mt-2 text-sm">{familyTree.spouse.name}</p>
                          <p className="text-xs text-muted-foreground">{familyTree.spouse.relation}</p>
                      </div>
                  </div>

                  {/* Connection Line */}
                  <div className="w-px h-6 bg-border"></div>
                  
                  {/* Children */}
                  <div className="flex justify-center gap-8">
                      {familyTree.children.map(child => (
                           <div key={child.name} className="flex flex-col items-center text-center">
                              <Image src={child.photo} alt={child.name} width={80} height={80} className="rounded-full shadow-md" data-ai-hint="person portrait" />
                              <p className="font-bold mt-2 text-sm">{child.name}</p>
                              <p className="text-xs text-muted-foreground">{child.relation}</p>
                          </div>
                      ))}
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
