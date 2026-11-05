"use client";

import { useTranslations } from "next-intl";
import { DemoBadge } from "@/components/chrome/DemoBadge";
import { Footer } from "@/components/chrome/Footer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";

// Errors above any area layout: render the badge and footer here so the screen still carries them.
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("states");
  return (
    <>
      <main id="main" className="wrap view">
        <p style={{ marginBottom: 16 }}>
          <DemoBadge />
        </p>
        <ErrorState
          headingLevel={1}
          title={t("errorTitle")}
          body={t("errorBody")}
          action={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <Button variant="outline" size="sm" onClick={reset}>
                {t("retry")}
              </Button>
              <ButtonLink variant="outline" size="sm" href="/demo">
                {t("notFoundAction")}
              </ButtonLink>
            </div>
          }
        />
      </main>
      <Footer />
    </>
  );
}
