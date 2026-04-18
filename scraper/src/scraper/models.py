from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

Department = Literal["sales", "lettings"]


@dataclass(slots=True)
class ListingRecord:
    source: str
    department: Department
    listing_url: str
    title: str | None
    cover_image_url: str | None
    region: str | None
    status: str | None
    price_raw: str | None
    price_value: float | None
    price_frequency: str | None
    beds: int | None
    receptions: int | None
    baths: int | None
    property_type: str | None
    scraped_at: str


@dataclass(slots=True)
class ScrapeRequest:
    source: str
    departments: list[Department]
    timeout: float = 10.0
    max_pages: int | None = 1
    user_agent: str = "scraper/0.1.0"


@dataclass(slots=True)
class ScrapeResult:
    source: str
    departments: list[Department]
    listing_count: int
    listings: list[ListingRecord]
    scraped_at: str = field(default_factory=lambda: utc_now_iso())


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
