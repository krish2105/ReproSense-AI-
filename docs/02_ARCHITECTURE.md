# 02 · Architecture

## System diagram
```
                    ┌───────────────────────────────────────────────────────────┐
                    │            Next.js 15 web app (Vercel)                     │
                    │  /  landing   /demo   /app/* patient   /clinic/*   /admin/*│
                    │  next-intl (EN/AR, RTL) · Tailwind tokens · R3F hero        │
                    └───────────────┬───────────────────────────────────────────┘
                                    │ HTTPS (JWT from Supabase Auth, passkeys)
                    ┌───────────────▼───────────────────────────────────────────┐
                    │                 FastAPI (Render)                           │
                    │  security: auth check · RBAC · consent check · rate limit  │
                    │  api/  patients · logs · insights · assistant · reports    │
                    │        documents · clinic · admin · demo                   │
                    │  agents/ LangGraph pipeline (docs/03)                      │
                    │  rules/  YAML rule engine (pure Python)                    │
                    │  rag/    ingest + hybrid retrieval                         │
                    │  reports/ WeasyPrint PDF                                   │
                    └──────┬──────────────────────┬───────────────────┬─────────┘
                           │                      │                   │
            ┌──────────────▼───────┐   ┌──────────▼─────────┐  ┌──────▼──────────┐
            │ Supabase Postgres     │   │ Supabase Storage    │  │ LLM provider     │
            │ RLS · pgvector · audit│   │ encrypted uploads   │  │ (de-identified   │
            │ consent ledger        │   │ signed URLs         │  │  input only)     │
            └───────────────────────┘   └─────────────────────┘  └─────────────────┘
```

## Repository layout
```
reprosense/
  apps/web/
    app/(marketing)/page.tsx            landing
    app/demo/page.tsx                   persona switcher
    app/app/{page,onboarding,log,timeline,insights,assistant,report,documents,privacy}/
    app/clinic/{page,patients/[id]}/
    app/admin/page.tsx
    components/{ui,charts,cycle-ring,body-map,observation-card,citation,hero3d,...}
    lib/{api.ts,i18n,tokens.ts,auth.ts}
    messages/{en.json,ar.json}
  backend/app/
    main.py  config.py
    api/{patients,logs,insights,assistant,reports,documents,clinic,admin,demo}.py
    agents/{graph.py,intake.py,document.py,signal.py,safety.py,evidence.py,writer.py,report.py,care_gap.py}
    rules/{engine.py,features.py}       ← reads ../../rules/clinical_rules.yaml
    rag/{ingest.py,retrieve.py,rerank.py}
    ai/{llm.py,schemas.py,redact.py,guards.py}
    reports/{pdf.py,templates/report.html}
    security/{auth.py,rbac.py,consent.py,audit.py,ratelimit.py,headers.py}
    db/{models.py,migrations/,seed.py}
  rules/clinical_rules.yaml
  knowledge_base/{sources.yaml,summaries/*.md}
  data/synthetic/
  research/pcos_feature_evidence.ipynb   (Kaggle dataset, evidence only)
  tests/e2e/demo-path.spec.ts
```

## Data model (Postgres)
| Table | Key columns | Notes |
| --- | --- | --- |
| `profiles` | id, alias, role, language, age_range, menarche_age, is_synthetic | no real names needed |
| `consents` | id, profile_id, purpose, granted, granted_at, revoked_at | purposes: care_share, assistant, research |
| `cycles` | id, profile_id, start_date, end_date, length_days | derived from period logs |
| `daily_logs` | id, profile_id, date, flow, pain_score, pain_sites[], symptoms[], impact, mood, sleep_h, note_enc | `note_enc` field-encrypted |
| `events` | id, profile_id, type, date, details_json | pregnancy, delivery, gdm_diagnosis, lab_test |
| `lab_results` | id, profile_id, test_code, value, unit, ref_low, ref_high, source_doc_id, confirmed | from Document AI |
| `documents` | id, profile_id, storage_path, mime, status | encrypted bucket |
| `observations` | id, profile_id, rule_id, severity, status, supporting_entry_ids[], created_at | from rules only |
| `reports` | id, profile_id, pdf_path, created_at | |
| `shares` | id, report_id, clinic_id, token_hash, expires_at, revoked_at | |
| `care_gaps` | id, profile_id, clinic_id, type, due_date, status | e.g. postpartum_ogtt |
| `audit_log` | id, actor_id, action, target, at, prev_hash, hash | hash-chained |
| `kb_chunks` | id, source_id, text, embedding vector(1024), lang | RAG |

## API (REST, JSON, versioned `/v1`)
| Method | Path | Role |
| --- | --- | --- |
| POST | /v1/logs | patient |
| GET | /v1/timeline?months=12 | patient |
| POST | /v1/insights/run | patient |
| GET | /v1/insights | patient |
| POST | /v1/assistant/ask | patient |
| POST | /v1/documents (multipart) → GET /v1/documents/{id}/extraction | patient |
| POST | /v1/reports → GET /v1/reports/{id}.pdf | patient |
| POST | /v1/shares · DELETE /v1/shares/{id} | patient |
| GET | /v1/clinic/patients · /v1/clinic/patients/{id} | clinician (consented only) |
| PATCH | /v1/clinic/care-gaps/{id} | clinician |
| GET | /v1/admin/metrics | admin (aggregates, k ≥ 10) |
| POST | /v1/demo/reset · GET /v1/demo/personas | demo mode only |

## Key design decisions
1. **Rules, not black-box ML, decide observations** → explainable, testable, judge-safe.
2. **LLM only writes words** around rule output and retrieved evidence, under a JSON schema.
3. **One database** (Postgres + pgvector) to keep the hackathon stack small; Chroma/FAISS not needed.
4. **Provider-agnostic LLM client** so production can move to a UAE-hosted model without code changes.
5. **FHIR-shaped exports** (Patient, Observation, Condition, DocumentReference) so a future Malaffi integration is a mapping, not a rewrite.
