import { z } from 'genkit';
import { getAi, withTimeout } from '@/ai/genkit';
import { AppError } from '@/server/errors';

export const IdentifyMedicineOutput = z.object({
  medicineName: z.string().describe('Brand or generic name printed on the pack'),
  strength: z.string().optional().describe('Strength printed on the pack, e.g. "5 mg"'),
  confidence: z.number().min(0).max(1),
  usage: z.string().describe('What this medicine is typically used for, in plain language'),
  expiryDate: z.string().optional().describe('Expiry date if visible, YYYY-MM or YYYY-MM-DD'),
});
export type IdentifyMedicineOutput = z.infer<typeof IdentifyMedicineOutput>;

/** Vision call only; the safety cross-check against the prescription list lives in the service layer. */
export async function identifyMedicine(photoDataUri: string): Promise<IdentifyMedicineOutput> {
  const ai = getAi();
  if (!ai) throw new AppError('UNAVAILABLE', 'Medicine identification needs GEMINI_API_KEY to be configured');
  const { output } = await withTimeout(
    ai.generate({
      prompt: [
        { media: { url: photoDataUri } },
        {
          text: 'You are a pharmacist. Read the medicine name, strength and expiry date printed on this tablet pack. Do not guess: if text is unreadable, lower the confidence.',
        },
      ],
      output: { schema: IdentifyMedicineOutput },
    }),
    25_000,
  );
  if (!output) throw new AppError('UNAVAILABLE', 'Could not read the medicine pack');
  return output;
}
