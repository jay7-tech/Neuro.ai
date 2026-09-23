/**
 * Grounding context and a deterministic answerer for the patient's AI companion.
 *
 * The companion must never invent facts about a person with memory loss ("your son
 * is called David" when he is Peter). So the LLM only ever sees facts we give it,
 * and when the LLM is unavailable this rule-based answerer handles the most common
 * questions — day/time, medication, today's plan, family — from the same facts.
 */

export type CompanionContext = {
  patientName: string;
  now: { date: string; weekday: string; time: string };
  nextDoses: { name: string; dosage: string; time: string; state: string }[];
  plan: { title: string; time: string; completed: boolean }[];
  family: { name: string; relation: string }[];
  careTeam: { name: string; role: string }[];
};

export type CompanionAnswer = { answer: string; source: 'llm' | 'rules'; suggestSos: boolean };

const DISTRESS = /\b(help me|i fell|fallen|hurt|pain|lost|scared|can'?t breathe|emergency|don'?t know where)\b/i;

export function detectDistress(text: string): boolean {
  return DISTRESS.test(text);
}

const RELATIONS = [
  'wife',
  'husband',
  'son',
  'daughter',
  'brother',
  'sister',
  'grandson',
  'granddaughter',
  'friend',
  'mother',
  'father',
];

export function ruleBasedAnswer(question: string, ctx: CompanionContext): string {
  const q = question.toLowerCase();
  const first = ctx.patientName.split(' ')[0];

  if (/\b(what|which)\b.*\b(day|date)\b|\btoday\b.*\b(date|day)\b/.test(q)) {
    return `Today is ${ctx.now.weekday}, ${ctx.now.date}, ${first}.`;
  }
  if (/\bwhat time\b|\btime is it\b/.test(q)) {
    return `It's ${ctx.now.time} right now.`;
  }
  if (/\b(medicine|medication|pill|tablet|dose)s?\b/.test(q)) {
    const pending = ctx.nextDoses.filter((d) => d.state === 'due' || d.state === 'upcoming');
    if (!pending.length) return `You're all done with your medicine for today. Well done, ${first}!`;
    const next = pending[0];
    return `Your next medicine is ${next.name}, ${next.dosage}, at ${next.time}.`;
  }
  if (/\b(plan|schedule|doing today|what'?s next|next)\b/.test(q)) {
    const upcoming = ctx.plan.filter((p) => !p.completed && p.time >= ctx.now.time);
    if (!upcoming.length) return `There's nothing else planned for today. Time to relax.`;
    return `Next up: ${upcoming[0].title} at ${upcoming[0].time}.`;
  }
  const relation = RELATIONS.find((r) => new RegExp(`\\b${r}\\b`).test(q));
  if (relation) {
    const people = ctx.family.filter((f) => f.relation.toLowerCase() === relation);
    if (people.length === 1) return `Your ${relation}'s name is ${people[0].name}.`;
    if (people.length > 1) return `Your ${relation}s are ${people.map((p) => p.name).join(' and ')}.`;
    return `I don't have your ${relation} in your family list yet. Your caregiver can add them.`;
  }
  if (/\b(who|name)\b.*\b(caregiver|doctor|nurse)\b/.test(q)) {
    const want = /doctor|nurse/.test(q) ? 'clinician' : 'caregiver';
    const people = ctx.careTeam.filter((m) => m.role === want);
    if (people.length)
      return `Your ${want === 'clinician' ? 'doctor' : 'caregiver'} is ${people.map((p) => p.name).join(' and ')}.`;
  }
  if (/\b(who am i|my name)\b/.test(q)) return `Your name is ${ctx.patientName}.`;
  return `I'm here with you, ${first}. You can ask me about today's plan, your medicine, or your family.`;
}

export function buildCompanionPrompt(question: string, ctx: CompanionContext): string {
  return [
    'You are a gentle companion for a person living with dementia.',
    'Rules:',
    '- Answer ONLY from the FACTS below. If the answer is not in the facts, say kindly that you are not sure and suggest asking their caregiver.',
    '- Use one or two short, warm sentences. No lists, no medical advice, never contradict or correct them harshly.',
    '- Use their first name occasionally.',
    '',
    'FACTS (JSON):',
    JSON.stringify(ctx),
    '',
    `Question: ${question}`,
  ].join('\n');
}
