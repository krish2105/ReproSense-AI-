# 07 · Security and privacy

Reproductive health data is among the most sensitive data there is. Global period apps have faced regulator action over
sharing data with advertisers (e.g. the US FTC's 2021 case against Flo). Our promise: **we never sell or advertise on health data.**

## Apple-style principles
| Principle | ReproSense implementation |
| --- | --- |
| Data minimisation | Alias, age range, cycle data. No name, Emirates ID or phone needed for patients. |
| On-device first | Feature calculations for the dashboard run in the browser; server gets data only for consented features. |
| Passwordless | Passkeys (WebAuthn) via Supabase Auth; magic link fallback. |
| Private notes | Notes encrypted client-side (WebCrypto AES-GCM, key derived from passkey session) — server stores ciphertext. |
| Transparency | Privacy centre with "who saw my data" timeline from the audit log. |
| Control | Granular consent per purpose; export JSON; delete account in one step. |

## Checklist (must all be ticked in Phase 8)
- [ ] Supabase Auth with passkeys; JWT verified on every API call; short-lived tokens (15 min) + refresh
- [ ] RBAC roles: patient, clinician, admin; every endpoint declares allowed roles
- [ ] Postgres RLS on every table; tests prove a clinician cannot read a non-consented patient
- [ ] Admin endpoints return aggregates only, minimum group size 10
- [ ] AES-256 at rest (Supabase) + field-level encryption for notes and documents
- [ ] Share links: random 32-byte token, stored hashed, 7-day expiry, revocable, logged
- [ ] Hash-chained audit log for every read/write of health data
- [ ] Security headers: CSP (no inline scripts except nonce), HSTS, X-Frame-Options DENY, Referrer-Policy strict-origin
- [ ] Rate limits: 60 req/min per user, 10/min on assistant and uploads
- [ ] Input validation: Zod (web) + Pydantic (API); upload type/size limits (10 MB, PDF/PNG/JPG/TXT)
- [ ] LLM safety: PII redaction before calls; uploaded document text wrapped as data; instruction-like text stripped; output guard. Redaction is enough for synthetic data only: real data needs a UAE-hosted model or no LLM
- [x] AI opt-out: Privacy → "Use AI features" off closes the assistant (API 403 `ai_off`) and keeps template wording; tested in `test_ai_choice.py` and `e2e/ai-choice.spec.ts`
- [ ] Secrets only in env vars; `.env` git-ignored; gitleaks in CI
- [ ] Dependency scanning (npm audit, pip-audit, Dependabot)
- [ ] No analytics on health screens; privacy-friendly page analytics only on the landing page

## UAE compliance map (for the pitch)
| Requirement | Our answer |
| --- | --- |
| Federal Law No. 2 of 2019 (health data stays in UAE, Art. 13; kept at least 25 years, Art. 20) | Production on UAE-region cloud, disaster recovery included, with a UAE-hosted model or no LLM; hackathon uses synthetic data only. Open clash: 25-year retention vs. our one-step delete (decide with DoH: delete = remove from her app, archive held per law) |
| ADHICS (Abu Dhabi health cybersecurity) | Controls above mapped to ADHICS domains before the first pilot; formal assessment = milestone |
| DoH Responsible AI Standard V1 (Oct 2025) | Clause-by-clause map on the `/trust` page: human in the loop (navigator only drafts), fallbacks (template wording, demo-safe mode), role-specific explanations, **patient AI opt-out (Privacy switch, enforced)**, fairness checks by age and nationality, hash-chained audit log. Still to do before a pilot: risk register, data card, UAE-only support access |
| UAE PDPL | Consent, purpose limitation, access/export/delete rights |
| Medical device question | The Emirates Drug Establishment (federal), not DoH, decides device status (Federal Decree-Law 38 of 2024). Our wording keeps cards informing, not driving, care; ask EDE for a written classification before any pilot. DoH is the route for HTA, app registration and ADHICS |
| DoH Patient Healthcare Data Privacy Standard (2020) | Applies to vendors: purpose-by-purpose written consent (we have it), selective sharing (care_share), privacy impact assessment before a pilot, breach notice to DoH within 24 hours |
| Malaffi (ADHIE) | Only licensed facilities connect; DoH policy forbids copying Malaffi data elsewhere. Our route: FHIR R4 export into the clinic's EMR |
