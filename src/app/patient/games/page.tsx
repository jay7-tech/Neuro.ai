
import { AppHeader } from "@/components/app/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Palette, Puzzle, Pencil } from "lucide-react";
import Link from "next/link";

const games = [
    {
        name: "Memory Match",
        description: "Find all the matching pairs of cards.",
        href: "/patient/games/memory-match",
        icon: <Puzzle className="h-12 w-12 text-primary" />
    },
    {
        name: "Color Match",
        description: "Match the color name to the correct box.",
        href: "/patient/games/color-match",
        icon: <Palette className="h-12 w-12 text-primary" />
    },
    {
        name: "Word Scramble",
        description: "Unscramble the letters to form a word.",
        href: "/patient/games/word-scramble",
        icon: <Pencil className="h-12 w-12 text-primary" />
    }
]

export default function GamesPage() {
    return (
        <div className="min-h-screen bg-background">
            <AppHeader role="Patient" />
            <main className="container mx-auto">
                <div className="p-4 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-center md:text-left">
                             <h1 className="text-4xl font-bold font-headline flex items-center gap-3"><Brain /> Cognitive Games</h1>
                            <p className="text-lg text-muted-foreground">Choose a game to play and exercise your mind.</p>
                        </div>
                        <Link href="/patient" passHref>
                            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {games.map((game) => (
                            <Link href={game.href} passHref key={game.name}>
                                <Card className="h-full hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer flex flex-col">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        {game.icon}
                                        <div>
                                            <CardTitle className="text-2xl">{game.name}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-muted-foreground">{game.description}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
