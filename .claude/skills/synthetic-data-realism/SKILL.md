---
name: synthetic-data-realism
description: Use when changing the synthetic data generator, adding personas, or when judges/teammates say demo data looks fake. Keeps data realistic, repeatable and clearly labelled as fictional.
---

# Synthetic data that looks real (and is honest)

## Realism rules
1. **Day-level noise**: pain fades over the first 3 period days; sleep varies; not every day is logged (≈ 20–40% of days).
2. **Real clinical instruments**: PBAC scoring per period day (pads light 1 / moderate 5 / soaked 20, clots 1 / 5);
   pain 0–10 NRS; lab reports with units, reference ranges and H/L flags as printed by a lab.
3. **Human notes**: short, imperfect sentences ("Painkillers barely helped today"), some in Arabic for Arabic-first personas.
4. **Abu Dhabi context**: regions (Abu Dhabi City, Al Ain, Al Dhafra), clinics, Ramadan dates if fasting features are shown.
5. **Plausible, not epidemiological**: cohort proportions look reasonable but are labelled "not prevalence estimates".
6. **Stable**: fixed seed; no `hash()` of strings (randomised per process) — use `sum(map(ord, s))`; output must be byte-identical.
7. **Self-checking**: each persona re-simulates until it shows exactly its intended observations; generator exits 1 otherwise.

## Honesty rules
- `is_synthetic: true` on every record; "(fictional)" in every display name; footer badge on every screen.
- Never derive personas from a real person's records, even "anonymised".
- Never present synthetic accuracy as clinical accuracy.

## Adding a persona
1. Add a `PersonaSpec` with a one-line story. 2. Add its expected rule hits to `EXPECTED`.
3. Run `python3 data/synthetic/generate_synthetic.py` twice; compare `md5sum` of stdout. 4. Rebuild the mockup.
