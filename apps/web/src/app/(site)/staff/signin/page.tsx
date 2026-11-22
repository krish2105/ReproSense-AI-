import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DemoOneTap } from "@/components/staffSignin/DemoOneTap";
import { doorNotice, type DoorParams } from "@/components/staffSignin/doorNotice";
import { StaffDoor } from "@/components/staffSignin/StaffDoor";
import type { StaffRole } from "@/lib/doors";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("staffAuth.staff");
  return { title: t("metaTitle") };
}

// The staff door (the team's plan section 5): clinicians and clinic admins, passkey only. Separate from her sign-in
// (/signin) and from the DoH door (/doh/signin). A session that ended lands here with a notice saying why.
export default async function StaffSignInPage({ searchParams }: { searchParams: Promise<DoorParams> }) {
  const t = await getTranslations("staffAuth");
  const { notice, area } = await doorNotice(await searchParams);
  const roles: StaffRole[] = area === "clinic_admin" ? ["clinic_admin", "clinician"] : ["clinician", "clinic_admin"];
  return (
    <div className="join">
      <div className="panel join-card">
        <h1 className="page-title">{t("staff.title")}</h1>
        <p className="dim">{t("staff.lede")}</p>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {/* docs/31 §D: most visitors are judges, so the one-tap demo comes first, then the real staff door */}
        <DemoOneTap roles={roles} />
        <StaffDoor />
        <p className="notice" role="note">
          {t("demoNote")}
        </p>
      </div>
    </div>
  );
}
