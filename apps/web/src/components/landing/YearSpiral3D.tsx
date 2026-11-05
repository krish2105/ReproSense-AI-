"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { beadsOf, type BeadKind, type SpiralCycle } from "./spiral";

// Colours follow the theme: read from CSS variables, re-read when data-theme or the system scheme changes.
function useThemeColors() {
  const read = () => {
    const cs = getComputedStyle(document.documentElement);
    const c = (v: string) => new THREE.Color(cs.getPropertyValue(v).trim() || "#C9559F");
    return { bleed: c("--ph-m"), late: c("--ph-l"), day: c("--ph-f"), band: c("--ok") };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const update = () => setColors(read());
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", update);
    };
  }, []);
  return colors;
}

function Beads({ cycles, kind, radius, colors }: { cycles: SpiralCycle[]; kind: "small" | "big"; radius: number; colors: Record<BeadKind, THREE.Color> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const beads = useMemo(() => beadsOf(cycles).filter((b) => (kind === "big" ? b.kind === "bleed" : b.kind !== "bleed")), [cycles, kind]);
  const K = cycles.length;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Object3D();
    beads.forEach((b, i) => {
      const y = (b.cycle + b.day / (cycles[b.cycle]?.length ?? 1)) * 0.62 - K * 0.31;
      m.position.set(Math.cos(b.angle) * 3.1, y, Math.sin(b.angle) * 3.1);
      m.updateMatrix();
      mesh.setMatrixAt(i, m.matrix);
      mesh.setColorAt(i, colors[b.kind]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [beads, colors, cycles, K]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, beads.length]}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial roughness={0.4} metalness={0.05} />
    </instancedMesh>
  );
}

/** The year spiral (landing). Loaded only on the client, only when visible, only with WebGL (see SpiralSection). */
export default function YearSpiral3D({ cycles, animate }: { cycles: SpiralCycle[]; animate: boolean }) {
  const c = useThemeColors();
  const colors = { bleed: c.bleed, late: c.late, day: c.day };
  const K = cycles.length;
  return (
    <Canvas frameloop={animate ? "always" : "demand"} dpr={[1, 1.75]} camera={{ position: [0, 1.5, 12.5], fov: 38 }} gl={{ antialias: true, alpha: true }} aria-hidden="true">
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 6]} intensity={0.9} />
      <directionalLight position={[-5, -2, 3]} intensity={0.45} color="#ffd6ec" />
      <group rotation={[0.25, 0, 0]}>
        <Beads cycles={cycles} kind="small" radius={0.11} colors={colors} />
        <Beads cycles={cycles} kind="big" radius={0.17} colors={colors} />
        <mesh>
          <cylinderGeometry args={[3.25, 3.25, K * 0.62 + 0.6, 64, 1, true]} />
          <meshStandardMaterial color={c.band} transparent opacity={0.07} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={animate} autoRotateSpeed={0.7} minPolarAngle={0.6} maxPolarAngle={2.2} />
    </Canvas>
  );
}
