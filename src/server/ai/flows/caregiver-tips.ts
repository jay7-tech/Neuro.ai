import { z } from 'genkit';
import { getAi, withTimeout } from '@/server/ai/genkit';
import { logger } from '@/server/logger';

export type TipTopic = 'Communication' | 'Daily Activities' | 'Safety' | 'Managing Frustration' | 'Self-Care';

/** Curated tips used when the LLM is unavailable. */
const FALLBACK: Record<TipTopic, string[]> = {
  Communication: [
    'Ask one simple question at a time and offer two choices ("tea or juice?") instead of open questions.',
    'Approach from the front, make eye contact and say your name before you start talking.',
  ],
  'Daily Activities': [
    'Keep the same order for morning tasks every day — routine reduces decisions, and fewer decisions means less anxiety.',
    'Break tasks into single steps and hand over one item at a time.',
  ],
  Safety: [
    'Label cupboards with pictures and words, and keep a night light on the route to the bathroom.',
    'Remove trip hazards like loose rugs; most falls at home happen on the way to the bathroom at night.',
  ],
  'Managing Frustration': [
    'Respond to the feeling, not the facts: "You seem worried" works better than correcting what they said.',
    'If agitation builds, change the scene — a short walk or favourite song often resets the mood.',
  ],
  'Self-Care': [
    'Schedule a 15-minute break for yourself every day, and treat it like a medication — non-negotiable.',
    'Ask a family member to take one fixed task each week; small, predictable help prevents burnout.',
  ],
};

const Output = z.object({ tip: z.string().max(500) });

export async function getCaregiverTip(topic: TipTopic): Promise<{ tip: string; source: 'llm' | 'curated' }> {
  const ai = getAi();
  if (ai) {
    try {
      const { output } = await withTimeout(
        ai.generate({
          prompt: `You support family caregivers of people with dementia. Give ONE concise, practical, encouraging tip (max 2 sentences) about: ${topic}.`,
          output: { schema: Output },
        }),
      );
      if (output?.tip) return { tip: output.tip, source: 'llm' };
    } catch (err) {
      logger.warn({ err }, 'caregiver tip LLM call failed');
    }
  }
  const options = FALLBACK[topic];
  return { tip: options[Math.floor(Math.random() * options.length)], source: 'curated' };
}
