
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Pill, Camera, MessageSquare, Calendar, Sun, Moon, Utensils, ArrowRight, Music, PhoneCall, Palette } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AiCompanion } from "./ai-companion";
import { patient, familyTree } from "@/lib/data";
import { Separator } from "../ui/separator";

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

const tools = [
  {
    name: "Cognitive Games",
    href: "/patient/games",
    icon: <Brain className="h-10 w-10 mb-2 mx-auto text-primary" />,
  },
  {
    name: "Identify Medicine",
    href: "/patient/med-identifier",
    icon: <Camera className="h-10 w-10 mb-2 mx-auto text-primary" />,
  },
  {
    name: "Music Therapy",
    href: "/patient/music",
    icon: <Music className="h-10 w-10 mb-2 mx-auto text-primary" />,
  }
]

export function PatientDashboard() {
  const handleCallHelp = () => {
    // This will attempt to open the phone app on mobile devices
    window.location.href = `tel:${patient.caregivers[0].phone}`;
  };


  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              Hi, {patient.name}!
            </CardTitle>
            <CardDescription className="text-lg">This is your personal dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/patient/profile" passHref>
              <Button variant="outline" className="shadow-sm">View Full Profile <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Tools to Help</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Link href={tool.href} passHref key={tool.name}>
                <Button variant="outline" className="flex flex-col h-32 w-full text-center text-lg rounded-xl shadow-md transition-transform hover:scale-105 hover:bg-accent/50">
                  {tool.icon}
                  {tool.name}
                </Button>
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
      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg rounded-2xl">
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

        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Pill /> Medication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/50">
                <Pill className="h-8 w-8 text-primary mt-1" />
                <div>
                    <p className="font-bold text-lg">Morning Pills</p>
                    <p className="text-base text-muted-foreground">Take 1 tablet of Aricept at 9:00 AM</p>
                </div>
            </div>
             <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/50">
                <Pill className="h-8 w-8 text-primary mt-1" />
                <div>
                    <p className="font-bold text-lg">Evening Pills</p>
                    <p className="text-base text-muted-foreground">Take 1 tablet of Namenda at 8:00 PM</p>
                </div>
            </div>
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

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Your Family Tree</h3>
              <div className="flex flex-col items-center gap-4">
                  {/* Patient */}
                  <div className="flex flex-col items-center">
                      <Image src={patient.photo} alt={patient.name} width={100} height={100} className="rounded-full border-4 border-primary shadow-lg" data-ai-hint="person portrait" />
                      <p className="font-bold mt-2">{patient.name} (Me)</p>
                  </div>
                  
                  {/* Connection Line */}
                  <div className="w-px h-8 bg-border"></div>

                  {/* Spouse */}
                   <div className="flex items-center gap-4">
                       <div className="flex flex-col items-center">
                          <Image src={familyTree.spouse.photo} alt={familyTree.spouse.name} width={90} height={90} className="rounded-full shadow-md" data-ai-hint="person portrait" />
                          <p className="font-bold mt-2 text-sm">{familyTree.spouse.name}</p>
                          <p className="text-xs text-muted-foreground">{familyTree.spouse.relation}</p>
                      </div>
                  </div>

                  {/* Connection Line */}
                  <div className="w-px h-8 bg-border"></div>
                  
                  {/* Children */}
                  <div className="flex justify-center gap-8">
                      {familyTree.children.map(child => (
                           <div key={child.name} className="flex flex-col items-center">
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

        <Card className="shadow-lg rounded-2xl border-destructive/50">
            <CardContent className="p-4">
                <Button variant="destructive" size="lg" className="w-full h-24 text-2xl rounded-xl shadow-lg" onClick={handleCallHelp}>
                    <PhoneCall className="mr-4 h-10 w-10" />
                    Call for Help
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
