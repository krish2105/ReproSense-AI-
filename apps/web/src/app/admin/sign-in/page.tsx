import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StaffSignInPage } from "@/components/staff/StaffSignInPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("staffAuth.panel");
  return { title: t("metaTitle") };
}

// Your sign-in (plan section 5): this session, passkeys, signed-in devices, sign out and sign out everywhere.
export default function SignInSettingsPage() {
  return <StaffSignInPage door="/doh/signin" />;
}
