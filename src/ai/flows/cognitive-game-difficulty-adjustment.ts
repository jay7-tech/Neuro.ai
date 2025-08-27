'use server';
/**
 * @fileOverview An AI agent to adjust the difficulty of cognitive games based on player performance.
 *
 * - adjustGameDifficulty - A function that adjusts the game difficulty.
 * - AdjustGameDifficultyInput - The input type for the adjustGameDifficulty function.
 * - AdjustGameDifficultyOutput - The return type for the adjustGameDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustGameDifficultyInputSchema = z.object({
  gameType: z.string().describe('The type of cognitive game being played.'),
  playerScore: z.number().describe('The player\'s current score in the game.'),
  difficultyLevel: z.string().describe('The current difficulty level of the game (e.g., easy, medium, hard).'),
  recentMoves: z.array(z.string()).describe('An array of the player\'s recent moves or actions in the game.'),
  timeTaken: z.number().describe('The time taken to complete the last round in seconds.'),
});
export type AdjustGameDifficultyInput = z.infer<typeof AdjustGameDifficultyInputSchema>;

const AdjustGameDifficultyOutputSchema = z.object({
  newDifficultyLevel: z.string().describe('The new recommended difficulty level for the game.'),
  assistanceMessage: z.string().describe('A message providing assistance or encouragement to the player.'),
});
export type AdjustGameDifficultyOutput = z.infer<typeof AdjustGameDifficultyOutputSchema>;

export async function adjustGameDifficulty(input: AdjustGameDifficultyInput): Promise<AdjustGameDifficultyOutput> {
  return adjustGameDifficultyFlow(input);
}

const adjustGameDifficultyPrompt = ai.definePrompt({
  name: 'adjustGameDifficultyPrompt',
  input: {schema: AdjustGameDifficultyInputSchema},
  output: {schema: AdjustGameDifficultyOutputSchema},
  prompt: `You are an AI game master who helps Dementia patients play cognitive games and adjusts the difficulty based on their performance.

You will take into consideration the recentMoves, playerScore, timeTaken and difficultyLevel to determine a new difficultyLevel and assistanceMessage.

Here is the information about the game:
Game Type: {{{gameType}}}
Current Difficulty Level: {{{difficultyLevel}}}
Player Score: {{{playerScore}}}
Recent Moves: {{#each recentMoves}}{{{this}}} {{/each}}
Time Taken: {{{timeTaken}}} seconds

Based on this information, suggest a new difficultyLevel (must be easy, medium, or hard) and assistanceMessage to help the patient.
Difficulty Adjustment Reasoning: Explain why you are adjusting the difficulty in a step-by-step logical way.
Assistance Message: A message to the patient giving them help.
New Difficulty Level:`, 
});

const adjustGameDifficultyFlow = ai.defineFlow(
  {
    name: 'adjustGameDifficultyFlow',
    inputSchema: AdjustGameDifficultyInputSchema,
    outputSchema: AdjustGameDifficultyOutputSchema,
  },
  async input => {
    const {output} = await adjustGameDifficultyPrompt(input);
    return output!;
  }
);
