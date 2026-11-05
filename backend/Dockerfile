# ReproSense API (FastAPI + WeasyPrint). Build from the repository root, because the API reads rules/, knowledge_base/
# and the synthetic data at runtime:
#   docker build -f backend/Dockerfile -t reprosense-api .
# Synthetic demo data only (DEMO_MODE=true); secrets come from the environment, never from the image.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never

# Pango and HarfBuzz for the doctor PDF; DejaVu and Noto so Latin and Arabic text render without the Mac fonts.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b fonts-dejavu-core fonts-noto-core \
 && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.11.18 /uv /bin/uv

WORKDIR /srv/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Same layout as the repository: app/config.py resolves rules/, knowledge_base/ and data/ from /srv.
COPY backend/app ./app
COPY rules /srv/rules
COPY knowledge_base /srv/knowledge_base
COPY data/synthetic/output /srv/data/synthetic/output

RUN useradd --create-home --uid 10001 reprosense && chown -R reprosense /srv
USER reprosense

EXPOSE 8010
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD python -c "import urllib.request,os;urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",\"8010\")}/healthz')"
CMD ["sh", "-c", "exec /srv/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8010} --proxy-headers --forwarded-allow-ips='*'"]
