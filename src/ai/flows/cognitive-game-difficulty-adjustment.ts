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
  newDifficultyLevel: z.string().describe('The new recommended difficulty level for the game (must be easy, medium, or hard).'),
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
  prompt: `You are an AI game master who helps Dementia patients play cognitive games. Your tone should be gentle, encouraging, and empathetic. Your goal is to adjust the game difficulty to keep the player engaged without causing frustration.

You will take into consideration the recentMoves, playerScore, timeTaken, and current difficultyLevel to determine a new difficultyLevel and an assistanceMessage.

Here is the information about the game session:
Game Type: {{{gameType}}}
Current Difficulty Level: {{{difficultyLevel}}}
Player Score: {{{playerScore}}}
Recent Moves: {{#each recentMoves}}{{{this}}} {{/each}}
Time Taken: {{{timeTaken}}} seconds

Based on this information, suggest a new difficultyLevel (must be one of 'easy', 'medium', or 'hard') and an assistanceMessage for the patient.

Follow these logical steps for your decision:
1.  **Analyze Performance**: Look at the score, moves, and time taken. A high score and low time suggest the game is too easy. A low score, many moves, or a very long time suggest it's too hard.
2.  **Determine Difficulty Change**:
    *   If the performance was very strong on 'easy', suggest 'medium'.
    *   If performance was strong on 'medium', suggest 'hard'.
    *   If performance was weak on 'hard', suggest 'medium'.
    *   If performance was weak on 'medium', suggest 'easy'.
    *   Otherwise, keep the difficulty the same.
3.  **Craft Assistance Message**: Write a kind and encouraging message.
    *   If the difficulty is increasing, say something like "You're doing so well, let's try something a little more challenging!"
    *   If the difficulty is decreasing, say "That was a good warm-up. Let's try a different level that might be more comfortable."
    *   If the difficulty is the same, say "Great job! Let's play another round at this level."
4.  **Final Output**: Provide only the new difficulty level and the assistance message in the specified format.`,
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
