import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import type { StaffRole } from "@/lib/doors";

/** The judges' way in stays one tap (plan section 5): the demo staff area of the door's role, and the demo page. The
 *  area link is a plain link: /demo/enter signs in on the way, then opens the area with a full page load. */
export async function DemoOneTap({ roles }: { roles: StaffRole[] }) {
  const t = await getTranslations("staffAuth");
  return (
    <section aria-labelledby="demo-one-tap" className="box" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h2 id="demo-one-tap" className="signin-h">
        {t("demoTitle")}
      </h2>
      <p className="s dim">{t("demoBody")}</p>
      <div className="kv" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
        {roles.map((r) => (
          <a key={r} className="btn btn-o btn-sm" href={`/demo/enter?role=${r}`}>
            {t(`demoArea.${r}`)}
          </a>
        ))}
        <ButtonLink href="/demo" variant="outline" size="sm">
          {t("demoAll")}
        </ButtonLink>
      </div>
    </section>
  );
}
