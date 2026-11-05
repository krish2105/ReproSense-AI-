// How a rule id is shown as a tag. The rule logic itself lives only in rules/clinical_rules.yaml.
export type Tone = "urgent" | "soon" | "discuss" | "ok" | "info";

export function toneOfRule(ruleId: string): Exclude<Tone, "ok" | "info"> {
  if (ruleId.startsWith("RF")) return "urgent";
  if (ruleId.startsWith("CARE_")) return "soon";
  return "discuss";
}

const ORDER: Record<string, number> = { urgent: 0, soon: 1, discuss: 2 };

/** Distinct tones for a list of rule ids, most urgent first. */
export function tonesOf(rules: readonly string[] | null | undefined): Exclude<Tone, "ok" | "info">[] {
  const set = new Set((rules ?? []).map(toneOfRule));
  return [...set].sort((a, b) => (ORDER[a] ?? 9) - (ORDER[b] ?? 9));
}
