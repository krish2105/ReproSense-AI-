/** The judge tour (A2): the 3-minute demo path from CLAUDE.md "Definition of done", one step per screen.
 *  `as` is who the step is seen as (a demo sign-in before opening it); `targets` are tried in order and the first
 *  element found is highlighted. Copy lives in messages (tour.steps.<key>). */
export type TourAs = { persona: string } | { role: "clinician" | "admin" } | null;
export interface TourStep {
  key: string;
  path: string;
  as: TourAs;
  targets: readonly string[];
}

export const TOUR_STEPS: readonly TourStep[] = [
  { key: "people", path: "/demo", as: null, targets: [".roster"] },
  { key: "home", path: "/app", as: { persona: "noura" }, targets: ['main svg[role="img"]', "main h1"] },
  { key: "log", path: "/app/log", as: { persona: "noura" }, targets: [".bodymap", ".voice", "main h1"] },
  { key: "patterns", path: "/app/insights", as: { persona: "noura" }, targets: ["article.obs", "main h1"] },
  { key: "assistant", path: "/app/assistant", as: { persona: "noura" }, targets: [".sugg", "main h1"] },
  { key: "report", path: "/app/report", as: { persona: "noura" }, targets: ['[data-tour="report"]', "main h1"] },
  // Build week: Fatima, 9 weeks after the birth (DoH postnatal steps, the glucose test due, blood pressure).
  { key: "afterBirth", path: "/app", as: { persona: "fatima" }, targets: ['[data-testid="postnatal-card"]', "main h1"] },
  { key: "clinic", path: "/clinic", as: { role: "clinician" }, targets: ["main nav", "main h1"] },
  { key: "gap", path: "/clinic/patients/fatima", as: { role: "clinician" }, targets: ['section[aria-labelledby="gaps-title"]', "main h1"] },
  { key: "network", path: "/admin", as: { role: "admin" }, targets: ['section[aria-labelledby="pc008-title"]', "main h1"] },
];

export const TOUR_KEY = "rs_tour";

/** The step to show after moving `by` from `index`, or null when the tour ends (past either end). */
export function move(index: number, by: 1 | -1): number | null {
  const next = index + by;
  return next < 0 || next >= TOUR_STEPS.length ? null : next;
}

/** True when the browser is already on the step's page (ignoring a query string or trailing slash). */
export function onStepPage(pathname: string, step: TourStep): boolean {
  return pathname.replace(/\/$/, "") === step.path;
}
