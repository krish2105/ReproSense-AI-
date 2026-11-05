import { getTranslations } from "next-intl/server";
import { Footer } from "@/components/chrome/Footer";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export default async function NotFound() {
  const t = await getTranslations("states");
  return (
    <>
      <SiteHeader variant="site" />
      <main id="main" className="wrap view">
        <EmptyState title={t("notFoundTitle")} body={t("notFoundBody")} headingLevel={1} action={<ButtonLink href="/demo">{t("notFoundAction")}</ButtonLink>} />
      </main>
      <Footer />
    </>
  );
}
