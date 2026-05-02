# Local development — hot reload with compose volume mount
FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry==1.8.5

WORKDIR /app

ENV POETRY_VIRTUALENVS_CREATE=true \
    POETRY_NO_INTERACTION=1 \
    PYTHONUNBUFFERED=1

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-ansi --no-root

COPY . .
RUN poetry install --no-ansi

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
