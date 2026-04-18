# scraper

Extensible real-estate scraper project with a source-plugin architecture, built with a `src` layout and managed with `uv`.

## Project structure

- `src/scraper/main.py`: CLI entrypoint (`scraper` command)
- `src/scraper/runner.py`: source resolution and scrape orchestration
- `src/scraper/models.py`: normalized scrape request/result and listing schema
- `src/scraper/sources/`: source implementations and registry
  - `src/scraper/sources/black_grace_cowley.py`: Black Grace Cowley scraper (residential sales + lettings)
  - `src/scraper/sources/chrystals.py`: Chrystals scraper (residential sales + lettings)
  - `src/scraper/sources/deanwood.py`: Deanwood scraper (residential sales + lettings)
  - `src/scraper/sources/cowley_groves.py`: Cowley Groves scraper (residential sales + lettings)
  - `src/scraper/sources/dandara.py`: Dandara scraper (Isle of Man sales developments)
  - `src/scraper/sources/grays.py`: Grays Estate Agents scraper (residential sales + lettings)
  - `src/scraper/sources/hartford.py`: Hartford Homes scraper (buy listings; rent route currently empty)
  - `src/scraper/sources/partners.py`: Partners Real Estate scraper (residential sales + lettings)
  - `src/scraper/sources/prosearch.py`: Prosearch scraper (Isle of Man rentals)
- `src/scraper/fetcher.py`: reusable HTTP fetching logic (`httpx`)
- `src/scraper/parser.py`: shared parsing helpers (`beautifulsoup4`)
- `src/scraper/storage.py`: SQLAlchemy models and persistence/upsert logic
- `alembic/`: Alembic migration environment and revision files
- `tests/test_parser.py`: parser utility tests
- `tests/test_deanwood_source.py`: Deanwood parsing tests
- `tests/test_runner.py`: runner orchestration tests
- `pyproject.toml`: project metadata, dependencies, script entrypoint, tool config
- `uv.lock`: locked dependency versions for reproducible installs

## Setup

Install dependencies and create/update the local virtual environment:

```bash
uv sync
```

## Celery and Flower

The project includes Celery task wiring for asynchronous scraping and Flower for monitoring workers.

### Quick start (local)

1. Install dependencies:

```bash
uv sync
```

2. Start Redis (broker/result backend). If you use Docker:

```bash
docker run --rm -p 6379:6379 redis:7
```

3. In a new terminal, start a Celery worker:

```bash
uv run celery -A scraper.celery_app:celery_app worker --loglevel=info
```

4. In another terminal, start Celery beat (periodic scheduling):

```bash
uv run celery -A scraper.celery_app:celery_app beat --loglevel=info
```

5. In another terminal, start Flower:

```bash
uv run celery -A scraper.celery_app:celery_app flower --port=5555
```

6. Open Flower:

- `http://localhost:5555`

7. Trigger a task:

```bash
uv run python -c "from scraper.tasks import scrape_and_persist_task; r=scrape_and_persist_task.delay('deanwood', department='both'); print(r.id)"
```

You should see the task in Flower under task lists and worker activity.

### Configure broker/backend

Celery settings are environment-driven:

