import { NextIntlClientProvider } from "next-intl";
import { clientMessages } from "@/i18n/client-messages";
import { Footer } from "@/components/chrome/Footer";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { requireRole } from "@/lib/session";

// One clinic's admin area (A3, API K4): clinic_admin role only, its own layout, separate from her app, the clinician
// view and the network admin (CLAUDE.md rule 9).
export default async function ClinicAdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("clinic_admin");
  return (
    <NextIntlClientProvider messages={await clientMessages("clinicAdmin")}>
      <SiteHeader variant="clinicAdmin" />
      <main id="main" className="wrap view">
        {children}
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}
