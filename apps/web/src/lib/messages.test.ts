import { parse, TYPE, type MessageFormatElement } from "@formatjs/icu-messageformat-parser";
import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { violations } from "./copy-guard";

type Tree = { [k: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else Object.assign(out, flatten(v, key));
  }
  return out;
}

/** ICU argument names, found with the real ICU parser (plural/select branches may differ by language). */
function args(s: string): string[] {
  const names = new Set<string>();
  const walk = (els: MessageFormatElement[]) => {
    for (const el of els) {
      if (el.type === TYPE.argument || el.type === TYPE.number || el.type === TYPE.date || el.type === TYPE.time) names.add(el.value);
      if (el.type === TYPE.plural || el.type === TYPE.select) {
        names.add(el.value);
        for (const opt of Object.values(el.options)) walk(opt.value);
      }
      if (el.type === TYPE.tag) walk(el.children);
    }
  };
  walk(parse(s));
  return [...names].sort();
}

const EN = flatten(en as Tree);
const AR = flatten(ar as Tree);

describe("messages", () => {
  it("English and Arabic have the same keys", () => {
    expect(Object.keys(AR).sort()).toEqual(Object.keys(EN).sort());
  });
  it("no empty strings", () => {
    for (const [k, v] of [...Object.entries(EN), ...Object.entries(AR)]) expect(v.trim(), k).not.toBe("");
  });
  it("ICU arguments match across languages", () => {
    for (const k of Object.keys(EN)) expect(args(AR[k] ?? ""), k).toEqual(args(EN[k]!));
  });
  it("no diagnostic wording or fake probabilities in any UI string", () => {
    for (const [k, v] of [...Object.entries(EN), ...Object.entries(AR)]) expect(violations(v), `${k}: ${v}`).toEqual([]);
  });
  it("the footer carries every disclosure", () => {
    expect(EN["chrome.footer"]).toBe("ReproSense gives information, not a diagnosis. In an emergency call 998. Demo data is fictional. Built with AI tools.");
    expect(AR["chrome.footer"]).toContain("998");
    expect(EN["chrome.badge"]).toBe("Demo data — fictional");
  });
});
