import { WebAuthnError } from "@simplewebauthn/browser";
import { describe, expect, it } from "vitest";
import { passkeyProblem } from "./passkey";

const domError = (name: string) => Object.assign(new Error(name), { name });

describe("passkeyProblem", () => {
  it("a closed or timed-out device prompt is a cancel, not a failure", () => {
    expect(passkeyProblem(domError("NotAllowedError"))).toBe("cancelled");
    expect(passkeyProblem(domError("AbortError"))).toBe("cancelled");
    expect(passkeyProblem(new WebAuthnError({ message: "x", code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: domError("NotAllowedError") }))).toBe("cancelled");
  });
  it("a device that already holds her passkey says so", () => {
    expect(passkeyProblem(new WebAuthnError({ message: "x", code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED", cause: domError("InvalidStateError") }))).toBe("already");
  });
  it("a browser without WebAuthn is named as such", () => {
    expect(passkeyProblem(new Error("boom"))).toBe("unsupported"); // vitest runs in Node: no PublicKeyCredential
  });
});
