// Generated from apps/web/src/app/globals.css by apps/mobile/scripts/sync-shared.mjs. Do not edit.
export const palettes = {
  "light": {
    "paper": "#F6F1F4",
    "sheet": "#FFFFFF",
    "tint": "#F4EDF4",
    "ink": "#2E2233",
    "ink2": "#6E5D73",
    "ink3": "#A08FA5",
    "rule": "#EEE5EF",
    "rule2": "#DFD2E2",
    "plum": "#4B3653",
    "plumInk": "#FFFFFF",
    "accent": "#C9559F",
    "accentInk": "#FFFFFF",
    "accentSoft": "#F9E4F1",
    "phM": "#D35FA8",
    "phF": "#EAB09D",
    "phO": "#EFB5D3",
    "phL": "#B88BE3",
    "ok": "#3A9886",
    "okSoft": "#E2F3EF",
    "warn": "#A5680F",
    "warnSoft": "#FBEEDB",
    "urgent": "#C0352B",
    "urgentSoft": "#FCE6E3",
    "faintText": "#746479",
    "accentText": "#A24884",
    "warnText": "#986013",
    "okText": "#37776F"
  },
  "dark": {
    "paper": "#17111A",
    "sheet": "#221A27",
    "tint": "#2B2131",
    "ink": "#F6EFF7",
    "ink2": "#C9BACD",
    "ink3": "#917F97",
    "rule": "#33283A",
    "rule2": "#46384E",
    "plum": "#EBD7F0",
    "plumInk": "#2A1D30",
    "accent": "#EC8BCB",
    "accentInk": "#2A1020",
    "accentSoft": "#3D2236",
    "phM": "#E879BE",
    "phF": "#F0BBA9",
    "phO": "#F3C2DC",
    "phL": "#C7A1EE",
    "ok": "#66C9B5",
    "okSoft": "#173330",
    "warn": "#EDB45E",
    "warnSoft": "#382A14",
    "urgent": "#FF8F80",
    "urgentSoft": "#3C1D1A",
    "faintText": "#A090A5",
    "accentText": "#EC8BCB",
    "warnText": "#EDB45E",
    "okText": "#66C9B5"
  }
} as const;

export type Palette = { [K in keyof typeof palettes.light]: string };

export const radius = {
  "card": 22,
  "tile": 18,
  "small": 12,
  "panel": 24,
  "pill": 999
} as const;
