import { describe, expect, it } from "vitest";
import { forgetThisTab } from "./signout";

function memory(entries: Record<string, string>) {
  const m = new Map(Object.entries(entries));
  return {
    get length() {
      return m.size;
    },
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => void m.delete(k),
    keys: () => [...m.keys()].sort(),
  };
}

describe("forgetThisTab (L7)", () => {
  it("drops her chat and share links, keeps the tour step and the wake flag", () => {
    const s = memory({ rs_chat_noura: "[]", rs_chat_sara: "[]", rs_share_tokens: "{}", rs_tour: "2", rs_woke: "1" });
    forgetThisTab(s);
    expect(s.keys()).toEqual(["rs_tour", "rs_woke"]);
  });

  it("does nothing without storage", () => {
    expect(() => forgetThisTab(undefined)).not.toThrow();
  });
});
