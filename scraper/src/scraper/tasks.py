from __future__ import annotations

import logging
import os
from dataclasses import asdict

from scraper.celery_app import celery_app
from scraper.models import Department, ScrapeRequest
from scraper.runner import run_scrape
from scraper.storage import persist_scrape_result

logger = logging.getLogger(__name__)


def _resolve_departments(choice: str) -> list[Department]:
    if choice == "sales":
        return ["sales"]
    if choice == "lettings":
        return ["lettings"]
    if choice == "both":
        return ["sales", "lettings"]
    raise ValueError("department must be one of: sales, lettings, both")


def run_scrape_job(
    *,
    source: str,
    department: str = "both",
    timeout: float = 10.0,
    max_pages: int = 1,
    all_pages: bool = False,
    database_url: str | None = None,
    db_path: str = "scraper.db",
) -> dict:
    resolved_database_url = database_url or os.getenv("SCRAPER_DATABASE_URL")
    logger.info(
        (
            "Starting scrape job source=%s department=%s all_pages=%s "
            "max_pages=%s database_url=%s db_path=%s"
        ),
        source,
        department,
        all_pages,
        max_pages,
        resolved_database_url,
        db_path,
    )

    effective_max_pages: int | None = None if all_pages else max_pages
    request = ScrapeRequest(
        source=source,
        departments=_resolve_departments(department),
        timeout=timeout,
        max_pages=effective_max_pages,
    )

    result = run_scrape(request)
    persist_stats = persist_scrape_result(
        result=result,
        database_url=resolved_database_url,
        db_path=db_path,
    )

    logger.info(
        "Completed scrape job source=%s listing_count=%s inserted=%s updated=%s unchanged=%s",
        result.source,
        result.listing_count,
        persist_stats.inserted,
        persist_stats.updated,
        persist_stats.unchanged,
    )

    return {
        "source": result.source,
        "departments": result.departments,
        "listing_count": result.listing_count,
        "scraped_at": result.scraped_at,
        "database": {
            "url": resolved_database_url,
            "path": db_path,
            "inserted": persist_stats.inserted,
            "updated": persist_stats.updated,
            "unchanged": persist_stats.unchanged,
        },
        "job": {
            "all_pages": all_pages,
            "max_pages": effective_max_pages,
            "timeout": timeout,
        },
        "listings": [asdict(listing) for listing in result.listings],
    }


@celery_app.task(
    name="scraper.scrape_and_persist",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def scrape_and_persist_task(
    source: str,
    department: str = "both",
    timeout: float = 10.0,
    max_pages: int = 1,
    all_pages: bool = False,
    database_url: str | None = None,
    db_path: str = "scraper.db",
) -> dict:
    return run_scrape_job(
        source=source,
        department=department,
        timeout=timeout,
        max_pages=max_pages,
        all_pages=all_pages,
        database_url=database_url,
        db_path=db_path,
    )
