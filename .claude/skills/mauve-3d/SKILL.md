---
name: mauve-3d
description: Use before building any 3D or WebGL view in ReproSense (the year spiral / cycle-bead ring on the landing page, the 3D region columns on /admin). React Three Fiber 9 + drei 10 rules adapted from the light-3d-design-system skill to E · Mauve Pro, in light and dark, with fallbacks.
---

# 3D in E · Mauve Pro

3D is allowed only when every object is data: one bead per logged day, one column per region and status.
No blobs, helixes or particles (no-ai-slop-ui; QUESTIONS C7). The page must work and look intended without WebGL.
Keep E · Mauve Pro colours and fonts; take only the methods from `light-3d-design-system`.

## 1. Loading
- The canvas lives in a client file loaded with `next/dynamic(() => import("./Scene"), { ssr: false, loading: () => <Poster/> })`.
  `ssr: false` only works inside a `"use client"` file (Next.js lazy-loading guide).
- The poster is the same data drawn as SVG (or the matching still in `public/images/hero/*`), sized exactly like the canvas, so nothing shifts.
- Mount the canvas only when it scrolls into view (IntersectionObserver), WebGL is available, and reduced motion is off.
  Also pass `<Canvas fallback={<Poster/>}>` for browsers without WebGL.
- The 3D code must not appear in any route's first-load JS: check the route table from `pnpm build`.

## 2. Rendering
- `<Canvas frameloop="demand" dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>`: transparent so the CSS paper colour and washes show through.
  Demand mode renders only on change; call `invalidate()` after you mutate anything React can't see (drei controls do it for you).
- Instancing: the year spiral's ~365 beads are one `instancedMesh` (one draw call). Share geometry and material. Stay far below 1,000 draw calls.
- Slow idle rotation only when reduced motion is off, paused on interaction and when off-screen.
- R3F v9 notes: React 19 compatible; StrictMode applies inside the canvas; use `ThreeElements["mesh"]` types (no `MeshProps`);
  the `gl` callback receives constructor props; custom materials need `texture.colorSpace = SRGBColorSpace` set by hand.

## 3. Light, colour, themes
- **No network lighting.** drei `<Environment preset=…>` downloads HDR files at runtime, which breaks the offline demo and a strict CSP.
  Use ambient + hemisphere + one soft directional light, or `<Environment>` with local `<Lightformer>` children.
- Matte `meshStandardMaterial` (roughness 0.5–0.7). No bloom. Optional `ContactShadows` (opacity ~0.25 light, ~0.45 dark).
- Colours come from CSS variables read at mount (`getComputedStyle(document.documentElement)`) and re-read when `data-theme`
  changes (MutationObserver), so dark mode is designed, not inverted. Phase colours carry the same meaning as in the charts (see `mauve-charts`).

## 4. Accessibility
- The canvas is `aria-hidden`; a visible one-line summary sits next to it, and a "Show as table" toggle gives the same numbers.
- Keyboard users get the table, never a trap inside the canvas. Pointer drag is optional, never required.
- Colour is not the only channel: columns are grouped and labelled by status in the legend and the table.

## 5. Budget and checks
- Landing Lighthouse: performance ≥ 90, accessibility ≥ 95 (issue #7). 60 fps on an M-series laptop.
- Dispose of anything created outside JSX on unmount. Never create materials per instance.
- Playwright: with reduced motion the poster is shown; with WebGL disabled the fallback is shown; no console errors.
- Packages (install in Phase 7 only): `@react-three/fiber` ^9.8, `@react-three/drei` ^10.7, `three` ^0.187.
