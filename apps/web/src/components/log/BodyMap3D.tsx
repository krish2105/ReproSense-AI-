"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import "@/components/landing/three-console";
import { SceneLights } from "@/components/landing/SceneLights";
import { useCssColors } from "@/components/landing/useCssColors";
import type { PainSite } from "@/lib/api/types";

/** Pain regions on the figure. Facing the camera, HER left side is on the viewer's right (+x). */
const REGIONS: ReadonlyArray<{ site: PainSite; pos: [number, number, number]; size: [number, number, number] }> = [
  { site: "upper abdomen", pos: [0, 1.05, 0.44], size: [0.42, 0.3, 0.12] },
  { site: "lower abdomen", pos: [0, 0.3, 0.46], size: [0.4, 0.28, 0.12] },
  { site: "right pelvis", pos: [-0.46, -0.12, 0.4], size: [0.24, 0.22, 0.12] },
  { site: "left pelvis", pos: [0.46, -0.12, 0.4], size: [0.24, 0.22, 0.12] },
  { site: "lower back", pos: [0, 0.35, -0.44], size: [0.46, 0.3, 0.12] },
];

function Figure({ color }: { color: THREE.Color }) {
  const m = <meshStandardMaterial color={color} roughness={0.65} />;
  return (
    <group>
      <mesh position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        {m}
      </mesh>
      <mesh position={[0, 2.02, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.3, 16]} />
        {m}
      </mesh>
      {/* torso, flattened front to back */}
      <mesh position={[0, 0.95, 0]} scale={[1, 1, 0.58]}>
        <capsuleGeometry args={[0.74, 1.15, 8, 32]} />
        {m}
      </mesh>
      {/* hips */}
      <mesh position={[0, -0.12, 0]} scale={[1, 0.62, 0.6]}>
        <sphereGeometry args={[0.78, 32, 24]} />
        {m}
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.02, 0.95, 0]} rotation={[0, 0, s * 0.12]}>
            <capsuleGeometry args={[0.18, 1.5, 8, 16]} />
            {m}
          </mesh>
          <mesh position={[s * 0.38, -1.55, 0]}>
            <capsuleGeometry args={[0.28, 1.9, 8, 16]} />
            {m}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Turn({ side, children }: { side: "front" | "back"; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  // Demand frameloop: keep asking for frames until the turn reaches its target.
  useFrame(({ invalidate }) => {
    const g = ref.current;
    if (!g) return;
    const target = side === "front" ? 0 : Math.PI;
    const d = target - g.rotation.y;
    if (Math.abs(d) < 0.002) {
      g.rotation.y = target;
      return;
    }
    g.rotation.y += d * 0.16;
    invalidate();
  });
  return <group ref={ref}>{children}</group>;
}

/** The 3D body pain map (A1). Simple shapes only (no downloaded anatomy models). Each region's colour runs from
 *  light to magenta with her painful days in the last 3 months; tapping a region toggles it in the log form.
 *  The canvas is aria-hidden: the toggle list next to it carries the same choices for keyboard and screen readers. */
export default function BodyMap3D({
  side,
  selected,
  level,
  onToggle,
  onReady,
}: {
  side: "front" | "back";
  selected: readonly PainSite[];
  level: Record<PainSite, number>;
  onToggle: (site: PainSite) => void;
  onReady: () => void;
}) {
  const c = useCssColors({ body: "--ink-3", cool: "--ph-o", hot: "--ph-m", pick: "--ph-l" });
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    document.body.style.cursor = "";
  };
  return (
    <Canvas
      flat
      frameloop="demand"
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 9.2], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={onReady}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0 }}
    >
      <SceneLights ambient={0.85} fill={0.45} />
      <Turn side={side}>
        <Figure color={c.body} />
        {REGIONS.map((r) => {
          const on = selected.includes(r.site);
          const col = on ? c.pick : c.cool.clone().lerp(c.hot, level[r.site] ?? 0);
          return (
            <mesh
              key={r.site}
              position={r.pos}
              scale={on ? r.size.map((v) => v * 1.18) as [number, number, number] : r.size}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(r.site);
              }}
              onPointerOver={over}
              onPointerOut={out}
            >
              <sphereGeometry args={[1, 32, 24]} />
              <meshStandardMaterial color={col} roughness={0.5} />
            </mesh>
          );
        })}
      </Turn>
    </Canvas>
  );
}
