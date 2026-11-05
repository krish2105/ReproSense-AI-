"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import "./three-console";
import { beadsOf, type BeadKind, type SpiralCycle } from "./spiral";
import { SceneLights } from "./SceneLights";
import { useCssColors } from "./useCssColors";

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
  const c = useCssColors({ bleed: "--ph-m", late: "--ph-l", day: "--ph-f", band: "--ok" });
  const colors = { bleed: c.bleed, late: c.late, day: c.day };
  const K = cycles.length;
  return (
    <Canvas flat frameloop={animate ? "always" : "demand"} dpr={[1, 1.75]} camera={{ position: [0, 1.5, 12.5], fov: 38 }} gl={{ antialias: true, alpha: true }} aria-hidden="true">
      <SceneLights ambient={0.8} fill={0.45} />
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
