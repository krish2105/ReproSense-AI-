#!/usr/bin/env node
// One source of truth for the phone app (docs/21): copies what it shares with the web app and generates the design
// tokens from apps/web/src/app/globals.css. Shared: API types, arc geometry, formatting, vocabulary, the EPDS items,
// the answer parser, the sources the UI cites directly and the EN/AR messages.
//   npm run sync          write the copies
//   npm run sync:check    fail (exit 1) if a copy is out of date; CI runs this
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, "../../web");
const mobile = resolve(here, "..");
const check = process.argv.includes("--check");

const header = (from) =>
  `// Copied from apps/web/${from} by apps/mobile/scripts/sync-shared.mjs. Edit the web file, then run npm run sync.\n`;

const sources = [
  { from: "src/lib/api/types.ts", to: "src/api/types.ts" },
  { from: "src/lib/api/errors.ts", to: "src/api/errors.ts" },
  { from: "src/lib/arc.ts", to: "src/shared/arc.ts" },
  { from: "src/lib/format.ts", to: "src/shared/format.ts", edit: (s) => s.replace('from "@/i18n/config"', 'from "../i18n/locale"') },
  { from: "src/lib/vocab.ts", to: "src/shared/vocab.ts", edit: (s) => s.replace('from "./api/types"', 'from "../api/types"') },
  { from: "src/lib/epds.ts", to: "src/shared/epds.ts" },
  { from: "src/lib/answer.ts", to: "src/shared/answer.ts" },
  { from: "src/lib/sources.ts", to: "src/shared/sources.ts" },
  // Fatima's fictional lab report (web /demo/...), so "Use the demo lab report" works on the phone too.
  {
    from: "public/demo/fatima_postnatal_ogtt.txt",
    to: "src/shared/demoLab.ts",
    edit: (s) => `export const DEMO_LAB_FILE = "fatima_postnatal_ogtt.txt";\nexport const DEMO_LAB_TEXT = ${JSON.stringify(s)};\n`,
  },
];
const messages = [
  { from: "messages/en.json", to: "src/i18n/messages/en.json" },
  { from: "messages/ar.json", to: "src/i18n/messages/ar.json" },
];

const camel = (k) => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

function cssVars(text) {
  return Object.fromEntries([...text.matchAll(/--([a-z0-9-]+):\s*([^;}]+)/g)].map(([, k, v]) => [k, v.trim()]));
}

function block(css, re, what) {
  const m = css.match(re);
  if (!m) throw new Error(`globals.css: ${what} not found`);
  return m[1];
}

function resolveVars(map) {
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    let value = v;
    for (let i = 0; i < 5 && value.startsWith("var("); i++) value = map[value.slice(6, -1)] ?? value;
    out[k] = value;
  }
  return out;
}

const KEYS = [
  "paper", "sheet", "tint", "ink", "ink-2", "ink-3", "rule", "rule-2", "plum", "plum-ink", "accent", "accent-ink",
  "accent-soft", "ph-m", "ph-f", "ph-o", "ph-l", "ok", "ok-soft", "warn", "warn-soft", "urgent", "urgent-soft",
  "faint-text", "accent-text", "warn-text", "ok-text",
];

function tokens() {
  const css = readFileSync(resolve(web, "src/app/globals.css"), "utf8");
  const light = resolveVars({
    ...cssVars(block(css, /:root\{([^}]*--paper:[^}]*)\}/, "light palette")),
    ...cssVars(block(css, /:root\{(--faint-text:[^}]*)\}/, "light text tokens")),
  });
  const dark = resolveVars({
    ...cssVars(block(css, /:root\[data-theme="dark"\]\{([^}]*--paper:[^}]*)\}/, "dark palette")),
    ...cssVars(block(css, /:root\[data-theme="dark"\]\{(--faint-text:[^}]*)\}/, "dark text tokens")),
  });
  const radii = cssVars(block(css, /(--radius-card:[^\n]*)/, "radii"));
  const r = cssVars(block(css, /(--r1:[^;]+;\s*--r2:[^;]+;)/, "r1/r2"));
  const pick = (m) => Object.fromEntries(KEYS.map((k) => {
    if (!m[k]) throw new Error(`globals.css: --${k} missing`);
    return [camel(k), m[k]];
  }));
  const px = (v) => Number.parseInt(v, 10);
  const body = {
    light: pick(light),
    dark: pick(dark),
    radius: { card: px(radii["radius-card"]), tile: px(radii["radius-tile"]), small: px(r.r1), panel: px(r.r2), pill: 999 },
  };
  return (
    "// Generated from apps/web/src/app/globals.css by apps/mobile/scripts/sync-shared.mjs. Do not edit.\n" +
    `export const palettes = ${JSON.stringify({ light: body.light, dark: body.dark }, null, 2)} as const;\n\n` +
    "export type Palette = { [K in keyof typeof palettes.light]: string };\n\n" +
    `export const radius = ${JSON.stringify(body.radius, null, 2)} as const;\n`
  );
}

const outputs = [
  ...sources.map(({ from, to, edit }) => {
    const src = readFileSync(resolve(web, from), "utf8");
    return { to, text: header(from) + (edit ? edit(src) : src) };
  }),
  ...messages.map(({ from, to }) => ({ to, text: readFileSync(resolve(web, from), "utf8") })),
  { to: "src/theme/tokens.ts", text: tokens() },
];

let stale = 0;
for (const { to, text } of outputs) {
  const path = resolve(mobile, to);
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (current === text) continue;
  if (check) {
    stale++;
    console.error(`out of date: apps/mobile/${to} (run npm run sync)`);
    continue;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  console.log(`wrote apps/mobile/${to}`);
}
if (check && stale) process.exit(1);
if (check) console.log("shared files are up to date");
