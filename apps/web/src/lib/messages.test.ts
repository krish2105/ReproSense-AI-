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

/** ICU argument names such as {name} or {count, plural, ...}; plural branches may differ by language. */
function args(s: string): string[] {
  return [...s.matchAll(/\{\s*([a-zA-Z_][\w]*)\s*(?:[,}])/g)].map((m) => m[1]!).filter((v, i, a) => a.indexOf(v) === i).sort();
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
