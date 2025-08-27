// This file uses server-side code.
'use server';

/**
 * @fileOverview AI companion flow for answering patient questions.
 *
 * - `answerQuestion` - A function that answers patient questions using tool-augmented reasoning.
 * - `AnswerQuestionInput` - The input type for the `answerQuestion` function.
 * - `AnswerQuestionOutput` - The return type for the `answerQuestion` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionInputSchema = z.object({
  question: z.string().describe('The question asked by the patient.'),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

const AnswerQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the patient question.'),
});
export type AnswerQuestionOutput = z.infer<typeof AnswerQuestionOutputSchema>;

export async function answerQuestion(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
  return answerQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: AnswerQuestionInputSchema},
  output: {schema: AnswerQuestionOutputSchema},
  prompt: `You are a helpful and gentle AI companion designed to answer simple questions from patients.

  Question: {{{question}}}
  Answer:`, // Keep answer conversational and simple
});

const answerQuestionFlow = ai.defineFlow(
  {
    name: 'answerQuestionFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
