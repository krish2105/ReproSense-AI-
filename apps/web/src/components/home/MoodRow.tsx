"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Mood } from "@/lib/api/types";
import { MOODS, slug } from "@/lib/vocab";

/** Mood row of emoji chips (docs/06). Saves to today's entry with POST /v1/mood. */
export function MoodRow({ initial }: { initial: Mood | null }) {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const [mood, setMood] = useState<Mood | null>(initial);
  const [pending, start] = useTransition();
  return (
    <div className="moods" role="group" aria-label={t("home.moodLabel")} aria-busy={pending || undefined}>
      {MOODS.map((m) => (
        <button
          key={m.value}
          type="button"
          aria-pressed={mood === m.value}
          disabled={pending}
          onClick={() => {
            const prev = mood;
            setMood(m.value);
            start(async () => {
              try {
                await apiClient("/mood", { body: { mood: m.value } });
                toast(t("home.moodSaved", { mood: t(`moods.${slug(m.value)}`) }));
                router.refresh();
              } catch (e) {
                setMood(prev);
                toast(t("home.moodFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
              }
            });
          }}
        >
          <em aria-hidden="true">{m.emoji}</em>
          {t(`moods.${slug(m.value)}`)}
        </button>
      ))}
    </div>
  );
}
