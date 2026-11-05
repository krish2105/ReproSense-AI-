import { NextIntlClientProvider } from "next-intl";
import { clientMessages } from "@/i18n/client-messages";
import { Footer } from "@/components/chrome/Footer";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { requireRole } from "@/lib/session";

// Clinic-network admin area: admin role only, its own layout.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return (
    <NextIntlClientProvider messages={await clientMessages("admin")}>
      <SiteHeader variant="admin" />
      <main id="main" className="wrap view">
        {children}
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}
