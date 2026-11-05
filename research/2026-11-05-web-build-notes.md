# Web build research notes (5 Nov 2026)

Kept from the Phase 0 research pass. The research workflow was stopped early at the user's request; this file holds
what it finished. The rules derived from it live in `.claude/skills/mauve-charts`, `mauve-3d` and `web-screen`.

## 1. Chart palette test (dataviz skill, `validate_palette.js`)
Phase colours and status colours were run as categorical palettes on the app surfaces. Raw output:

```
=== PHASE light on sheet #FFFFFF

Palette (light, surface #FFFFFF, categorical): 4 slots
  [FAIL] Lightness band         outside band: [["#EAB09D",0.806],["#EFB5D3",0.835]]
  [FAIL] Chroma floor           below floor (reads gray): [["#EAB09D",0.073],["#EFB5D3",0.077]]
  [WARN] CVD separation         worst adjacent #EFB5D3↔#EAB09D ΔE 6.8 (deutan) · tritan 3.4
  [FAIL] Normal-vision floor    worst adjacent #EFB5D3↔#EAB09D ΔE 7.3 (normal) — below 15, hard to tell apart even with full color vision
  [WARN] Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#EAB09D",1.88],["#EFB5D3",1.72],["#B88BE3",2.68]]

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

exit=1

=== PHASE light on paper #F6F1F4

Palette (light, surface #F6F1F4, categorical): 4 slots
  [FAIL] Lightness band         outside band: [["#EAB09D",0.806],["#EFB5D3",0.835]]
  [FAIL] Chroma floor           below floor (reads gray): [["#EAB09D",0.073],["#EFB5D3",0.077]]
  [WARN] CVD separation         worst adjacent #EFB5D3↔#EAB09D ΔE 6.8 (deutan) · tritan 3.4
  [FAIL] Normal-vision floor    worst adjacent #EFB5D3↔#EAB09D ΔE 7.3 (normal) — below 15, hard to tell apart even with full color vision
  [WARN] Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#EAB09D",1.68],["#EFB5D3",1.54],["#B88BE3",2.4]]

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

exit=1

=== PHASE dark on sheet #221A27

Palette (dark, surface #221A27, categorical): 4 slots
  [FAIL] Lightness band         outside band: [["#E879BE",0.722],["#F0BBA9",0.835],["#F3C2DC",0.865],["#C7A1EE",0.771]]
  [FAIL] Chroma floor           below floor (reads gray): [["#F0BBA9",0.066],["#F3C2DC",0.065]]
  [WARN] CVD separation         worst adjacent #F3C2DC↔#F0BBA9 ΔE 6.4 (deutan) · tritan 3.7
  [FAIL] Normal-vision floor    worst adjacent #F3C2DC↔#F0BBA9 ΔE 6.7 (normal) — below 15, hard to tell apart even with full color vision
  [PASS] Contrast vs surface    all 4 >= 3:1

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

exit=1

=== PHASE dark on paper #17111A

Palette (dark, surface #17111A, categorical): 4 slots
  [FAIL] Lightness band         outside band: [["#E879BE",0.722],["#F0BBA9",0.835],["#F3C2DC",0.865],["#C7A1EE",0.771]]
  [FAIL] Chroma floor           below floor (reads gray): [["#F0BBA9",0.066],["#F3C2DC",0.065]]
  [WARN] CVD separation         worst adjacent #F3C2DC↔#F0BBA9 ΔE 6.4 (deutan) · tritan 3.7
  [FAIL] Normal-vision floor    worst adjacent #F3C2DC↔#F0BBA9 ΔE 6.7 (normal) — below 15, hard to tell apart even with full color vision
  [PASS] Contrast vs surface    all 4 >= 3:1

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

exit=1

=== STATUS light on sheet #FFFFFF

Palette (light, surface #FFFFFF, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.43–0.77
  [FAIL] Chroma floor           below floor (reads gray): [["#3A9886",0.092]]
  [FAIL] CVD separation         worst adjacent #C0352B↔#A5680F ΔE 3.1 (deutan) · tritan 10.5
  [FAIL] Normal-vision floor    worst adjacent #C0352B↔#A5680F ΔE 11.9 (normal) — below 15, hard to tell apart even with full color vision
  [PASS] Contrast vs surface    all 3 >= 3:1

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

exit=1

=== STATUS light on paper #F6F1F4

Palette (light, surface #F6F1F4, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.43–0.77
  [FAIL] Chroma floor           below floor (reads gray): [["#3A9886",0.092]]
  [FAIL] CVD separation         worst adjacent #C0352B↔#A5680F ΔE 3.1 (deutan) · tritan 10.5
  [FAIL] Normal-vision floor    worst adjacent #C0352B↔#A5680F ΔE 11.9 (normal) — below 15, hard to tell apart even with full color vision
  [PASS] Contrast vs surface    all 3 >= 3:1

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

exit=1

=== STATUS dark on sheet #221A27

Palette (dark, surface #221A27, categorical): 3 slots
  [FAIL] Lightness band         outside band: [["#66C9B5",0.77],["#EDB45E",0.806],["#FF8F80",0.767]]
  [FAIL] Chroma floor           below floor (reads gray): [["#66C9B5",0.098]]
  [FAIL] CVD separation         worst adjacent #FF8F80↔#EDB45E ΔE 5.9 (deutan) · tritan 8.3
  [FAIL] Normal-vision floor    worst adjacent #FF8F80↔#EDB45E ΔE 11.2 (normal) — below 15, hard to tell apart even with full color vision
  [PASS] Contrast vs surface    all 3 >= 3:1

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

exit=1

=== STATUS dark on paper #17111A

Palette (dark, surface #17111A, categorical): 3 slots
  [FAIL] Lightness band         outside band: [["#66C9B5",0.77],["#EDB45E",0.806],["#FF8F80",0.767]]
  [FAIL] Chroma floor           below floor (reads gray): [["#66C9B5",0.098]]
  [FAIL] CVD separation         worst adjacent #FF8F80↔#EDB45E ΔE 5.9 (deutan) · tritan 8.3
  [FAIL] Normal-vision floor    worst adjacent #FF8F80↔#EDB45E ΔE 11.2 (normal) — below 15, hard to tell apart even with full color vision
  [PASS] Contrast vs surface    all 3 >= 3:1

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

exit=1

=== STATUS light ALL PAIRS (ok vs urgent can sit side by side in lists)

Palette (light, surface #FFFFFF, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.43–0.77
  [FAIL] Chroma floor           below floor (reads gray): [["#3A9886",0.092]]
  [FAIL] CVD separation         worst all-pairs #C0352B↔#A5680F ΔE 3.1 (deutan) · tritan 10.5
  [FAIL] Normal-vision floor    worst all-pairs #C0352B↔#A5680F ΔE 11.9 (normal) — below 15, hard to tell apart even with full color vision
  [PASS] Contrast vs surface    all 3 >= 3:1

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

exit=1

=== STATUS dark ALL PAIRS

Palette (dark, surface #221A27, categorical): 3 slots
  [FAIL] Lightness band         outside band: [["#66C9B5",0.77],["#EDB45E",0.806],["#FF8F80",0.767]]
  [FAIL] Chroma floor           below floor (reads gray): [["#66C9B5",0.098]]
  [FAIL] CVD separation         worst all-pairs #FF8F80↔#EDB45E ΔE 5.9 (deutan) · tritan 8.3
  [FAIL] Normal-vision floor    worst all-pairs #FF8F80↔#EDB45E ΔE 11.2 (normal) — below 15, hard to tell apart even with full color vision
  [PASS] Contrast vs surface    all 3 >= 3:1

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

exit=1
```

