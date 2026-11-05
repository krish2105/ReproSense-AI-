import { describe, expect, it } from "vitest";
import { parseAnswer } from "./answer";

describe("assistant answers", () => {
  it("turns [n] markers into citations", () => {
    expect(parseAnswer("NICE advises a blood count. [1] Count pads. [2]")).toEqual([
      { kind: "text", text: "NICE advises a blood count." },
      { kind: "cite", n: 1 },
      { kind: "text", text: " Count pads." },
      { kind: "cite", n: 2 },
    ]);
  });
  it("keeps text without markers", () => {
    expect(parseAnswer("You deserve support right now.")).toEqual([{ kind: "text", text: "You deserve support right now." }]);
  });
  it("works in Arabic", () => {
    const p = parseAnswer("تُعدّ الدورة غير منتظمة. [1]");
    expect(p[1]).toEqual({ kind: "cite", n: 1 });
  });
});
