"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { webglAvailable } from "@/components/landing/webgl";
import type { YearBead, YearDiamond } from "./yearBeads";

const YearSpiral3D = dynamic(() => import("@/components/landing/YearSpiral3D"), { ssr: false });

/** Her year in 3D on the timeline (A4). Shown only with WebGL and motion allowed, when it nears the screen; otherwise
 *  nothing is drawn here and the 2D year chart below (always on the page) carries the same days for everyone,
 *  including screen readers. Tapping a bead opens that day in the calendar. */
export function YearSection3D({
  beads,
  diamonds,
  loops,
  title,
  hint,
  label,
}: {
  beads: YearBead[];
  diamonds: YearDiamond[];
  loops: number;
  title: string;
  hint: string;
  label: string;
}) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const [can3d, setCan3d] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    let probed = false;
    const io = new IntersectionObserver(
      (es) => {
        const on = Boolean(es[0]?.isIntersecting);
        if (on && !probed) {
          probed = true;
          setCan3d(webglAvailable());
        }
        setVisible(on);
      },
      { rootMargin: "200px" },
    );
    if (box.current) io.observe(box.current);
    return () => {
      mq.removeEventListener("change", onChange);
      io.disconnect();
    };
  }, []);

  const show = can3d && !reduced && loops > 0;
  return (
    // The observed box is always in the page (empty until 3D can show), so the probe can run.
    <div ref={box}>
      {show && (
        <section className="box" aria-labelledby="y3d-title" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 id="y3d-title" style={{ fontSize: 17 }}>
            {title}
          </h2>
          <p className="xs faint">{hint}</p>
          <div className="panel y3d" data-3d={ready ? "ready" : "loading"} style={{ background: "transparent", height: 380 }}>
            {visible && <YearSpiral3D beads={beads} diamonds={diamonds} loops={loops} animate onPick={(d) => router.push(`/app/log?date=${d}`)} onReady={() => setReady(true)} />}
            <span className="sr-only">{label}</span>
          </div>
        </section>
      )}
    </div>
  );
}
