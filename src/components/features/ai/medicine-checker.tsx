'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, CheckCircle2, HelpCircle, Loader2, ShieldAlert, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMedicineCheck } from '@/hooks/api';
import { errorMessage } from '@/lib/api-client';

/**
 * Downscale on the client before upload: phone photos are 3–12 MB; a 1024 px JPEG is
 * ~150 kB and plenty for reading a label. Cuts latency and the vision-model bill.
 */
async function toCompressedDataUri(file: File, maxSide = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function MedicineChecker({ patientId }: { patientId: string }) {
  const check = useMedicineCheck(patientId);
  const [preview, setPreview] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    const uri = await toCompressedDataUri(file);
    setPreview(uri);
    check.mutate(uri);
  };

  const r = check.data;
  return (
    <Card className="mx-auto max-w-2xl rounded-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Camera /> Is this my medicine?
        </CardTitle>
        <CardDescription>
          Take a photo of the tablet pack. I&apos;ll check it against your prescriptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button
          size="lg"
          className="h-16 w-full text-lg"
          onClick={() => input.current?.click()}
          disabled={check.isPending}
        >
          {check.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Upload className="mr-2 h-6 w-6" />}{' '}
          {check.isPending ? 'Checking…' : 'Take or choose a photo'}
        </Button>
        {preview && (
          <Image
            src={preview}
            alt="Medicine pack"
            width={640}
            height={480}
            className="max-h-64 w-full rounded-xl object-contain"
            unoptimized
          />
        )}
        {check.isError && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(check.error)}</AlertDescription>
          </Alert>
        )}
        {r && r.verdict === 'matches_prescription' && (
          <Alert className="border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <AlertTitle className="text-xl">Yes — this is your {r.matchedMedication!.name}</AlertTitle>
            <AlertDescription className="text-base">
              {r.matchedMedication!.dosage}, taken at {r.matchedMedication!.times.join(' and ')}.
              {r.expired && (
                <b className="mt-2 block text-destructive">
                  The pack looks expired ({r.identified.expiryDate}). Please ask your caregiver.
                </b>
              )}
            </AlertDescription>
          </Alert>
        )}
        {r && r.verdict === 'not_prescribed' && (
          <Alert variant="destructive">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-xl">This is not on your medicine list</AlertTitle>
            <AlertDescription className="text-base">
              It looks like {r.identified.medicineName}. Please don&apos;t take it — ask your caregiver first.
            </AlertDescription>
          </Alert>
        )}
        {r && r.verdict === 'uncertain' && (
          <Alert>
            <HelpCircle className="h-5 w-5" />
            <AlertTitle className="text-xl">I can&apos;t read the pack clearly</AlertTitle>
            <AlertDescription className="text-base">
              Try again with the name facing the camera in good light.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
