---
name: clinical-copy-guard
description: Use whenever writing or reviewing any user-facing health text in ReproSense (observations, assistant answers, report text, notifications, Arabic strings). Keeps every sentence non-diagnostic, sourced, kind and clear.
---

# Clinical copy guard

## The four tests every health sentence must pass
1. **Non-diagnostic** — describes a pattern in her data, never a condition she "has".
2. **Traceable** — the number or threshold comes from `rules/clinical_rules.yaml` or a source in `knowledge_base/sources.yaml`.
3. **Actionable** — ends with a next step she can take ("consider booking…", "bring this report").
4. **Kind** — no fear, blame or assumptions (never assume marital status, sexual activity or pregnancy intent).

## Rewrite table
| Never write | Write instead |
| --- | --- |
| You have PCOS. | Your cycles and skin changes are a pattern doctors look at when considering PCOS. |
| 73% chance of endometriosis. | Your pain was 7/10 or more in 4 of your last 6 periods and stopped you working twice. |
| Your periods are abnormal. | Several cycles were longer than 35 days, outside the usual 21–35 day range for adults. |
| You might be infertile. | After 7 months of trying at 36, guidance suggests asking for a fertility check. |
| Don't worry! | This is common and worth checking. |
| Consult a healthcare professional. (generic) | Consider booking a gynaecology appointment and bring your pain timeline. |
| AI-powered insights | What we noticed in your entries |

## Banned strings (the output guard rejects these; keep the list in `backend/app/ai/guards.py`)
`you have`, `you are diagnosed`, `diagnosis of`, `% chance`, `probability of`, `you are infertile`, `cure`, `guaranteed`,
`لديك متلازمة`, `تم تشخيصك`, `نسبة احتمال`.

## Urgent wording (red flags)
Start with the action: "Call 998 or go to the nearest emergency department if this is happening now." Then one sentence of why.
Never hide urgent guidance behind a tap.

## Arabic
- Modern Standard Arabic, warm and direct; address the user in the feminine where the screen is clearly for her.
- Keep numbers in Western digits in data tables for clinicians; Arabic-Indic digits allowed in patient copy if the team decides.
- Medical terms: give the Arabic term + English abbreviation the doctor will use, e.g. «متلازمة تكيّس المبايض (PCOS)».
- Every Arabic string is reviewed by a native speaker before the pitch; mark unreviewed strings with `// AR-REVIEW`.

## Reading level
Aim for grade 7: sentences under 20 words, one idea each, common words. Medical terms get a tap-to-explain tooltip.
