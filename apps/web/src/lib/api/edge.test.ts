import { describe, expect, it } from "vitest";
import { edgeHeaders, visitorAddress } from "./edge";

describe("edge headers (docs/31 §H, H2)", () => {
  it("adds nothing without a secret", () => {
    expect(edgeHeaders("203.0.113.7", undefined)).toEqual({});
    expect(edgeHeaders("203.0.113.7", "")).toEqual({});
  });

  it("vouches for the visitor, first entry only", () => {
    expect(edgeHeaders("203.0.113.7, 76.76.21.21", "s")).toEqual({ "x-rs-edge": "s", "x-forwarded-for": "203.0.113.7" });
    expect(edgeHeaders("2001:db8::1", "s")).toEqual({ "x-rs-edge": "s", "x-forwarded-for": "2001:db8::1" });
  });

  it("never passes on something that is not an address", () => {
    expect(visitorAddress("evil<script>, 1.2.3.4")).toBeNull();
    expect(visitorAddress("")).toBeNull();
    expect(edgeHeaders("not-an-ip", "s")).toEqual({ "x-rs-edge": "s" });
  });
});
