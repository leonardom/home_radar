from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(slots=True)
class CelerySettings:
    broker_url: str
    result_backend: str
    task_soft_time_limit: int
    task_time_limit: int
    beat_interval_minutes: int
    beat_source_intervals_minutes: dict[str, int]
    beat_database_url: str | None
    beat_db_path: str



def load_celery_settings() -> CelerySettings:
    source_intervals = {
        "black_grace_cowley": int(
            os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_BLACK_GRACE_COWLEY_MINUTES", "30")
        ),
        "chrystals": int(os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_CHRYSTALS_MINUTES", "30")),
        "cowley_groves": int(
            os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_COWLEY_GROVES_MINUTES", "30")
        ),
        "dandara": int(os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_DANDARA_MINUTES", "30")),
        "deanwood": int(os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_DEANWOOD_MINUTES", "30")),
        "garforth_gray": int(
            os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_GARFORTH_GRAY_MINUTES", "30")
        ),
        "hartford": int(os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_HARTFORD_MINUTES", "30")),
        "grays": int(os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_GRAYS_MINUTES", "30")),
        "manxmove": int(os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_MANXMOVE_MINUTES", "30")),
        "partners": int(os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_PARTNERS_MINUTES", "30")),
        "prosearch": int(os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_PROSEARCH_MINUTES", "30")),
    }

    return CelerySettings(
        broker_url=os.getenv("SCRAPER_CELERY_BROKER_URL", "redis://localhost:6379/0"),
        result_backend=os.getenv("SCRAPER_CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
        task_soft_time_limit=int(os.getenv("SCRAPER_CELERY_TASK_SOFT_TIME_LIMIT", "240")),
        task_time_limit=int(os.getenv("SCRAPER_CELERY_TASK_TIME_LIMIT", "300")),
        beat_interval_minutes=int(os.getenv("SCRAPER_CELERY_BEAT_INTERVAL_MINUTES", "30")),
        beat_source_intervals_minutes=source_intervals,
        beat_database_url=os.getenv("SCRAPER_CELERY_BEAT_DATABASE_URL")
        or os.getenv("SCRAPER_DATABASE_URL"),
        beat_db_path=os.getenv("SCRAPER_CELERY_BEAT_DB_PATH", "scraper.db"),
    )
