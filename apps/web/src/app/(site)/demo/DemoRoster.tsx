"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { enterAs } from "@/lib/enter";
import type { LoginResponse, Persona } from "@/lib/api/types";
import { displayName, firstName, isolate, regionKey } from "@/lib/format";
import { tonesOf } from "@/lib/rules";

/** Roster rows exactly like the mockup's renderPeople(); "Open <name>'s record" signs in as her and opens her app. */
export function DemoRoster({ personas, storyLang }: { personas: Persona[]; storyLang?: string }) {
  const t = useTranslations();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  const open = (id: string) => {
    setBusy(id);
    start(async () => {
      try {
        await apiClient<LoginResponse>("/demo/login", { body: { persona: id } });
        enterAs("/app");
      } catch (e) {
        setBusy(null);
        toast(t("demo.failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });
  };

  const region = (r: string) => (t.has(`regions.${regionKey(r)}`) ? t(`regions.${regionKey(r)}`) : r);

  return (
    <ul className="roster" aria-label={t("demo.rosterLabel")}>
      {personas.map((p) => {
        const tones = tonesOf(p.rules);
        return (
          <li className="rrow" key={p.id}>
            <span className="ini" aria-hidden="true">
              {displayName(p.alias)[0]}
            </span>
            <div>
              <b>
                <bdi>{displayName(p.alias)}</bdi>
              </b>
              <br />
              <span className="s dim">{t("demo.ageRegion", { age: p.age, region: region(p.region) })}</span>
            </div>
            <p className="s story" lang={storyLang} dir="auto">
              {p.story}
            </p>
            <div className="obsl">
              {tones.length ? (
                tones.map((tone) => (
                  <Tag key={tone} tone={tone} className="me-1 mb-1">
                    {t(`tags.${tone}`)}
                  </Tag>
                ))
              ) : (
                <Tag tone="ok">{t("tags.ok")}</Tag>
              )}
              <br />
              <span className="xs faint">{t(`stages.${p.life_stage}`)}</span>
              {!p.shares_with_clinic && (
                <>
                  <br />
                  <span className="xs faint">{t("demo.noShare")}</span>
                </>
              )}
            </div>
            <Button variant="outline" size="sm" pending={busy === p.id} onClick={() => open(p.id)}>
              {t("demo.open", { name: isolate(firstName(p.alias)) })}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
