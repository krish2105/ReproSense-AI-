"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { webglAvailable } from "@/components/landing/webgl";
import { Tag } from "@/components/ui/Tag";
import type { Tone } from "@/lib/rules";
import type { RingMilestone, SegmentKind } from "./pregnancyRing";

const PregnancyRing3D = dynamic(() => import("./PregnancyRing3D"), { ssr: false });

export interface RingItem extends RingMilestone {
  label: string;
  when: string;
  statusLabel: string | null;
}
const TONE: Record<NonNullable<RingMilestone["status"]>, Tone> = { done: "ok", due: "soon", upcoming: "info", not_recorded: "info" };

/** Her pregnancy and the 12 weeks after the birth on a 3D ring (A7). Shown only with WebGL and motion allowed, when
 *  it nears the screen; otherwise `fallback` (the 2D arc) shows in its place, so Home never draws the same weeks twice.
 *  The list under the ring carries every milestone for keyboard and screen readers. It starts folded, because the
 *  postnatal card below lists the same steps with their actions; tapping a band on the ring opens it at that row. */
export function PregnancyRingSection({
  segments,
  now,
  items,
  text,
  fallback,
}: {
  segments: { week: number; kind: SegmentKind }[];
  now: number;
  items: RingItem[];
  text: { title: string; hint: string; now: string; sources: string; list: string; legend: Record<SegmentKind, string> };
  fallback?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [can3d, setCan3d] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(items.find((i) => i.status === "due" || i.status === null)?.key ?? null);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    const io = new IntersectionObserver(
      (es) => {
        if (es[0]?.isIntersecting) {
          io.disconnect();
          setCan3d(webglAvailable());
        }
      },
      { rootMargin: "200px" },
    );
    if (box.current) io.observe(box.current);
    return () => {
      mq.removeEventListener("change", onChange);
      io.disconnect();
    };
  }, []);

  const show = can3d && !reduced;
  const pick = (key: string) => setSelected((s) => (s === key ? null : key));
  const pickOnRing = (key: string) => {
    setListOpen(true);
    pick(key);
  };
  return (
    <div ref={box}>
      {!show && fallback}
      {show && (
        <section className="box" aria-labelledby="ring3d-title" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 id="ring3d-title" style={{ fontSize: 17 }}>
            {text.title}
          </h2>
          <p className="xs faint">{text.hint}</p>
          <div className="ring3d" data-3d={ready ? "ready" : "loading"}>
            <PregnancyRing3D segments={segments} now={now} milestones={items} selected={selected} onPick={pickOnRing} onReady={() => setReady(true)} />
            <span className="ring3d-now" aria-hidden="true">
              {text.now}
            </span>
          </div>
          <ul className="leg" style={{ justifyContent: "center", listStyle: "none", padding: 0, margin: 0 }} aria-hidden="true">
            {(Object.keys(text.legend) as SegmentKind[]).map((k) => (
              <li key={k}>
                <i style={{ background: `var(${k === "t1" ? "--ph-o" : k === "t2" ? "--ph-m" : k === "t3" ? "--ph-l" : "--ok"})` }} />
                {text.legend[k]}
              </li>
            ))}
          </ul>
          <p className="sr-only">{text.now}</p>
          <details className="ring3d-more" open={listOpen} onToggle={(e) => setListOpen(e.currentTarget.open)}>
            <summary className="s">{text.list}</summary>
          <ul className="ring3d-list" aria-label={text.list}>
            {items.map((i) => (
              <li key={i.key}>
                <button type="button" aria-pressed={selected === i.key} aria-expanded={selected === i.key} onClick={() => pick(i.key)}>
                  <span className="s">{i.label}</span>
                  <span className="xs faint">{i.when}</span>
                  {i.status && i.statusLabel && <Tag tone={TONE[i.status]}>{i.statusLabel}</Tag>}
                </button>
                {selected === i.key && i.sources.length > 0 && (
                  <p className="xs faint" style={{ margin: "6px 12px 0" }}>
                    {text.sources}:{" "}
                    {i.sources.map((s, n) => (
                      <span key={s.id}>
                        {n > 0 && "; "}
                        <a href={s.url} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">
                          {s.title}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>
          </details>
        </section>
      )}
    </div>
  );
}
