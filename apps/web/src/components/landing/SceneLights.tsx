"use client";

// The mockup's lights() (three.js r128): ambient, a key light and a soft pink fill. three ≥ r155 measures
// light in physical units, which is π times dimmer for the same numbers, so the intensities are scaled by π.
// Canvases also pass `flat` (no ACES tone mapping), otherwise the phase colours turn grey-brown.
const PI = Math.PI;
const FILL = "#ffd6ec"; // mockup 0xffd6ec

export function SceneLights({ ambient = 0.75, direct = 0.9, fill = 0.5 }: { ambient?: number; direct?: number; fill?: number }) {
  return (
    <>
      <ambientLight intensity={ambient * PI} />
      <directionalLight position={[3, 5, 6]} intensity={direct * PI} />
      <directionalLight position={[-5, -2, 3]} intensity={fill * PI} color={FILL} />
    </>
  );
}
