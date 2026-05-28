# ── Stage 1 : builder ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt


# ── Stage 2 : image finale ────────────────────────────────────────────────────
FROM python:3.12-slim

# Utilisateur non-root
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Code source + dataset
COPY app/  ./app/
COPY data/ ./data/

RUN chown -R appuser:appuser /app
USER appuser

ENV PORT=8000
ENV INTERVAL_SECONDS=300

EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c \
    "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')"

CMD uvicorn app.main:app \
    --host 0.0.0.0 \
    --port ${PORT} \
    --workers 2 \
    --log-level info \
    --access-log
