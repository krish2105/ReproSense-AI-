"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { project, RING, ringPoint, type RingBead } from "./ring";
import { webglAvailable } from "./webgl";

// The canvas code is split out and fetched only after the page is idle (never in the first-load JS).
const HeroRing3D = dynamic(() => import("./HeroRing3D"), { ssr: false });

const FILL = { period: "var(--ph-m)", follicular: "var(--ph-f)", fertile: "var(--ph-o)", luteal: "var(--ph-l)" } as const;
const round = (n: number) => Math.round(n * 10_000) / 10_000; // server and browser trig differ in the last digits

/** The same ring, flat, in the resting pose of the 3D scene, so the swap to WebGL doesn't move a bead. */
function RingPoster({ beads, hidden }: { beads: RingBead[]; hidden: boolean }) {
  const drawn = beads
    .map((b) => {
      const p = project(ringPoint(b.angle));
      return { b, x: round(p.x), y: round(-p.y), r: round(RING.bead[b.size] * p.scale), depth: p.depth };
    })
    .sort((a, b) => a.depth - b.depth); // far beads first
  const track = Array.from({ length: 97 }, (_, i) => {
    const p = project(ringPoint((i / 96) * Math.PI * 2));
    return `${round(p.x)},${round(-p.y)}`;
  }).join(" ");
  return (
    <svg viewBox="-1 -1 2 2" preserveAspectRatio="xMidYMid meet" className={hidden ? "is-hidden" : undefined} aria-hidden="true" focusable="false">
      <polyline points={track} fill="none" stroke="var(--ph-l)" strokeOpacity="0.35" strokeWidth="0.012" />
      {drawn.map(({ b, x, y, r }) => (
        <circle key={b.day} cx={x} cy={y} r={r} fill={b.size === "today" ? "var(--plum)" : FILL[b.phase]} opacity={b.future ? 0.65 : 1} />
      ))}
    </svg>
  );
}

const WIDE = "(min-width: 541px)"; // below this the phone fills the column and the ring is hidden (globals.css)
const STILL = "(prefers-reduced-motion: reduce)";

/** Hero visual (mockup .hero-vis): the phone tilts towards a mouse pointer, the ring of her cycle days turns
 *  behind it. Reduced motion, no WebGL or a narrow screen keep the still poster and an upright phone. */
export function HeroStage({ beads, label, children }: { beads: RingBead[]; label: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const tilt = useRef({ x: 0, y: 0 });
  const [mount3d, setMount3d] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const still = window.matchMedia(STILL);
    const wide = window.matchMedia(WIDE);
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const SIGNS = ["pointermove", "pointerdown", "scroll", "keydown", "touchstart"] as const;
    const unlisten = () => SIGNS.forEach((ev) => window.removeEventListener(ev, start));
    const cancel = () => {
      unlisten();
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) clearTimeout(timer);
      idle = timer = undefined;
    };
    const go = () => {
      if (webglAvailable()) setMount3d(true);
    };
    // three.js and its shaders cost a few hundred ms of main thread. They start only once someone is using the
    // page (pointer, scroll, key, touch) or after 8 s, and then still wait for an idle moment, so they never
    // compete with the first load. The poster shows the same ring until then.
    function start() {
      cancel();
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(go, { timeout: 2000 });
      else timer = setTimeout(go, 300);
    }
    const schedule = () => {
      cancel();
      if (still.matches || !wide.matches) return;
      SIGNS.forEach((ev) => window.addEventListener(ev, start, { once: true, passive: true }));
      timer = setTimeout(start, 8000);
    };
    const onStill = () => {
      if (still.matches) {
        cancel();
        setMount3d(false);
        setReady(false);
      } else schedule();
    };
    schedule();
    still.addEventListener("change", onStill);
    wide.addEventListener("change", schedule);
    const io = new IntersectionObserver((es) => setVisible(Boolean(es[0]?.isIntersecting)));
    if (root.current) io.observe(root.current);
    return () => {
      cancel();
      still.removeEventListener("change", onStill);
      wide.removeEventListener("change", schedule);
      io.disconnect();
    };
  }, []);

  const phone = () => root.current?.querySelector<HTMLElement>(".mini") ?? null;
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !root.current) return;
    if (window.matchMedia(STILL).matches || !window.matchMedia(WIDE).matches) return;
    const b = root.current.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width - 0.5;
    const y = (e.clientY - b.top) / b.height - 0.5;
    tilt.current = { x, y };
    const el = phone();
    if (el) el.style.transform = `rotateY(${(x * 16).toFixed(2)}deg) rotateX(${(-y * 12).toFixed(2)}deg) rotate(-3deg)`;
  };
  const onLeave = () => {
    tilt.current = { x: 0, y: 0 };
    const el = phone();
    if (el) el.style.transform = "";
  };

  return (
    <div ref={root} className="hero-vis has-phone" role="group" aria-label={label} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div id="hero3d" aria-hidden="true">
        <RingPoster beads={beads} hidden={ready} />
        {mount3d && <HeroRing3D beads={beads} animate={visible} tilt={tilt} onReady={() => setReady(true)} />}
      </div>
      {children}
    </div>
  );
}
