from __future__ import annotations

from scraper.models import Department, ScrapeRequest, ScrapeResult
from scraper.sources import get_source


def run_scrape(request: ScrapeRequest) -> ScrapeResult:
    source = get_source(request.source)
    _validate_departments(request.departments, source.supported_departments)

    listings = source.scrape(
        departments=request.departments,
        timeout=request.timeout,
        max_pages=request.max_pages,
        user_agent=request.user_agent,
    )

    return ScrapeResult(
        source=source.key,
        departments=request.departments,
        listing_count=len(listings),
        listings=listings,
    )


def _validate_departments(
    selected: list[Department],
    supported: tuple[Department, ...],
) -> None:
    invalid = [department for department in selected if department not in supported]
    if invalid:
        raise ValueError(
            f"source does not support requested departments: {', '.join(invalid)}"
        )
