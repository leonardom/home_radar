from __future__ import annotations

from abc import ABC, abstractmethod

from scraper.models import Department, ListingRecord


class ListingSource(ABC):
    key: str
    supported_departments: tuple[Department, ...]

    @abstractmethod
    def scrape(
        self,
        departments: list[Department],
        timeout: float,
        max_pages: int | None,
        user_agent: str,
    ) -> list[ListingRecord]:
        raise NotImplementedError
