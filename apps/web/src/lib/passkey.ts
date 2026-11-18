import { browserSupportsWebAuthn, startAuthentication, startRegistration, WebAuthnError } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { apiClient } from "./api/client";
import type { SignedIn } from "./api/types";

// Her own sign-in (K5). The API makes a one-time challenge, her device signs it after Face ID, a fingerprint or the
// phone PIN, and the API checks the signature with the public key it saved. Nothing biometric reaches the server.

export const passkeysSupported = (): boolean => typeof window !== "undefined" && browserSupportsWebAuthn();

export type PasskeyProblem = "cancelled" | "already" | "unsupported" | "failed";

/** Names what went wrong in the device prompt, so the screen can say what to do next. API errors are ApiError. */
export function passkeyProblem(e: unknown): PasskeyProblem {
  if (e instanceof WebAuthnError && e.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") return "already";
  const names = [e instanceof Error ? e.name : "", e instanceof Error && e.cause instanceof Error ? e.cause.name : ""];
  if (names.some((n) => n === "NotAllowedError" || n === "AbortError")) return "cancelled"; // closed, or timed out
  if (names.includes("NotSupportedError") || !passkeysSupported()) return "unsupported";
  return "failed";
}

/** Adds a passkey on this device to the signed-in record (Privacy). */
export async function addPasskey(): Promise<void> {
  const optionsJSON = await apiClient<PublicKeyCredentialCreationOptionsJSON>("/auth/passkey/register/options", { method: "POST" });
  const credential = await startRegistration({ optionsJSON });
  await apiClient("/auth/passkey/register/verify", { body: { credential } });
}

/** Signs in with a passkey this device holds for the site (no name or address typed). */
export async function signInWithPasskey(): Promise<SignedIn> {
  const optionsJSON = await apiClient<PublicKeyCredentialRequestOptionsJSON>("/auth/passkey/login/options", { method: "POST" });
  const credential = await startAuthentication({ optionsJSON });
  return apiClient<SignedIn>("/auth/passkey/login/verify", { body: { credential } });
}
