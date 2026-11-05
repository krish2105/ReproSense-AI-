import { NextIntlClientProvider } from "next-intl";
import { clientMessages } from "@/i18n/client-messages";
import { Footer } from "@/components/chrome/Footer";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { requireRole } from "@/lib/session";

// Clinician area: clinician role only, its own layout (CLAUDE.md rule 9).
export default async function ClinicLayout({ children }: { children: React.ReactNode }) {
  await requireRole("clinician");
  return (
    <NextIntlClientProvider messages={await clientMessages("clinic")}>
      <SiteHeader variant="clinic" />
      <main id="main" className="wrap view">
        {children}
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}
