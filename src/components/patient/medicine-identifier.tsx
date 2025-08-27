'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { identifyMedicine } from '@/ai/flows/medicine-identification';
import Image from 'next/image';
import { Camera, Pill, FileUp, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function MedicineIdentifier() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<{ medicineName: string; confidenceLevel: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleIdentify = async () => {
    if (!photo) {
        setError("Please upload a photo first.");
        return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
        const response = await identifyMedicine({ photoDataUri: photo });
        setResult(response);
    } catch (e) {
        setError("Could not identify the medicine. Please try another photo.");
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-2"><Camera /> Medicine Identifier</CardTitle>
                <CardDescription className="text-lg">Upload a photo of a tablet pack to identify the medicine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 text-center">
                    <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                        {photo ? (
                            <Image src={photo} alt="Medicine" width={500} height={281} className="object-contain" />
                        ) : (
                            <div className="text-muted-foreground flex flex-col items-center gap-2 p-8">
                                <FileUp className="h-12 w-12" />
                                <p>Photo preview will appear here</p>
                                <p className="text-sm">Please use a clear, well-lit photo.</p>
                            </div>
                        )}
                    </div>
                    <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <Button size="lg" onClick={() => fileInputRef.current?.click()} variant="outline">
                        <FileUp className="mr-2 h-4 w-4" />
                        {photo ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                </div>
                
                {photo && (
                    <Button size="lg" onClick={handleIdentify} disabled={loading} className="w-full text-lg h-14">
                        {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Pill className="mr-2 h-6 w-6" />}
                        Identify This Medicine
                    </Button>
                )}

                {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                {result && (
                    <Alert>
                        <Pill className="h-4 w-4" />
                        <AlertTitle className="font-bold">Identification Result</AlertTitle>
                        <AlertDescription className="text-base mt-2 space-y-1">
                            <p><strong>Medicine Name:</strong> {result.medicineName}</p>
                            <p><strong>Confidence:</strong> {Math.round(result.confidenceLevel * 100)}%</p>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
