---
name: demo-readiness
description: Use the day before and the morning of the HealthX Ajyal showcase (and after every deploy in build week) to verify the 3-minute demo path, fallbacks and disclosures.
---

# Demo readiness check

Run top to bottom. Any failure → fix or switch to the fallback before going on stage.

## 1. Path (time it; target ≤ 3:00)
- [ ] Landing loads < 2.5 s on phone hotspot; chart in hero shows Noura's real cycles
- [ ] /demo → Noura → Home → Timeline → Insights (evidence chip jumps to the day)
- [ ] "How this was produced" trace opens for one observation
- [ ] Assistant: "What is PCOS?" answer with 2 citations; Arabic toggle works
- [ ] Report preview → PDF downloads → Share (consent) → link expiry shown
- [ ] Clinician → Fatima → "Book glucose test" → Admin KPI changes live
- [ ] Clinician "Ask the record" answers with entry dates
- [ ] Admin equity table renders

## 2. Safety + honesty
- [ ] "Demo data · fictional" visible on every data screen
- [ ] Red-flag flow (Sara: heavy + dizziness) shows 998 guidance first
- [ ] No banned phrases in 20 random generated outputs (`pytest -k guard`)
- [ ] AI tools and prior work disclosed in the footer and the last slide

## 3. Fallbacks
- [ ] Cached LLM responses for all 8 personas (works offline)
- [ ] Backup video on two laptops + USB
- [ ] Second URL (Replit) live
- [ ] Demo reset done after rehearsal

## 4. People
- [ ] Who drives, who speaks, who answers clinical questions (clinician), who answers business
- [ ] 7 judge questions in docs/10 rehearsed out loud
