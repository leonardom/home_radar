"""Extensible real-estate scraper package."""

from scraper.models import ListingRecord, ScrapeRequest, ScrapeResult
from scraper.runner import run_scrape
from scraper.storage import PersistStats, persist_scrape_result

__all__ = [
	"ListingRecord",
	"ScrapeRequest",
	"ScrapeResult",
	"PersistStats",
	"run_scrape",
	"persist_scrape_result",
]
