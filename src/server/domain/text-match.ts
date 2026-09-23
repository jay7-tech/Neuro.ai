/** Levenshtein edit distance, O(n·m) time and O(min(n, m)) memory. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length < b.length) [a, b] = [b, a];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml)\b/g, '')
    .replace(/[^a-z]/g, '');

/** 1.0 = identical after normalisation (case, dosage strength, punctuation removed). */
export function similarity(a: string, b: string): number {
  const x = normalise(a);
  const y = normalise(b);
  if (!x.length || !y.length) return 0;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

/**
 * Finds the best match for a name read off a photo (OCR/LLM output is noisy:
 * "Aricept 5mg", "ARICEPT", "Aricpet") among the patient's prescribed medications.
 */
export function bestMatch<T extends { name: string }>(needle: string, haystack: readonly T[], threshold = 0.75) {
  let best: { item: T; score: number } | null = null;
  for (const item of haystack) {
    const score = similarity(needle, item.name);
    if (!best || score > best.score) best = { item, score };
  }
  return best && best.score >= threshold ? best : null;
}
