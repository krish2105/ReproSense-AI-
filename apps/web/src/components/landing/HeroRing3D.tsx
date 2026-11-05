"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import "./three-console";
import { fitScale, RING, ringPoint, type RingBead } from "./ring";
import { SceneLights } from "./SceneLights";
import { useCssColors } from "./useCssColors";

type Colors = ReturnType<typeof usePalette>;
function usePalette() {
  return useCssColors({ period: "--ph-m", follicular: "--ph-f", fertile: "--ph-o", luteal: "--ph-l", today: "--plum", sheet: "--sheet" });
}

/** Days ahead of today are estimates: the same phase colour, a third of the way to the surface colour. */
function beadColor(b: RingBead, c: Colors): THREE.Color {
  const base = c[b.phase].clone();
  return b.future ? base.lerp(c.sheet, 0.35) : base;
}

function BeadSet({ beads, radius, colors }: { beads: RingBead[]; radius: number; colors: Colors }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Object3D();
    beads.forEach((b, i) => {
      m.position.set(...ringPoint(b.angle));
      m.updateMatrix();
      mesh.setMatrixAt(i, m.matrix);
      mesh.setColorAt(i, beadColor(b, colors));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [beads, colors]);
  if (!beads.length) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, beads.length]}>
      <sphereGeometry args={[radius, 20, 20]} />
      <meshStandardMaterial roughness={0.35} metalness={0.05} />
    </instancedMesh>
  );
}

function Ring({ beads, animate, tilt }: { beads: RingBead[]; animate: boolean; tilt: RefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null);
  const c = usePalette();
  const small = useMemo(() => beads.filter((b) => b.size === "day"), [beads]);
  const period = useMemo(() => beads.filter((b) => b.size === "period"), [beads]);
  const today = beads.find((b) => b.size === "today");
  useFrame((state) => {
    // Camera zoom is a pure 2D scale of the picture, the same as the poster's "meet" (see fitScale).
    const zoom = fitScale(state.size.width, state.size.height);
    if (state.camera.zoom !== zoom) {
      state.camera.zoom = zoom;
      state.camera.updateProjectionMatrix();
    }
    const g = group.current;
    if (!g) return;
    const p = tilt.current;
    // Mockup motion: a full turn about the ring's own axis in ~56 s, and a small lean towards the pointer.
    g.rotation.z = RING.pose.z + (animate ? state.clock.elapsedTime / 9 : 0);
    g.rotation.y = RING.pose.y + p.x * 0.4;
    g.rotation.x = RING.pose.x + p.y * 0.3;
  });
  return (
    <group ref={group} rotation={[RING.pose.x, RING.pose.y, RING.pose.z]}>
      <BeadSet beads={small} radius={RING.bead.day} colors={c} />
      <BeadSet beads={period} radius={RING.bead.period} colors={c} />
      {today && (
        <mesh position={ringPoint(today.angle)}>
          <sphereGeometry args={[RING.bead.today, 24, 24]} />
          <meshStandardMaterial color={c.today} roughness={0.35} metalness={0.05} emissive={c.today} emissiveIntensity={0.12} />
        </mesh>
      )}
      <mesh>
        <torusGeometry args={[RING.radius, 0.05, 16, 160]} />
        <meshStandardMaterial color={c.luteal} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

/** The hero ring behind the phone. Loaded only on the client, after the page is idle, with WebGL and motion
 *  allowed and room around the phone (see HeroStage); the SVG poster stands in until it is ready. */
export default function HeroRing3D({ beads, animate, tilt, onReady }: { beads: RingBead[]; animate: boolean; tilt: RefObject<{ x: number; y: number }>; onReady: () => void }) {
  return (
    <Canvas
      flat
      frameloop={animate ? "always" : "demand"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, RING.camera.z], fov: RING.camera.fov }}
      gl={{ antialias: true, alpha: true }}
      onCreated={onReady}
      aria-hidden="true"
      // R3F sets pointer-events: auto on its wrapper; the ring never takes the pointer (the stage reads it).
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <SceneLights />
      <Ring beads={beads} animate={animate} tilt={tilt} />
    </Canvas>
  );
}
