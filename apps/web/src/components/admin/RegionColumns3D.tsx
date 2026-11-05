"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import "@/components/landing/three-console";
import { SceneLights } from "@/components/landing/SceneLights";
import { useCssColors } from "@/components/landing/useCssColors";
import { COLUMN_MAX, regionLayout, type RegionCounts } from "./regions";

const KEYS = ["open", "in_progress", "closed"] as const;

/** Zoom out when the panel is narrow, so all three regions stay in view (the scene is about 15 units wide). */
function FitZoom() {
  useFrame((state) => {
    const zoom = Math.min(1, state.size.width / state.size.height / 1.45);
    if (state.camera.zoom !== zoom) {
      state.camera.zoom = zoom;
      state.camera.updateProjectionMatrix();
    }
  });
  return null;
}

/** Keeps the HTML region labels under their slabs as the view turns. Plain DOM spans moved every frame: drei's <Html>
 *  mounts a React root per label and unmounts it during render, which React reports as a race in development. */
function LabelTracker({ anchors, labels }: { anchors: THREE.Vector3[]; labels: RefObject<(HTMLSpanElement | null)[]> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    anchors.forEach((a, i) => {
      const el = labels.current[i];
      if (!el) return;
      v.copy(a).project(camera);
      el.style.transform = `translate(${((v.x * 0.5 + 0.5) * size.width).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * size.height).toFixed(1)}px) translate(-50%, -50%)`;
      el.style.visibility = v.z < 1 ? "visible" : "hidden";
    });
  });
  return null;
}

/** Follow-ups by region (mockup initMap3D): one slab per region, one column per status, height = count.
 *  Loaded only on the client, only when visible, only with WebGL (see RegionSection). */
export default function RegionColumns3D({ regions, names, animate, onReady }: { regions: RegionCounts[]; names: Record<string, string>; animate: boolean; onReady: () => void }) {
  const c = useCssColors({ slab: "--tint", open: "--accent", in_progress: "--warn", closed: "--ok" });
  const max = Math.max(1, ...regions.flatMap((r) => KEYS.map((k) => r[k])));
  const layout = regionLayout(regions);
  const anchors = useMemo(() => regionLayout(regions).map(({ x, z, d }) => new THREE.Vector3(x, 0, z + d / 2 + 0.7)), [regions]);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  return (
    <>
      <Canvas flat frameloop={animate ? "always" : "demand"} dpr={[1, 1.75]} camera={{ position: [0, 10.6, 15], fov: 36 }} gl={{ antialias: true, alpha: true }} onCreated={onReady} aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        <SceneLights ambient={0.8} direct={0.8} fill={0.3} />
        <FitZoom />
        {layout.map(({ r, x, z, w, d }) => (
          <group key={r.region} position={[x, 0, z]}>
            <mesh>
              <boxGeometry args={[w, 0.4, d]} />
              <meshStandardMaterial color={c.slab} roughness={0.6} />
            </mesh>
            {KEYS.map((k, i) => {
              const h = Math.max(0.05, (r[k] / max) * COLUMN_MAX);
              return (
                <mesh key={k} position={[(i - 1) * 1, 0.2 + h / 2, 0]} scale={[0.7, h, 0.7]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color={c[k]} roughness={0.35} />
                </mesh>
              );
            })}
          </group>
        ))}
        <LabelTracker anchors={anchors} labels={labels} />
        <OrbitControls target={[0, 1.6, 0]} enableZoom={false} enablePan={false} autoRotate={animate} autoRotateSpeed={0.5} minPolarAngle={1.03} maxPolarAngle={1.03} />
      </Canvas>
      <div className="map3d-labels" aria-hidden="true">
        {layout.map(({ r }, i) => (
          <span
            key={r.region}
            ref={(el) => {
              labels.current[i] = el;
            }}
            className="map3d-label"
          >
            {names[r.region] ?? r.region}
          </span>
        ))}
      </div>
    </>
  );
}
