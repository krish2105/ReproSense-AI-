# ReproSense — common commands (macOS + Homebrew Postgres 17 with pgvector; see HANDOFF.md)
# macOS strips DYLD_* when launching /bin/sh, so the library path is set inline (WeasyPrint needs Homebrew Pango)
LIBS := DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib
API_PORT ?= 8010

env:            ## create a local .env with random keys (never committed)
	python3 tools/make_env.py

db:             ## create local databases (needs Postgres with pgvector listening on /tmp)
	psql -h /tmp -d postgres -qc "create database reprosense" || true
	psql -h /tmp -d postgres -qc "create database reprosense_test" || true

data:           ## regenerate synthetic data (byte-identical for the same seed)
	python3 data/synthetic/generate_synthetic.py

seed:           ## schema + RLS + synthetic data + RAG index
	cd backend && $(LIBS) uv run python -m app.db.seed

api:            ## run the API on :8010 (8000 is used by another local project)
	cd backend && $(LIBS) uv run uvicorn app.main:app --port $(API_PORT) --reload

test:           ## backend lint + tests (uses the reprosense_test database)
	cd backend && $(LIBS) uv run ruff check app tests && $(LIBS) uv run pytest -q

mockup:         ## rebuild the HTML mockup from the synthetic data
	python3 mockup/build_mockup.py

.PHONY: env db data seed api test mockup
