'use server';
/**
 * @fileOverview An AI agent to provide tips for caregivers.
 *
 * - getCaregiverTip - A function that returns a helpful tip.
 * - GetCaregiverTipInput - The input type for the getCaregiverTip function.
 * - GetCaregiverTipOutput - The return type for the getCaregiverTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetCaregiverTipInputSchema = z.object({
  topic: z.string().describe('The topic for the tip (e.g., communication, daily activities, safety).'),
});
export type GetCaregiverTipInput = z.infer<typeof GetCaregiverTipInputSchema>;

const GetCaregiverTipOutputSchema = z.object({
  tip: z.string().describe('A practical, empathetic tip for the caregiver.'),
});
export type GetCaregiverTipOutput = z.infer<typeof GetCaregiverTipOutputSchema>;

export async function getCaregiverTip(input: GetCaregiverTipInput): Promise<GetCaregiverTipOutput> {
  return getCaregiverTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCaregiverTipPrompt',
  input: {schema: GetCaregiverTipInputSchema},
  output: {schema: GetCaregiverTipOutputSchema},
  prompt: `You are an expert AI assistant for caregivers of individuals with dementia. Your tone is supportive, empathetic, and practical.

Provide one concise, actionable tip for a caregiver on the following topic: {{{topic}}}.

The tip should be easy to understand and implement. Frame it in a positive and encouraging way.`,
});

const getCaregiverTipFlow = ai.defineFlow(
  {
    name: 'getCaregiverTipFlow',
    inputSchema: GetCaregiverTipInputSchema,
    outputSchema: GetCaregiverTipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
