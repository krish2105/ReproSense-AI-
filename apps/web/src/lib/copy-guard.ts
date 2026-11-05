// TypeScript port of backend/app/ai/guards.py (BANNED_PATTERNS). Keep the two lists identical.
// Used by unit tests over every UI string, so no diagnostic wording or fake probability ships in the chrome.
const YOU_HAVE_OK =
  "(?:been|had|missed|felt|started|stopped|logged|noticed|recorded|told|tried|said|mentioned|entered|shared|marked|chosen|asked|" +
  "the right|a right|control|questions?|options|time|any)";

export const BANNED_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ["you have <condition>", new RegExp(`\\byou have (?!${YOU_HAVE_OK}\\b)`, "i")],
  ["you are diagnosed", /\byou (?:are|were|have been) diagnosed\b/i],
  ["diagnosis of", /\bdiagnosis of\b/i],
  ["% chance", /\d+(?:\.\d+)?\s*%\s*(?:chance|risk|likely|likelihood|probability)/i],
  ["probability of", /\bprobability of\b/i],
  ["you are infertile", /\byou (?:are|might be|may be) infertile\b/i],
  ["cure", /\bcur(?:e|es|ed)\b/i],
  ["guaranteed", /\bguarantee(?:d|s)?\b/i],
  ["لديك متلازمة", /لديك\s+متلازمة/],
  ["تم تشخيصك", /تم\s+تشخيصك/],
  ["نسبة احتمال", /نسبة\s+احتمال/],
  ["أنت مصابة", /أنت\s+مصابة/],
];

export function violations(text: string): string[] {
  return BANNED_PATTERNS.filter(([, re]) => re.test(text ?? "")).map(([name]) => name);
}

export const isSafe = (text: string) => violations(text).length === 0;
