import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

let instance: Genkit | null | undefined;

/**
 * Lazily initialised Genkit client. Returns null when no API key is configured so
 * every AI feature can degrade to a deterministic fallback instead of crashing —
 * the app is fully usable (and testable in CI) without an LLM.
 */
export function getAi(): Genkit | null {
  if (instance !== undefined) return instance;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  instance = apiKey
    ? genkit({ plugins: [googleAI({ apiKey })], model: process.env.GEMINI_MODEL ?? 'googleai/gemini-2.5-flash' })
    : null;
  return instance;
}

export class AiTimeoutError extends Error {}

export async function withTimeout<T>(p: Promise<T>, ms = 15_000): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AiTimeoutError(`AI call exceeded ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