**Conclusion.** Both sets fail as colour-only encodings: follicular vs fertile are near-identical even for normal
vision, the pale phases sit below 3:1 on white, and urgent vs warn collapse for deuteranopia. The brand colours stay
(docs/06); the fixes are encodings: words in legends and tags, 2px gaps, a hatch on the fertile segment, a 1px outline
on light-mode phase segments, strong tokens (`--plum`, `--ph-m`) for data marks. See `.claude/skills/mauve-charts`.

## 2. React Three Fiber 9 and Next.js lazy loading (docs read 5 Nov 2026)
- Next.js lazy loading (https://nextjs.org/docs/app/guides/lazy-loading): `next/dynamic(..., { ssr: false })` only works
  inside a Client Component; a Server Component that dynamically imports a Client Component does not code-split it.
- R3F v9 migration (https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide): v9 is the React 19 compatibility release;
  StrictMode now applies inside the canvas; `gl` callback receives constructor props; automatic sRGB conversion of texture
  props was removed; `MeshProps` and friends are replaced by `ThreeElements['mesh']`.
- Canvas defaults (https://r3f.docs.pmnd.rs/api/canvas): `dpr [1,2]`, `frameloop "always"`, renderer `antialias`,
  `alpha`, `powerPreference "high-performance"`, ACES filmic tone mapping, sRGB output; `fallback` renders when WebGL is missing.
- Scaling performance (https://r3f.docs.pmnd.rs/advanced/scaling-performance): `frameloop="demand"` + `invalidate()`;
  share geometries/materials; instancing (keep draw calls to a few hundred at most, 1,000 as the ceiling);
  `PerformanceMonitor` and adaptive DPR; `regress()` only helps if the app reads `performance.current`.
- Not confirmed before the stop: the drei `<Environment preset>` CDN download (the docs request was cancelled).
  The skill assumes presets fetch HDR files at runtime and avoids them; verify in Phase 7 before relying on either way.

## 3. API shapes captured
Real responses for all 8 personas (home EN/AR, navigator, timeline and analytics at 3/6/12 months, insights EN/AR,
report previews, clinic list and every patient record, Ask-the-record answers, assistant answers for urgent, crisis,
refusal, not-found and Arabic cases, quality numbers) were captured from the running API on 5 Nov. They feed the
TypeScript types in `apps/web/src/lib/api/types.ts`, phase by phase, and become test fixtures where useful.
Login responses and cookie jars are not kept (they contain demo tokens).

## 4. Not covered (stopped before it ran)
Women's-health app UX patterns, Playwright + Lighthouse CI specifics, and a WCAG 2.2 / Arabic typography pass.
These are handled from the existing skills (no-ai-slop-ui, ui-ux-pro-max, dataviz) and verified in the browser per phase.

## 5. Phase 7 findings (6 Nov 2026, measured on the local `next start` build)
- **Colour in R3F.** The Canvas default ACES filmic tone mapping turned the phase colours grey-brown, and three ≥ r155
  measures light in physical units, so the mockup's r128 intensities (ambient 0.75, key 0.9, fill 0.5) came out about
  π times too dark. Fix: `<Canvas flat>` and intensities × π (`SceneLights.tsx`). Both scenes now match the CSS tokens.
- **Deprecation noise.** @react-three/fiber 9.8.2 (latest, 14 Oct 2026) still builds its frame clock with `THREE.Clock`,
  which three r183+ marks deprecated, so every canvas warned. three's `setConsoleFunction` drops only that notice
  (`three-console.ts`); everything else still reaches the console. Remove it when fiber moves to `THREE.Timer`.
- **The WebGL probe is not free.** Creating a test context at mount (software GL in headless Chrome) cost about 1 s of
  mobile TBT (Lighthouse 98 → 75). The probe now runs only when a 3D panel nears the screen, and it releases its context.
- **Above-the-fold 3D.** Loading three.js on idle still landed inside Lighthouse's interactive window on desktop
  (TBT 660 ms, score 74) in one run out of two. The hero ring now starts after the first sign of use (pointer, scroll,
  key, touch) or 8 s, then waits for idle; the SVG poster shows the same ring until then. Result: 100 on mobile and
  desktop in two runs each.
- **Poster = scene.** The poster draws the ring with the scene's own projection (Euler XYZ, camera z 12, fov 40). Camera
  zoom = min(1, width / height) is a pure 2D scale, which is exactly SVG `viewBox="-1 -1 2 2"` + `meet`, so the swap from
  poster to WebGL moves no bead at any size (unit-tested in `ring.test.ts`).
- **Streaming and CLS.** A loading skeleton shorter than the screen let the footer appear and then jump (CLS 0.046);
  the shared skeleton is now at least one screen tall (CLS 0).
- **Fallback check** (puppeteer-core with system Chrome): normal → WebGL ring and spiral; `prefers-reduced-motion` →
  posters, upright phone, "shown flat" note; `--disable-webgl` → posters and the note. Zero console errors in all three.

## 6. Step 3 findings: what the Playwright e2e caught (6 Nov 2026)
- **Stale prefetch after login.** The header's "Her app" link prefetched `/app` while the visitor was anonymous; the
  layout's role check answered with a redirect to `/demo`, Next kept it in the client router cache, and
  `router.push("/app")` after the demo login replayed it. Real fresh visitors hit this too. Fix: links into the
  signed-in areas never prefetch, and every login opens its area with a full page load (`src/lib/enter.ts`).
- **Hydration race on full page loads (React error #418).** Next 15.5.29 bundles React 19.2.0-canary (18 Aug 2025).
  Its batched reveal of streamed Suspense boundaries (`$RC` marks `$~`, `$RV` reveals a frame later) raced with
  hydration on full loads: `/admin` failed in 3 of 12 full demo runs and `/clinic` once, with no content difference in
  the final DOM (checked by diffing the server HTML against the client DOM). With the route-level `loading.tsx`
  boundaries removed, the full suite passed 3 runs in a row with no hydration error. Navigation feedback now comes
  from `useLinkStatus` (`LinkPending`). Revisit when the stack moves to a Next release with React ≥ 19.2 stable.
- **Accessibility, found by axe (Lighthouse had passed them):** text in the accent, faint, warn and ok tones below
  4.5:1 (QUESTIONS #42, now text-only shades); wide tables not reachable by keyboard (`TableScroll`); day pills whose
  names did not contain their visible text (WCAG 2.5.3); future calendar days now `aria-disabled`; the floating tab bar
  let dark content show through its glass (now 94% opaque); the body map's tap points now sit in a named group.
- **drei `<Html>`** mounts a React root per label and unmounts it during render ("synchronously unmount a root" in
  development). The region labels are now plain DOM spans moved each frame (`LabelTracker`).
