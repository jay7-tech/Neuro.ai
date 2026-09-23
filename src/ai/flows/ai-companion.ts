import { z } from 'genkit';
import { getAi, withTimeout } from '@/ai/genkit';
import { logger } from '@/server/logger';
import {
  buildCompanionPrompt,
  detectDistress,
  ruleBasedAnswer,
  type CompanionAnswer,
  type CompanionContext,
} from '@/server/domain/companion';

const Output = z.object({ answer: z.string().max(600) });

/**
 * Grounded companion: the LLM gets a compact JSON of verified facts and strict
 * instructions to stay within them. Any LLM failure (no key, timeout, schema miss)
 * falls back to the deterministic answerer, so the patient always gets a reply.
 */
export async function answerQuestion(question: string, ctx: CompanionContext): Promise<CompanionAnswer> {
  const suggestSos = detectDistress(question);
  const ai = getAi();
  if (ai) {
    try {
      const { output } = await withTimeout(
        ai.generate({ prompt: buildCompanionPrompt(question, ctx), output: { schema: Output } }),
      );
      if (output?.answer) return { answer: output.answer, source: 'llm', suggestSos };
    } catch (err) {
      logger.warn({ err }, 'companion LLM call failed; using rule-based fallback');
    }
  }
  return { answer: ruleBasedAnswer(question, ctx), source: 'rules', suggestSos };
}
