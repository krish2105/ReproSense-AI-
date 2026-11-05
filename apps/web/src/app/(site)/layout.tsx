import { NextIntlClientProvider } from "next-intl";
import { clientMessages } from "@/i18n/client-messages";
import { Footer } from "@/components/chrome/Footer";
import { SiteHeader } from "@/components/chrome/SiteHeader";

// Public pages: landing, demo roster, status, token gallery and shared reports. No session needed.
// Client components here get only the shared and "site" message namespaces (src/i18n/client-messages.ts).
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider messages={await clientMessages("site")}>
      <SiteHeader variant="site" />
      <main id="main" className="wrap view">
        {children}
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}
