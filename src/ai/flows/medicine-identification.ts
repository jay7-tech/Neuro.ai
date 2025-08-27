'use server';

/**
 * @fileOverview Medicine identification AI agent.
 *
 * - identifyMedicine - A function that handles the medicine identification process.
 * - IdentifyMedicineInput - The input type for the identifyMedicine function.
 * - IdentifyMedicineOutput - The return type for the identifyMedicine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyMedicineInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a tablet pack, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyMedicineInput = z.infer<typeof IdentifyMedicineInputSchema>;

const IdentifyMedicineOutputSchema = z.object({
  medicineName: z.string().describe('The identified name of the medicine.'),
  confidenceLevel: z
    .number()
    .describe('The confidence level of the identification (0-1).'),
});
export type IdentifyMedicineOutput = z.infer<typeof IdentifyMedicineOutputSchema>;

export async function identifyMedicine(
  input: IdentifyMedicineInput
): Promise<IdentifyMedicineOutput> {
  return identifyMedicineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyMedicinePrompt',
  input: {schema: IdentifyMedicineInputSchema},
  output: {schema: IdentifyMedicineOutputSchema},
  prompt: `You are an expert pharmacist specializing in identifying medicine from photos of tablet packs.

You will use this information to identify the medicine in the photo, and provide a confidence level.

Use the following as the primary source of information about the medicine.

Photo: {{media url=photoDataUri}}

Identify the medicine and provide a confidence level.`,
});

const identifyMedicineFlow = ai.defineFlow(
  {
    name: 'identifyMedicineFlow',
    inputSchema: IdentifyMedicineInputSchema,
    outputSchema: IdentifyMedicineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
