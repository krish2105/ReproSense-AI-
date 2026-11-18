# 23 · Rescore with a global benchmark: 6 Nov 2026, late night (main at `3abc714`)

## How this was scored
- **Who:** one reviewer (Claude Code), against `docs/09_SCORECARDS.md` and the line tables in `docs/18_ROADMAP_TO_95.md`
  section 2, the same method as `docs/22_RESCORE.md`. Krishna asked for no subagents.
- **What was measured:**
  - the latest CI run on main (`3abc714`, green);
  - a live check of the web and API addresses;
  - the phone apps built and run tonight (iOS simulator, a real iPhone 16 Pro, Android 14 emulator);
  - public sources for the global comparison, linked in section 4.
- **Honesty rule (unchanged):** a score moves only when the work is merged into main and running. Open PRs are shown
  in their own column. These are our strict estimates; the jury decides.

## 1. Headline
| Scorecard | Evening (docs/22) | **Now** | When the open PRs merge¹ | With the live API (#22) | 95% bar |
| --- | --- | --- | --- | --- | --- |
| Jury rubric /100 | 68.5 | **69** | 70 | 73 | 95 |
| Real MVP /100 | 75 | **75** | 75 | 77 | 95 |
| Real SaaS /100 | 72 | **72** | 72 | 74 | 95 |
| Clinical safety /35 | 23 | **25** | 25.5 | 25.5 | 33.5 |
| Women's experience /35 | 26 | **26** | 27 | 27 | 33.5 |
| Trust pack /7 | 7 | **7** | 7 | 7 | 7 |
| **Global benchmark /10 (new, section 4)** | — | **4.9** | 5.1 | 5.5 | — |

¹ The open PRs:
- **#68:** the phone apps.
- **#71:** the urgent reply for "bleeding through… faint".
- **#70:** Arabic punctuation, grounded 30/30.
- **#63:** one count everywhere.

**What moved since the evening:**
- **Merged by Atharva:**
  - **#40, safety and truth fixes.** RF2 now fires without a fever, and cycles per year are right on short records. This
    is clinical safety +2, from red flags and edge cases.
  - **#59:** the AI co-author guard.
  - **#60:** postcss advisories cleared.
  - **#61:** model-check headroom.
  - **#62:** the birth-mood shortcut.
  - **#64:** realistic bleeding scores.
  - **#69:** "why" questions answer with causes.
- **CI on main:** green on the latest commit, with backend 193, web unit 52, e2e 112 passed, 8 skipped and 0 failed.
- **Phone apps built and running, not yet merged (#68):**
  - the iOS Release app on the simulator and on a real iPhone 16 Pro (iOS 27);
  - the Android APK on an Android 14 emulator.
- **Still blocking the live demo:** the API returns 404 at `reprosense-api.onrender.com`, because the database (#22) is
  still waiting on Atharva. A reminder was posted on #22.

## 2. Line by line (only the lines that changed; the rest are as in docs/22)

### 2.1 Jury rubric (69)
| Criterion | Evening | Now | Why |
| --- | --- | --- | --- |
| Venture (30) | 18.5 | 18.5 | No interviews, letter of intent or advisor yet |
| Health impact (20) | 15 | 15 | No clinician quote, pilot baseline or usability session |
| Innovation & evidence (20) | 15 | **15.5** | #40 safety rules, #69 causes in answers, #64 realistic data. The model check still isn't scored |
| Working prototype (20) | 14 | 14 | Main is green and the apps run, but there's no live API, so no live demo. Phone apps +0.5 when #68 merges |
| Team & pitch (10) | 6 | 6 | No rehearsals, no backup video |

### 2.2 Clinical safety (25)
| Line | Evening | Now | Why |
| --- | --- | --- | --- |
| Red flags | 4 | **5** | RF2 fires without a fever (#40); 15/15 on the acceptance set |
| Edge cases | 2 | **3** | Q48 and Q53 fixed in #40; Q49 R1–R10 still wait for a clinician |
| Held-out routing | 3 | 3 | Unchanged: crisis 11/30, emergencies 24/32 (word checks). +0.5 when #71 merges |
| Sources | 4 | 4 | Still 28; NG126 (ectopic pregnancy) and the overdose source are still missing (A5) |
| Crisis path, non-diagnostic, governance | 3 / 5 / 2 | 3 / 5 / 2 | No safety case yet (A9) |

### 2.3 Women's experience (26)
No line moved on main. #62 and #69 close two walk findings. Clarity rises to 4.5 when #63 merges (one count). Privacy
rises to 4.5 when #68 merges (the opt-in app lock, nothing but the token stored on the phone). Arabic stays at 2 until
a native review (#23); a new gap, #67, was found tonight (English words inside Arabic evidence lines).

## 3. Engineering and readiness (26 parameters)
| # | Parameter | Measured now | Evening | Now | Next |
| --- | --- | --- | --- | --- | --- |
| 1 | Backend tests | 193 passed on main | A | **A** | Keep |
| 2 | Backend coverage | 92% (6 Nov; not re-measured) | A- | A- | A3 |
| 3 | Web lint, types, unit | 52 unit tests (14 files) | A | **A** | Keep |
| 4 | End-to-end | 112 passed, 8 skipped, 0 failed (2.8 min) on main | A | **A** | Keep |
| 5 | CI stability | Main green on its last 5 runs; the React #418 flake still hit a PR run tonight (#71) | C | **C+** | #44 Next 16 |
| 6 | Bundle size | 103 kB shared first-load JS (6 Nov) | A | A | Keep |
| 7 | Lighthouse on mobile | 99–100 (6 Nov) | A | A | Re-measure after C0 |
| 8 | Live web | 200 on `/`, `/demo`, `/trust`, `/status`; data pages need the API | B | B | — |
| 9 | Live API | 404 at Render: not deployed | F | **F** | #22 |
| 10 | Uptime | Workflow ready; `LIVE_API_URL` pending | C | C | After Render |
| 11 | Secrets | gitleaks clean; co-author guard on main (#59) | A | **A** | Keep |
| 12 | npm production dependencies | postcss pinned to 8.5.32 by an override (#60); #57 closed | C | **A** | Drop the override with Next 16 |
| 13 | Python dependencies | pip-audit clean (6 Nov) | A | A | Keep |
| 14 | Auth and tenancy | Forced RLS; no sign-in; tenants parked | C | C | C1, C3 |
| 15 | Safety, acceptance set | 29/30 grounded, 15/15, 15/15, 0 banned | A | A | 30/30 with #70 |
| 16 | Safety, held-out round 5 | Crisis 11/30, emergencies 24/32, diagnosis 6/10, medicine 4/10 | D | D | B2 with Krishna's key; #71 |
| 17 | Rules | 18 rules with sources; Q48/Q53 fixed (#40); Q49 waits for a clinician | C+ | **B-** | B6, C4 |
| 18 | Knowledge base | 28 sources; NG126 missing; Arabic summaries unreviewed | B- | B- | A5, B3 |
| 19 | Internationalisation | Keys complete; no native review; #67 found English inside Arabic evidence | C | C | B3, #67 |
| 20 | FHIR R4 | 0 errors, 94 warnings | B+ | B+ | #47 |
| 21 | Data realism | Bleeding scores vary (#64); one count waits on #63 | C | **B** | #63 |
| 22 | Docs and process | Gates, roadmaps, co-author guard, phone-app README | B+ | **A-** | Keep |
| 23 | Venture evidence | 0 interviews, 0 letters of intent, no advisor | D | D | A8, B4, B7 |
| 24 | Women's evidence | 0 usability sessions, 0% native Arabic review | D | D | B3, B5 |
| 25 | Pitch readiness | Deck from the real build; 0 rehearsals; no backup video | C | C | B10 |
| 26 | Mobile | iOS and Android built and running (PR #68): Release app on a real iPhone 16 Pro (iOS 27) and the simulator; APK on Android 14; 20 unit tests and a CI job. Not in the stores; no sign-in; data only through a temporary link until #22 | — | **B-** | Merge #68, M9, M10 |

## 4. Global benchmark (new)
How ReproSense compares with the best of the world's women's-health apps and the rules that apply to them.
- **Scale:** 10 = matches the global leader on that dimension; 5 = halfway there; 0 = absent.
- **Leaders:** the best in each dimension, not one app.
- **Facts:** public sources only, linked in the table. Where we couldn't confirm the current status (for example
  whether Clue Birth Control is on sale in the US now), we say so and don't score on it.

| Dimension | Global best (public evidence) | ReproSense now | Score |
| --- | --- | --- | --- |
| Regulatory clearance | Natural Cycles: FDA De Novo authorisation as a contraceptive app (2018, moderate-risk class) ([MobiHealthNews](https://www.mobihealthnews.com/news/fda-grants-natural-cycles-contraception-app-de-novo-marketing-approval)). Clue: FDA 510(k) clearance for Clue Birth Control (2021); the core Clue app is a regulated medical device in the EU ([510k record](https://510k.innolitics.com/search/K193330), [App Store](https://apps.apple.com/dk/app/id657189652)) | Non-diagnostic by design: no clearance claimed or needed for a demo. Abu Dhabi's Responsible AI Standard (Oct 2025) applies once a licensed entity deploys it ([DoH](https://www.doh.gov.ae/-/media/B84FF5DD027846699C51F36C439A580F.ashx)). No safety case written yet | 2 |
| Clinical evidence | Natural Cycles publishes effectiveness (typical-use failure 6.5%; the method behind it has been criticised as observational) ([Gizmodo](https://gizmodo.com/the-fda-has-cleared-its-first-digital-birth-control-app-1828301774), [Center for Research](https://www.center4research.org/getting-easier-get-fda-clearance-just-ask-natural-cycles/)) | Synthetic data only: 8/8 persona rule accuracy, an acceptance set and a held-out safety round. No study, no clinician sign-off | 2 |
| Privacy record | The field's warning case: in Aug 2025 a US federal jury found Meta illegally collected Flo users' health data (2016–2019); Flo settled the day before ([Tom's Guide](https://www.tomsguide.com/computing/online-security/jury-finds-meta-illegally-collected-data-from-womens-health-app-flo-what-you-need-to-know), [NatLawReview](https://natlawreview.com/article/jury-finds-meta-liable-collecting-private-reproductive-health-data)) | No third-party tracking or analytics SDKs; AI opt-in; forced row-level security; consent per clinic; hash-chained audit log; export and delete; the phone keeps only a this-device-only token. Not yet on UAE hosting (the demo runs in Frankfurt on synthetic data) | 8 |
| Explainability | Most consumer apps show predictions without the evidence behind them | Every card shows its rule, the numbers used, the days that triggered it and its sources ("How this was produced") | 9 |
| Clinician integration | Consumer leaders rarely connect to clinic systems | FHIR R4 export (0 errors in the HL7 validator), consented clinician view, 7-day share with a QR, care-gap dashboard. No live EHR or Malaffi connection yet | 7 |
| AI assistant safety | Abu Dhabi's DoH policy expects certification and auditable validation of AI in care ([Tamimi on DoH policy](https://tamimi.com/news/new-policy-on-artificial-intelligence-in-healthcare-issued-by-the-department-of-health-abu-dhabi)) | Cited answers (29/30 grounded), diagnosis refused 15/15, 998 always on screen. But held-out crisis routing is 11/30 with word checks only | 5 |
| Arabic and regional fit | UAE peers: Ovasave, DoH-licensed fertility platform with $1.2M pre-seed in Jul 2025 ([WAM](https://www.wam.ae/a/bkq91ot)); MeNOW, a bilingual menopause app ([Khaleej Times](https://www.khaleejtimes.com/lifestyle/menopause-app-menow?amp=1)); Nabta Health ([ADSME Hub](https://www.adsmehub.ae/en/explore/post-details/nabta-health-secures-funding-from-angel-investors)) | Full EN/AR with right-to-left layout on web, iOS and Android; Abu Dhabi pathways (998, DoH); five life stages. The Arabic isn't reviewed by a native speaker | 7 |
| Mobile reach | Leaders ship native apps in both stores to large audiences | iOS and Android apps run (PR #68); not in the stores | 3 |
| Accessibility | No public leader benchmark; the bar is WCAG 2.2 AA | axe checks in e2e, Lighthouse accessibility 100; not tested with users with disabilities | 8 |
| Reliability and operations | Production services with uptime commitments | The API isn't deployed; uptime monitoring is waiting | 2 |
| Traction | Leaders have large user bases; UAE peers have raised $1.2–1.5M | 0 users, 0 letters of intent, 0 interviews | 1 |
| **Index** | | (2+2+8+9+7+5+7+3+8+2+1) / 11 | **4.9** |

**Reading it:**
- **Where ReproSense leads the world:** explainability, and privacy by design. That's the story for the jury,
  especially after the Flo case.
- **Where it trails:** regulatory, evidence, traction and operations. Those are normal for a hackathon entry, but they
  are what decides a venture score.
- **The fastest global gains:**
  1. The live API (#22): reliability 2 → 6.
  2. Merge #68: mobile 3 → 5.
  3. A clinician advisor's sign-off and a written safety case (A9, B6): regulatory 2 → 4.
  4. Five interviews and one letter of intent (A8): traction 1 → 3.
  5. The model check scored (B2): AI safety 5 → 7.

**Regulatory horizon.** If ReproSense ever claims to diagnose or to guide treatment in the EU, the AI Act's high-risk
duties would apply on top of the medical-device rules. That date has likely moved from Aug 2027 to Aug 2028; the final
Official Journal text is still to be checked ([Hunton](https://hunton.com/insights/legal/the-impact-of-the-eu-ai-act-on-the-development-and-use-of-medical-devices),
[fireup.pro](https://fireup.pro/blog/eu-ai-act-medical-ai-dach-2028)). Staying non-diagnostic, as the rules in
CLAUDE.md require, keeps the demo outside both.

## 5. Top fixes by points per hour (updated)
| Order | Fix | Who | Unlocks |
| --- | --- | --- | --- |
| 1 | Database, then Render, then the live smoke test (#22) | Atharva (database), Krishna (Render) | Prototype +3, MVP +2, SaaS +2, global reliability 2 → 6 |
| 2 | Merge #71 (safety) and #68 (phones) | Atharva or Krishna | Clinical safety +0.5, prototype +0.5, mobile B- → B |
| 3 | Merge #70 and #63 | Krishna or Atharva | Trust 30/30 grounded; clarity +0.5 |
| 4 | A5: NG126 and the overdose source | Atharva | Clinical safety +1 |
| 5 | A9 safety case, then B6 clinician sign-off | Atharva, then the advisor | Clinical safety +2 to +3; regulatory 2 → 4 |
| 6 | B2 model check with Krishna's key | Krishna | Held-out crisis 11/30 → target 27/30; clinical safety up to +4 |
| 7 | A8 outreach: advisor first, then 5 interviews and a letter of intent | Atharva and Krishna | Venture +4 to +6; traction 1 → 3 |
| 8 | B3 native Arabic review (#23) and #67 | A native speaker | Women's experience +2; i18n C → B |
| 9 | B10 rehearsals and a backup video | Both | Team & pitch +2 |
| 10 | #44 Next 16 | Atharva | CI stability C+ → A |

## 6. Dates
- **Future Health registration:** closes 10 Nov (Krishna's Hack2skill login).
- **HealthX applications:** all members by 14 Nov, 23:59.
- **Selection:** 16 Nov (tag `pre-selection-2026-11-16`).
- **Build week:** 17–21 Nov, with code freeze on 21 Nov at 18:00.
- **Showcase:** 22 Nov.
