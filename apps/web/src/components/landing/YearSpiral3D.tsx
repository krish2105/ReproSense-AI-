"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import "./three-console";
import type { BeadKind } from "./spiral";
import { SceneLights } from "./SceneLights";
import { useCssColors } from "./useCssColors";

/** Anything placed on the spiral: which loop (cycle) and where on it (0..2π). */
export interface SpiralPoint {
  cycle: number;
  angle: number;
}
export interface SpiralBead extends SpiralPoint {
  kind: BeadKind;
  ring?: boolean; // pain 7 or more (her timeline)
  date?: string; // tappable when set
}

const R = 3.1;
const STEP = 0.62;
const pos = (p: SpiralPoint, loops: number, r = R): [number, number, number] => [
  Math.cos(p.angle) * r,
  (p.cycle + p.angle / (Math.PI * 2)) * STEP - loops * (STEP / 2),
  Math.sin(p.angle) * r,
];

/** One instanced mesh (one draw call) per shape; colour per instance. */
function Instances<T extends SpiralPoint>({
  items,
  loops,
  color,
  geometry,
  onPick,
  turn,
}: {
  items: T[];
  loops: number;
  color: (item: T) => THREE.Color;
  geometry: React.ReactNode;
  onPick?: (item: T) => void;
  turn?: (m: THREE.Object3D) => void;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Object3D();
    items.forEach((b, i) => {
      m.position.set(...pos(b, loops));
      m.rotation.set(0, 0, 0);
      turn?.(m);
      m.updateMatrix();
      mesh.setMatrixAt(i, m.matrix);
      mesh.setColorAt(i, color(b));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items, loops, color, turn]);
  if (!items.length) return null;
  const pick = onPick
    ? (e: ThreeEvent<MouseEvent>) => {
        if (e.instanceId === undefined) return;
        e.stopPropagation();
        onPick(items[e.instanceId]!);
      }
    : undefined;
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      onClick={pick}
      onPointerOver={onPick ? () => (document.body.style.cursor = "pointer") : undefined}
      onPointerOut={onPick ? () => (document.body.style.cursor = "") : undefined}
    >
      {geometry}
      <meshStandardMaterial roughness={0.4} metalness={0.05} />
    </instancedMesh>
  );
}

/** Narrow canvases (her timeline on a phone) zoom out so the whole spiral fits; wide ones keep zoom 1 (mauve-3d: fit
 *  with camera zoom, never by scaling the group). */
function Fit() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    camera.zoom = Math.min(1, size.width / size.height / 1.15);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);
  return null;
}

const faceOut = (m: THREE.Object3D) => m.lookAt(m.position.x * 2, m.position.y, m.position.z * 2);

/** The year spiral: one loop per cycle, one bead per day. The landing passes every day of Noura's cycles; her
 *  timeline (A4) passes her logged days with rings for pain ≥ 7, diamonds for events and a tap that opens the day.
 *  Loaded only on the client, only when visible, only with WebGL (SpiralSection, YearSection3D). */
export default function YearSpiral3D({
  beads,
  loops,
  diamonds = [],
  animate,
  onPick,
  onReady,
}: {
  beads: SpiralBead[];
  loops: number;
  diamonds?: SpiralPoint[];
  animate: boolean;
  onPick?: (date: string) => void;
  onReady?: () => void;
}) {
  const c = useCssColors({ bleed: "--ph-m", late: "--ph-l", day: "--ph-f", band: "--ok", mark: "--plum" });
  const small = useMemo(() => beads.filter((b) => b.kind !== "bleed"), [beads]);
  const big = useMemo(() => beads.filter((b) => b.kind === "bleed"), [beads]);
  const rings = useMemo(() => beads.filter((b) => b.ring), [beads]);
  const colorOf = useMemo(() => (b: SpiralBead) => c[b.kind], [c]);
  const mark = useMemo(() => () => c.mark, [c]);
  const pick = onPick ? (b: SpiralBead) => b.date && onPick(b.date) : undefined;
  return (
    <Canvas flat frameloop={animate ? "always" : "demand"} dpr={[1, 1.75]} camera={{ position: [0, 1.5, 12.5], fov: 38 }} gl={{ antialias: true, alpha: true }} onCreated={onReady} aria-hidden="true">
      <SceneLights ambient={0.8} fill={0.45} />
      <Fit />
      <group rotation={[0.25, 0, 0]}>
        <Instances items={small} loops={loops} color={colorOf} onPick={pick} geometry={<sphereGeometry args={[0.11, 16, 16]} />} />
        <Instances items={big} loops={loops} color={colorOf} onPick={pick} geometry={<sphereGeometry args={[0.17, 16, 16]} />} />
        <Instances items={rings} loops={loops} color={mark} turn={faceOut} geometry={<torusGeometry args={[0.24, 0.028, 8, 24]} />} />
        <Instances items={diamonds} loops={loops} color={mark} geometry={<octahedronGeometry args={[0.16]} />} />
        <mesh>
          <cylinderGeometry args={[3.25, 3.25, loops * STEP + 0.6, 64, 1, true]} />
          <meshStandardMaterial color={c.band} transparent opacity={0.07} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={animate} autoRotateSpeed={0.7} minPolarAngle={0.6} maxPolarAngle={2.2} />
    </Canvas>
  );
}
