import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInFlow } from "@/components/signin/SignInFlow";
import { apiServer } from "@/lib/api/server";
import type { AuthMethods } from "@/lib/api/types";
import { isEnded } from "@/lib/doors";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signin");
  return { title: t("metaTitle") };
}

// Her own sign-in (K5, docs/24): a record she started on /join opens again on any device with a passkey, or with an
// email code when the server can send email (otherwise that option is not shown). Demo people stay one tap on /demo.
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ ended?: string; signed_out?: string }> }) {
  const t = await getTranslations("signin");
  const { ended, signed_out } = await searchParams;
  // Her sessions have no idle rule; a session that ended here was signed out (from Privacy) or expired.
  const notice = isEnded(ended) ? t(ended === "revoked" ? "ended.revoked" : "ended.expired") : signed_out === "1" ? t("ended.signedOut") : undefined;
  let methods: AuthMethods = { passkey: true, email: false };
  try {
    methods = await apiServer<AuthMethods>("/auth/methods");
  } catch {
    /* the passkey path still shows; its own call reports a server that is down */
  }
  return <SignInFlow emailAvailable={methods.email} notice={notice} />;
}
