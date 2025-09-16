'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, HeartPulse, Mails } from "lucide-react";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import images from '@/lib/placeholder-images.json';

const exercises = [
    {
        name: "Chair Yoga",
        description: "Gentle yoga poses done while sitting on a chair.",
        icon: <Dumbbell className="h-12 w-12 text-primary" />,
        images: images.exercises.yoga
    },
    {
        name: "Gentle Stretching",
        description: "Simple stretches to improve flexibility and reduce stiffness.",
        icon: <HeartPulse className="h-12 w-12 text-primary" />,
        images: images.exercises.stretching
    },
    {
        name: "Seated Strength",
        description: "Simple strength exercises using light weights or resistance bands.",
        icon: <Dumbbell className="h-12 w-12 text-primary" />,
        images: images.exercises.strength
    }
]

export function ExerciseView() {
    return (
        <div className="space-y-8">
            <div className="text-center md:text-left">
                <h1 className="text-4xl font-bold font-headline flex items-center gap-3 justify-center md:justify-start"><HeartPulse /> Gentle Exercises</h1>
                <p className="text-lg text-muted-foreground">Stay active with these simple and safe workouts.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {exercises.map((exercise) => (
                    <Card key={exercise.name} className="shadow-lg rounded-2xl">
                        <CardHeader className="flex flex-row items-center gap-4">
                            {exercise.icon}
                            <div>
                                <CardTitle className="text-2xl">{exercise.name}</CardTitle>
                                <CardDescription>{exercise.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {exercise.images.map((image, index) => (
                                        <CarouselItem key={index}>
                                            <div className="aspect-video w-full rounded-lg overflow-hidden border">
                                                <Image 
                                                    src={image.src}
                                                    alt={image.alt}
                                                    width={600}
                                                    height={400}
                                                    className="w-full h-full object-cover"
                                                    data-ai-hint={image.hint}
                                                />
                                            </div>
                                            <p className="text-center text-muted-foreground mt-2 font-semibold">Step {index + 1}: {image.alt}</p>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                            </Carousel>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
