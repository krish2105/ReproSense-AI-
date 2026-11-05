import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JoinFlow, type Clinic } from "@/components/join/JoinFlow";
import { apiServer } from "@/lib/api/server";
import { getPersonas } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("join");
  return { title: t("metaTitle") };
}

// Start your own demo record (MVP scorecard: sign up, consent, log and see value in under three minutes). A clinic's
// patient QR opens this page with ?clinic=<id>; the clinic id is not personal data, and sharing stays her choice.
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ clinic?: string }> }) {
  const { clinic } = await searchParams;
  const [{ clinics }, personas] = await Promise.all([apiServer<{ clinics: Clinic[] }>("/demo/clinics"), getPersonas()]);
  const inviter = clinics.find((c) => c.id === clinic) ?? null;
  return <JoinFlow inviter={inviter} refDate={personas.ref_date} />;
}
