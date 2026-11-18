// Read-aloud text (A5). Each builder reads only what the screen shows for that item: the folded "what to consider"
// and "questions" sections of a card are never read, and citation markers like [1] are dropped.

const sentence = (s: string) => {
  const t = s.trim();
  return t && !/[.!?؟۔]$/.test(t) ? `${t}.` : t;
};
const join = (parts: string[]) => parts.map(sentence).filter(Boolean).join(" ");
const sourceLine = (label: string, titles: string[]) => (titles.length ? `${label}: ${titles.join("; ")}` : "");

export function cardText(
  card: { title: string; summary: string; explains?: string | null; sources: ReadonlyArray<{ title: string }> },
  sourcesLabel: string,
): string {
  return join([card.title, card.summary, card.explains ?? "", sourceLine(sourcesLabel, card.sources.map((s) => s.title))]);
}

export function answerText(a: { answer: string; citations: ReadonlyArray<{ n: number; title: string }> }, sourcesLabel: string): string {
  const body = a.answer.replace(/\s*\[\d{1,2}\]/g, "");
  return join([...body.split(/(?<=[.!?؟])\s+/), sourceLine(sourcesLabel, a.citations.map((c) => c.title))]);
}

export function reportText(r: { lines: string[]; redFlags: string[]; patterns: string[] }, labels: { redFlags: string; patterns: string }): string {
  return join([
    ...r.lines,
    r.redFlags.length ? `${labels.redFlags}: ${r.redFlags.join("; ")}` : "",
    r.patterns.length ? `${labels.patterns}: ${r.patterns.join("; ")}` : "",
  ]);
}

/** A voice for the app's language ("ar" or "en"), preferring the browser's default among them. */
export function pickVoice<V extends { lang: string; default: boolean }>(voices: readonly V[], locale: string): V | undefined {
  const mine = voices.filter((v) => v.lang.toLowerCase().startsWith(locale));
  return mine.find((v) => v.default) ?? mine[0];
}
