# 08 · Deploy rules

## Environments
Step-by-step setup for the demo deploy (Supabase → Render → Vercel, about 20 minutes): **docs/16_DEPLOY_NOW.md**.

| Env | Web | API | DB | Data |
| --- | --- | --- | --- | --- |
| local | `pnpm dev` :3000 | `uvicorn` :8010 | local Postgres with pgvector (`make db seed`) | synthetic |
| preview | Vercel preview per PR | Render preview | Supabase dev | synthetic |
| demo (judges) | Vercel prod `reprosense.vercel.app` | Render `reprosense-api` | Supabase demo project | synthetic, reset button |
| backup | Replit deployment (tech partner) | same repo | same DB | synthetic |

## Rules
1. **Never deploy with real data.** `DEMO_MODE=true` in all hackathon envs; API refuses records without `is_synthetic=true`.
2. **Main is always demo-ready.** Work on branches; merge only when CI is green (lint, typecheck, tests, generator check).
3. **Code freeze Sat 21 Nov 18:00 GST.** After that: copy fixes only, with a rollback plan.
4. **Secrets** live in Vercel/Render/Supabase dashboards. Required: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (API only),
   `LLM_PROVIDER`, `ANTHROPIC_API_KEY`, `EMBEDDINGS_PROVIDER`, `JWT_AUDIENCE`, `DEMO_MODE`, `ALLOWED_ORIGINS`.
5. **CORS** allows only the web origin(s).
6. **Health checks**: `/healthz` (API up) and `/readyz` (DB + LLM reachable). Uptime ping every 5 min on demo day.
7. **Cold starts**: Render free tier sleeps — use a paid instance or a warm-up ping 10 min before the pitch.
8. **Demo reset**: `POST /v1/demo/reset` reloads seed data (admin only, demo mode only).
9. **Offline fallback**: cache LLM outputs for all 8 personas (`backend/app/ai/cache/`) — the demo works if the LLM is down.
10. **Backup video**: 2-minute screen recording of the full demo path, on two laptops and a USB stick.
11. **Disclosure**: footer and pitch credits list AI tools used (Claude, image generator) and any prior work.

## CI (GitHub Actions)
```
jobs: lint-web, typecheck-web, test-web, lint-api (ruff), test-api (pytest), generator-check
      (python3 data/synthetic/generate_synthetic.py → exit 0), e2e (Playwright demo path on preview), gitleaks
```

## Demo-day checklist
- [ ] Both URLs open on venue Wi-Fi and phone hotspot
- [ ] Demo reset done; dark/light both checked; Arabic toggle checked
- [ ] Cached AI responses warm; PDF downloads
- [ ] Laptop: notifications off, zoom 110%, browser profile clean, charger
