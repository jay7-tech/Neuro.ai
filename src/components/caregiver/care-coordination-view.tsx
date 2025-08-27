'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export function CareCoordinationView() {
    const { toast } = useToast();

    const handleAddTask = () => {
        toast({ title: "Task Added", description: "The new task has been added to the patient's daily plan." });
    }

    const handleAddPrompt = () => {
        toast({ title: "Prompt Added", description: "The new memory prompt is now available for the patient." });
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Care Coordination</h1>
            <p className="text-muted-foreground">Manage the patient's daily routine and memory aids.</p>
            <Tabs defaultValue="planner">
                <TabsList className="grid w-full grid-cols-2 max-w-sm">
                    <TabsTrigger value="planner">Daily Planner</TabsTrigger>
                    <TabsTrigger value="prompts">Memory Prompts</TabsTrigger>
                </TabsList>
                <TabsContent value="planner" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Daily Planner</CardTitle>
                            <CardDescription>Add, edit, or remove tasks from the patient's daily schedule.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 border rounded-lg space-y-2">
                                <h3 className="font-semibold">Add New Task</h3>
                                <div className="flex flex-col md:flex-row gap-2">
                                    <Input placeholder="Task description (e.g., Morning walk)" />
                                    <Input type="time" className="w-auto" />
                                    <Button onClick={handleAddTask} className="w-full md:w-auto">Add Task</Button>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Current Schedule</h3>
                                <p className="text-sm text-muted-foreground">This is where the list of current tasks would be displayed for editing or removal.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="prompts" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Memory Prompts</CardTitle>
                            <CardDescription>Add photos and stories to help with memory recall.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 border rounded-lg space-y-2">
                                <h3 className="font-semibold">Add New Prompt</h3>
                                 <div className="flex flex-col gap-2">
                                    <Input placeholder="Image URL (e.g., from https://picsum.photos)" />
                                    <Textarea placeholder="Story behind the photo..." />
                                    <Textarea placeholder="Prompt question (e.g., What do you remember about this day?)" />
                                    <Button onClick={handleAddPrompt} className="self-start">Add Prompt</Button>
                                </div>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">Current Prompts</h3>
                                <p className="text-sm text-muted-foreground">This is where existing memory prompts would be listed.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
