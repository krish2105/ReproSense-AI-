"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { enterAs } from "@/lib/enter";

export interface Clinic {
  id: string;
  name: string;
  region: string;
}

const REGIONS = [
  { value: "Abu Dhabi City", key: "abu_dhabi_city" },
  { value: "Al Ain", key: "al_ain" },
  { value: "Al Dhafra", key: "al_dhafra" },
] as const;
const STAGES = ["periods", "trying_to_conceive", "pregnancy", "after_birth", "perimenopause"] as const;
type Stage = (typeof STAGES)[number];
const ASKS_PERIOD: Stage[] = ["periods", "trying_to_conceive", "perimenopause"];

function shift(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Three short steps: what she controls (and that this is a demo), about her, one stage question. Only what she types
 * is stored. Sharing with the inviting clinic is a separate, unticked choice. Then she lands in her own record.
 */
export function JoinFlow({ inviter, refDate }: { inviter: Clinic | null; refDate: string }) {
  const t = useTranslations("join");
  const ts = useTranslations("stages");
  const tr = useTranslations("regions");
  const toast = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [region, setRegion] = useState<string>("");
  const [stage, setStage] = useState<Stage | "">("");
  const [lastPeriod, setLastPeriod] = useState("");
  const [weeks, setWeeks] = useState("");
  const [gdm, setGdm] = useState<"yes" | "no" | "unsure" | "">("");
  const [share, setShare] = useState(false);
  const [ai, setAi] = useState(false); // AI features stay off unless she ticks the box (DoH RAI 3.1.6.1)
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (step > 1) heading.current?.focus(); // each step announces itself (WCAG 2.4.3)
  }, [step]);

  const ageN = Number(age);
  const weeksN = Number(weeks);
  const step2Ok = name.trim().length > 0 && /\p{L}/u.test(name) && Number.isInteger(ageN) && ageN >= 18 && ageN <= 60 && region !== "" && stage !== "";
  const step3Ok =
    stage === "pregnancy" ? Number.isInteger(weeksN) && weeksN >= 1 && weeksN <= 42 : stage === "after_birth" ? Number.isInteger(weeksN) && weeksN >= 0 && weeksN <= 52 && weeks !== "" && gdm !== "" : true;

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) return setStep(2);
    if (step === 2) {
      if (!step2Ok) return setError(t("required"));
      setError(null);
      return setStep(3);
    }
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!step3Ok) return setError(t("required"));
    setError(null);
    setPending(true);
    try {
      await apiClient("/demo/signup", {
        body: {
          name: name.trim(),
          age: ageN,
          region,
          life_stage: stage,
          last_period_start: ASKS_PERIOD.includes(stage as Stage) && lastPeriod ? lastPeriod : null,
          pregnancy_weeks: stage === "pregnancy" ? weeksN : null,
          weeks_since_birth: stage === "after_birth" ? weeksN : null,
          gdm: stage === "after_birth" && gdm === "yes",
          clinic_id: inviter?.id ?? null,
          share_with_clinic: Boolean(inviter) && share,
          use_ai: ai,
          lang: document.documentElement.lang === "ar" ? "ar" : "en",
        },
      });
      enterAs("/app"); // a new identity: a full page load, nothing from the anonymous visit is reused
    } catch (err) {
      setPending(false);
      toast(t("failed", { detail: err instanceof ApiError ? err.detail : String(err) }));
    }
  };

  return (
    <div className="join">
      <div className="panel join-card">
        <p className="xs faint" aria-live="polite">
          {t("step", { n: step })}
        </p>
        {inviter && (
          <p className="tag t-soon" style={{ alignSelf: "flex-start" }}>
            {t("invitedBy", { clinic: inviter.name })}
          </p>
        )}

        {step === 1 && (
          <form method="post" onSubmit={next} className="join-step">
            <Image src="/images/app/onboarding-welcome.png" alt="" width={160} height={160} priority className="join-img" />
            <h1 className="page-title">{t("h1")}</h1>
            <p className="dim">{t("lede")}</p>
            <ul className="join-promises">
              <li>{t("promise1")}</li>
              <li>{t("promise2")}</li>
              <li>{t("promise3")}</li>
            </ul>
            <p className="notice" role="note">
              {t("demoNote")}
            </p>
            <Button type="submit" className="self-start">
              {t("continue")}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form method="post" onSubmit={next} className="join-step" noValidate>
            <h1 className="page-title" ref={heading} tabIndex={-1}>
              {t("aboutTitle")}
            </h1>
            <div className="field">
              <label htmlFor="join-name">{t("name")}</label>
              <input id="join-name" type="text" autoComplete="nickname" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="join-age">{t("age")}</label>
              <input id="join-age" className="num" type="number" inputMode="numeric" min={18} max={60} value={age} onChange={(e) => setAge(e.target.value)} aria-describedby="join-age-hint" required />
              <span id="join-age-hint" className="xs faint">
                {t("ageHint")}
              </span>
            </div>
            <fieldset className="field join-set">
              <legend className="label">{t("region")}</legend>
              <div className="seg">
                {REGIONS.map((r) => (
                  <label key={r.value} className="radio-pill">
                    <input type="radio" name="region" value={r.value} checked={region === r.value} onChange={() => setRegion(r.value)} />
                    <span>{tr(r.key)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="field join-set">
              <legend className="label">{t("stage")}</legend>
              <div className="seg">
                {STAGES.map((s) => (
                  <label key={s} className="radio-pill">
                    <input type="radio" name="stage" value={s} checked={stage === s} onChange={() => setStage(s)} />
                    <span>{ts(s)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {error && (
              <p className="s" role="alert" style={{ color: "var(--urgent)" }}>
                {error}
              </p>
            )}
            <div className="kv" style={{ justifyContent: "flex-start", gap: 10 }}>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                {t("back")}
              </Button>
              <Button type="submit">{t("continue")}</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form method="post" onSubmit={create} className="join-step" noValidate>
            <Image src="/images/app/onboarding-stage.png" alt="" width={120} height={120} className="join-img" />
            <h1 className="page-title" ref={heading} tabIndex={-1}>
              {t("detailsTitle")}
            </h1>
            {ASKS_PERIOD.includes(stage as Stage) && (
              <div className="field">
                <label htmlFor="join-period">{t("lastPeriod")}</label>
                <input id="join-period" type="date" min={shift(refDate, -120)} max={refDate} value={lastPeriod} onChange={(e) => setLastPeriod(e.target.value)} aria-describedby="join-period-hint" />
                <span id="join-period-hint" className="xs faint">
                  {t("lastPeriodHint")}
                </span>
              </div>
            )}
            {stage === "pregnancy" && (
              <div className="field">
                <label htmlFor="join-weeks">{t("weeksPregnant")}</label>
                <input id="join-weeks" className="num" type="number" inputMode="numeric" min={1} max={42} value={weeks} onChange={(e) => setWeeks(e.target.value)} required />
              </div>
            )}
            {stage === "after_birth" && (
              <>
                <div className="field">
                  <label htmlFor="join-born">{t("weeksSinceBirth")}</label>
                  <input id="join-born" className="num" type="number" inputMode="numeric" min={0} max={52} value={weeks} onChange={(e) => setWeeks(e.target.value)} required />
                </div>
                <fieldset className="field join-set">
                  <legend className="label">{t("gdm")}</legend>
                  <div className="seg">
                    {(["yes", "no", "unsure"] as const).map((v) => (
                      <label key={v} className="radio-pill">
                        <input type="radio" name="gdm" value={v} checked={gdm === v} onChange={() => setGdm(v)} />
                        <span>{t(v === "yes" ? "gdmYes" : v === "no" ? "gdmNo" : "gdmUnsure")}</span>
                      </label>
                    ))}
                  </div>
                  <span className="xs faint">{t("gdmHint")}</span>
                </fieldset>
              </>
            )}
            {inviter && (
              <label className="s join-share">
                <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
                <span>{t("share", { clinic: inviter.name })}</span>
              </label>
            )}
            <label className="s join-share">
              <input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} />
              <span>{t("useAi")}</span>
            </label>
            {error && (
              <p className="s" role="alert" style={{ color: "var(--urgent)" }}>
                {error}
              </p>
            )}
            <div className="kv" style={{ justifyContent: "flex-start", gap: 10 }}>
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={pending}>
                {t("back")}
              </Button>
              <Button type="submit" pending={pending}>
                {pending ? t("creating") : t("create")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
