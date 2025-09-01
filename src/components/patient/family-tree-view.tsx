
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { familyTree } from "@/lib/data";
import { Users, Heart } from "lucide-react";
import Image from "next/image";

export function FamilyTreeView() {
    const { spouse, children } = familyTree;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold font-headline flex items-center justify-center gap-3"><Users /> My Family</h1>
                <p className="text-lg text-muted-foreground">The people who love you most.</p>
            </div>
            
            <Card className="shadow-2xl rounded-2xl overflow-hidden max-w-lg mx-auto border-2 border-primary/30">
                <div className="flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-2/5">
                        <Image src={spouse.photo} alt={spouse.name} width={400} height={400} className="object-cover w-full h-full" data-ai-hint="person portrait" />
                    </div>
                    <div className="w-full md:w-3/5 p-6">
                        <CardHeader className="p-0">
                            <CardTitle className="text-3xl">{spouse.name}</CardTitle>
                            <CardDescription className="text-lg flex items-center gap-2"><Heart className="text-destructive" /> {spouse.relation}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 pt-4">
                            <blockquote className="text-base italic border-l-4 pl-4">
                                {spouse.quote}
                            </blockquote>
                        </CardContent>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                {children.map(child => (
                    <Card key={child.name} className="shadow-xl rounded-2xl overflow-hidden border">
                         <div className="aspect-square w-full overflow-hidden">
                            <Image src={child.photo} alt={child.name} width={400} height={400} className="w-full h-full object-cover" data-ai-hint="person portrait" />
                        </div>
                        <div className="p-6">
                            <CardHeader className="p-0">
                                <CardTitle className="text-2xl">{child.name}</CardTitle>
                                <CardDescription className="text-md">{child.relation}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 pt-4">
                                <blockquote className="text-base italic border-l-4 pl-4">
                                    {child.quote}
                                </blockquote>
                            </CardContent>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
