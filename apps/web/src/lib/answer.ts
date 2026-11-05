/** Splits an assistant answer into text and citation markers: "A. [1] B. [2]" → text, cite 1, text, cite 2. */
export type AnswerPart = { kind: "text"; text: string } | { kind: "cite"; n: number };

export function parseAnswer(answer: string): AnswerPart[] {
  const parts: AnswerPart[] = [];
  const re = /\s*\[(\d{1,2})\]/g;
  let last = 0;
  for (const m of answer.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ kind: "text", text: answer.slice(last, at) });
    parts.push({ kind: "cite", n: Number(m[1]) });
    last = at + m[0].length;
  }
  if (last < answer.length) parts.push({ kind: "text", text: answer.slice(last) });
  return parts;
}