- `SCRAPER_CELERY_BROKER_URL` (default: `redis://localhost:6379/0`)
- `SCRAPER_CELERY_RESULT_BACKEND` (default: `redis://localhost:6379/0`)
- `SCRAPER_CELERY_TASK_SOFT_TIME_LIMIT` (default: `240`)
- `SCRAPER_CELERY_TASK_TIME_LIMIT` (default: `300`)
- `SCRAPER_CELERY_BEAT_INTERVAL_MINUTES` (global fallback, default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_BLACK_GRACE_COWLEY_MINUTES` (default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_CHRYSTALS_MINUTES` (default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_DEANWOOD_MINUTES` (default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_COWLEY_GROVES_MINUTES` (default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_DANDARA_MINUTES` (default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_GARFORTH_GRAY_MINUTES` (default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_HARTFORD_MINUTES` (default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_GRAYS_MINUTES` (default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_MANXMOVE_MINUTES` (default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_PARTNERS_MINUTES` (default: `30`)
- `SCRAPER_CELERY_BEAT_INTERVAL_PROSEARCH_MINUTES` (default: `30`)
- `SCRAPER_DATABASE_URL` (optional global DB URL used by CLI/tasks/beat)
- `SCRAPER_CELERY_BEAT_DATABASE_URL` (optional beat-specific DB URL override)
- `SCRAPER_CELERY_BEAT_DB_PATH` (default: `scraper.db`)

Example custom scheduling cadence:

```bash
export SCRAPER_CELERY_BEAT_INTERVAL_BLACK_GRACE_COWLEY_MINUTES=8
export SCRAPER_CELERY_BEAT_INTERVAL_CHRYSTALS_MINUTES=12
export SCRAPER_CELERY_BEAT_INTERVAL_DEANWOOD_MINUTES=10
export SCRAPER_CELERY_BEAT_INTERVAL_COWLEY_GROVES_MINUTES=15
export SCRAPER_CELERY_BEAT_INTERVAL_DANDARA_MINUTES=25
export SCRAPER_CELERY_BEAT_INTERVAL_GARFORTH_GRAY_MINUTES=30
export SCRAPER_CELERY_BEAT_INTERVAL_HARTFORD_MINUTES=30
export SCRAPER_CELERY_BEAT_INTERVAL_GRAYS_MINUTES=20
export SCRAPER_CELERY_BEAT_INTERVAL_MANXMOVE_MINUTES=60
export SCRAPER_CELERY_BEAT_INTERVAL_PARTNERS_MINUTES=20
export SCRAPER_CELERY_BEAT_INTERVAL_PROSEARCH_MINUTES=20
```

The `scraper.scrape_and_persist` task retries transient failures up to 3 times with
exponential backoff and jitter.

Beat automatically schedules all registered sources with `department=both`, using
source-specific intervals when configured and falling back to the global interval.

### How scheduling works

- Beat schedules one periodic task per source (`black_grace_cowley`, `chrystals`, `cowley_groves`, `dandara`, `deanwood`, `garforth_gray`, `grays`, `hartford`, `manxmove`, `partners`, `prosearch`).
- Each scheduled task runs with `department=both` and `all_pages=true` by default.
- Source-specific intervals are used when set.
- If a source interval is not set, `SCRAPER_CELERY_BEAT_INTERVAL_MINUTES` is used.

### Run commands reference

```bash
uv run celery -A scraper.celery_app:celery_app worker --loglevel=info
uv run celery -A scraper.celery_app:celery_app beat --loglevel=info
uv run celery -A scraper.celery_app:celery_app flower --port=5555
```

Open Flower at `http://localhost:5555`.

If the worker exits on startup, ensure Redis is running and reachable at the configured broker URL.

Common checks:

```bash
redis-cli ping
uv run python -c "from scraper.celery_app import celery_app; print(celery_app.conf.broker_url)"
```

### Trigger task from Python shell

```bash
uv run python -c "from scraper.tasks import scrape_and_persist_task; print(scrape_and_persist_task.delay('deanwood', department='both').id)"
```

Get task result by id:

```bash
uv run python -c "from scraper.celery_app import celery_app; r=celery_app.AsyncResult('<TASK_ID>'); print(r.state); print(r.result)"
```

## Run the scraper

Run the CLI against a named source:

```bash
uv run scraper deanwood
```

Useful options:

```bash
uv run scraper deanwood --json
uv run scraper deanwood --department sales
uv run scraper deanwood --department lettings
uv run scraper deanwood --department both --max-pages 2 --timeout 5
uv run scraper deanwood --department both --all-pages --timeout 5
uv run scraper deanwood --department both --all-pages --db-path data/scraper.db --json
uv run scraper deanwood --department both --all-pages --db-url postgresql+psycopg://user:pass@localhost:5432/home_radar --json
uv run scraper garforth_gray --department sales --max-pages 1 --json
uv run scraper garforth_gray --department lettings --max-pages 1 --json
uv run scraper manxmove --department sales --max-pages 1 --json
uv run scraper manxmove --department lettings --max-pages 1 --json
uv run scraper cowley_groves --department sales --max-pages 1 --json
uv run scraper cowley_groves --department lettings --max-pages 1 --json
uv run scraper chrystals --department sales --max-pages 1 --json
uv run scraper chrystals --department lettings --max-pages 1 --json
uv run scraper black_grace_cowley --department sales --max-pages 1 --json
uv run scraper black_grace_cowley --department lettings --max-pages 1 --json
uv run scraper grays --department sales --max-pages 1 --json
uv run scraper grays --department lettings --max-pages 1 --json
uv run scraper partners --department sales --max-pages 1 --json
uv run scraper partners --department lettings --max-pages 1 --json
uv run scraper dandara --department sales --max-pages 1 --json
uv run scraper hartford --department sales --max-pages 1 --json
uv run scraper prosearch --department lettings --max-pages 1 --json
```

## Database persistence

Scrape results are stored with SQLAlchemy ORM on every run.

- Production recommendation: PostgreSQL via `SCRAPER_DATABASE_URL` or `--db-url`
- Default local/test fallback: SQLite (`scraper.db`) via `--db-path`
- Dedup key: `(source, listing_url)`
- Change detection: SHA-256 hash of stable business fields (title, status, price, rooms, etc.)

Database resolution order:

1. `--db-url`
2. `SCRAPER_DATABASE_URL`
3. `--db-path` (SQLite fallback)

Supported URL examples:

- `postgresql+psycopg://user:pass@localhost:5432/home_radar`
- `sqlite+pysqlite:///scraper.db`

Upsert behavior:

- New listing: insert record
- Existing listing with changed hash (e.g., price changed): update record
- Existing listing with same hash: keep record as unchanged and only refresh seen timestamps

JSON output includes persistence counters under `database`:

- `inserted`
- `updated`
- `unchanged`

## Database migrations (Alembic)

Run migrations against your configured DB URL:

```bash
export SCRAPER_DATABASE_URL=postgresql+psycopg://USER:PASSWORD@DB_HOST:5432/home_radar
uv run alembic upgrade head
```

Create a new migration after model changes:

```bash
uv run alembic revision --autogenerate -m "describe change"
```

Show current migration state:

```bash
uv run alembic current
uv run alembic history
```

## Current source coverage

- `black_grace_cowley`: residential sales and residential lettings list pages
- `chrystals`: residential sales and residential lettings list pages
- `deanwood`: residential sales and residential lettings list pages
- `cowley_groves`: residential sales and residential lettings list pages
- `dandara`: Isle of Man sales developments from Dandara's public search data endpoint
- `garforth_gray`: sales and rentals list pages
- `grays`: sales and lettings list pages
- `hartford`: buy category listings (`/property-category/buy/`); rent category is currently available but may return no active listings
- `manxmove`: sales and lettings list pages
- `partners`: sales and lettings list pages
- `prosearch`: rentals list page (`/properties/Rental`); sales listings are currently unavailable on the public site
- v1 scope is listing pages only (no property-detail-page enrichment yet)

## Output schema

Each listing includes normalized fields:

- `source`
- `department` (`sales` or `lettings`)
- `listing_url`
- `title`
- `cover_image_url`
- `region`
- `status`
- `price_raw`
- `price_value`
- `price_frequency` (`month`, `pa`, or `null`)
- `beds`
- `receptions`
- `baths`
- `property_type`
- `scraped_at`

## Add a new source

1. Create a new source class under `src/scraper/sources/` that implements `ListingSource`.
2. Register the source in `src/scraper/sources/__init__.py`.
3. Add parser tests for that source under `tests/`.
4. Run tests and lint checks.

## Run tests

Run all tests:

```bash
uv run pytest
```

Run a specific test file:

```bash
uv run pytest tests/test_parser.py
```

## Run lint

Check code style and import ordering:

```bash
uv run ruff check .
```

Optionally auto-fix lint issues where possible:

```bash
uv run ruff check . --fix
```

## Dependency management

Add a runtime dependency:

```bash
uv add <package>
```

Add a development dependency:

```bash
uv add --dev <package>
```
