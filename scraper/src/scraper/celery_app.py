from __future__ import annotations

from celery import Celery

from scraper.celery_settings import load_celery_settings
from scraper.sources import get_sources

settings = load_celery_settings()


def _source_interval_seconds(source_key: str) -> float:
    source_minutes = settings.beat_source_intervals_minutes.get(
        source_key,
        settings.beat_interval_minutes,
    )
    return float(max(source_minutes, 1) * 60)


def _build_beat_schedule() -> dict[str, dict]:
    schedule: dict[str, dict] = {}
    for source_key in sorted(get_sources().keys()):
        schedule[f"scrape-{source_key}-both"] = {
            "task": "scraper.scrape_and_persist",
            "schedule": _source_interval_seconds(source_key),
            "kwargs": {
                "source": source_key,
                "department": "both",
                "max_pages": 1,
                "all_pages": True,
                "database_url": settings.beat_database_url,
                "db_path": settings.beat_db_path,
            },
        }
    return schedule

celery_app = Celery(
    "scraper",
    broker=settings.broker_url,
    backend=settings.result_backend,
)

celery_app.conf.update(
    task_default_queue="scraper",
    broker_connection_retry_on_startup=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_soft_time_limit=settings.task_soft_time_limit,
    task_time_limit=settings.task_time_limit,
    beat_schedule=_build_beat_schedule(),
)

celery_app.autodiscover_tasks(["scraper"])
