import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { DemoOneTap } from "@/components/staffSignin/DemoOneTap";
import { DohDoor } from "@/components/staffSignin/DohDoor";
import { doorNotice, type DoorParams } from "@/components/staffSignin/doorNotice";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("staffAuth.doh");
  return { title: t("metaTitle") };
}

// The DoH door (the team's plan section 5): the network admin signs in with a passkey and an authenticator code.
// DoH accounts come only from the operator's CLI (backend app/security/create_doh_admin.py), never from sign-up.
export default async function DohSignInPage({ searchParams }: { searchParams: Promise<DoorParams> }) {
  const t = await getTranslations("staffAuth");
  const { notice } = await doorNotice(await searchParams);
  return (
    <div className="join">
      <div className="panel join-card">
        <h1 className="page-title">{t("doh.title")}</h1>
        <p className="dim">{t("doh.lede")}</p>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        <DohDoor />
        <section aria-labelledby="doh-none" className="box" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 id="doh-none" className="signin-h">
            {t("doh.noAccountTitle")}
          </h2>
          <p className="s dim">{t("doh.noAccountBody")}</p>
        </section>
        <section aria-labelledby="doh-staff" className="box" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 id="doh-staff" className="signin-h">
            {t("doh.staffTitle")}
          </h2>
          <ButtonLink href="/staff/signin" variant="outline" size="sm" className="self-start">
            {t("doh.staffLink")}
          </ButtonLink>
        </section>
        <DemoOneTap roles={["admin"]} />
        <p className="notice" role="note">
          {t("demoNote")}
        </p>
      </div>
    </div>
  );
}
