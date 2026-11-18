"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import "@/components/landing/three-console";
import { SceneLights } from "@/components/landing/SceneLights";
import { useCssColors } from "@/components/landing/useCssColors";
import type { RingMilestone, SegmentKind } from "./pregnancyRing";

const R = 3;
const TOTAL = 52;
// Week 1 starts at the top and the ring runs clockwise, like the 2D arc reads left to right.
const angleOf = (week: number) => Math.PI / 2 - (week / TOTAL) * Math.PI * 2;

function Segments({ segments, now, colors }: { segments: { week: number; kind: SegmentKind }[]; now: number; colors: Record<SegmentKind | "future", THREE.Color> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Object3D();
    segments.forEach((s, i) => {
      const a = angleOf(s.week - 0.5);
      const past = s.week <= now;
      m.position.set(Math.cos(a) * R, past ? 0.12 : 0.05, -Math.sin(a) * R);
      m.rotation.set(0, a, 0);
      m.scale.set(1, past ? 1 : 0.45, 1);
      m.updateMatrix();
      mesh.setMatrixAt(i, m.matrix);
      mesh.setColorAt(i, past ? colors[s.kind] : colors[s.kind].clone().lerp(colors.future, 0.55));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [segments, now, colors]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, segments.length]}>
      <boxGeometry args={[0.3, 0.24, ((2 * Math.PI * R) / TOTAL) * 0.82]} />
      <meshStandardMaterial roughness={0.55} />
    </instancedMesh>
  );
}

function Milestone({ m, color, selected, onPick }: { m: RingMilestone; color: THREE.Color; selected: boolean; onPick: (key: string) => void }) {
  const start = angleOf(m.to);
  const arc = ((m.to - m.from + 1) / TOTAL) * Math.PI * 2;
  return (
    <mesh
      position={[0, selected ? 0.62 : 0.48, 0]}
      rotation={[-Math.PI / 2, 0, start]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onPick(m.key);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <torusGeometry args={[R, selected ? 0.13 : 0.1, 10, 48, arc]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  );
}

/** The 3D pregnancy and fourth-trimester ring (A7): 40 weeks in trimester colours, then 12 weeks after the birth;
 *  weeks lived are raised, the bead marks now, raised bands are what is due when (tap one for its sources).
 *  Loaded only on the client, with WebGL and motion allowed (PregnancyRingSection); the 2D arc is the fallback. */
export default function PregnancyRing3D({
  segments,
  now,
  milestones,
  selected,
  onPick,
  onReady,
}: {
  segments: { week: number; kind: SegmentKind }[];
  now: number;
  milestones: RingMilestone[];
  selected: string | null;
  onPick: (key: string) => void;
  onReady: () => void;
}) {
  const c = useCssColors({ t1: "--ph-o", t2: "--ph-m", t3: "--ph-l", after: "--ok", future: "--rule-2", now: "--plum", done: "--ok", info: "--ink-3" });
  const colors = useMemo(() => ({ t1: c.t1, t2: c.t2, t3: c.t3, after: c.after, future: c.future }), [c]);
  const a = angleOf(now - 0.5);
  return (
    <Canvas flat frameloop="demand" dpr={[1, 1.75]} camera={{ position: [0, 6.2, 5.6], fov: 40 }} gl={{ antialias: true, alpha: true }} onCreated={onReady} aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
      <SceneLights ambient={0.85} fill={0.4} />
      <Segments segments={segments} now={now} colors={colors} />
      <mesh position={[Math.cos(a) * R, 0.55, -Math.sin(a) * R]}>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial color={c.now} roughness={0.35} />
      </mesh>
      {milestones.map((m) => (
        <Milestone key={m.key} m={m} selected={selected === m.key} onPick={onPick} color={m.status === "done" ? c.done : m.status === "due" || m.status === null ? c.now : c.info} />
      ))}
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0.35} maxPolarAngle={1.2} />
    </Canvas>
  );
}
