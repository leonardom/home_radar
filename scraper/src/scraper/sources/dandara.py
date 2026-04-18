from __future__ import annotations

import re
from urllib.parse import urljoin

import httpx

from scraper.models import Department, ListingRecord, utc_now_iso
from scraper.parser import normalize_text, parse_price
from scraper.sources.base import ListingSource


class DandaraSource(ListingSource):
    key = "dandara"
    supported_departments: tuple[Department, ...] = ("sales", "lettings")

    _ENDPOINT_URL = "https://www.dandara.com/api/getsearchdata/all/all/all/50/all/developments"
    _BASE_URL = "https://www.dandara.com"

    def scrape(
        self,
        departments: list[Department],
        timeout: float,
        max_pages: int | None,
        user_agent: str,
    ) -> list[ListingRecord]:
        del max_pages

        listings: list[ListingRecord] = []
        seen_urls: set[str] = set()

        for department in departments:
            # Dandara exposes Isle of Man sales developments; no lettings feed was found.
            if department != "sales":
                continue

            try:
                results = self._fetch_results(timeout=timeout, user_agent=user_agent)
            except httpx.HTTPError:
                continue
            parsed = self._parse_listings(results=results, department=department)

            for listing in parsed:
                if listing.listing_url in seen_urls:
                    continue
                listings.append(listing)
                seen_urls.add(listing.listing_url)

        return listings

    def _fetch_results(self, timeout: float, user_agent: str) -> list[dict]:
        headers = {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": user_agent,
            "X-Requested-With": "XMLHttpRequest",
        }
        response = httpx.get(
            self._ENDPOINT_URL,
            headers=headers,
            timeout=timeout,
            follow_redirects=True,
        )
        response.raise_for_status()

        payload = response.json()
        if not isinstance(payload, dict):
            return []

        results = payload.get("results")
        if not isinstance(results, list):
            return []

        return [item for item in results if isinstance(item, dict)]

    def _parse_listings(
        self,
        results: list[dict],
        department: Department,
    ) -> list[ListingRecord]:
        records: list[ListingRecord] = []

        for item in results:
            if not self._is_isle_of_man_result(item):
                continue

            listing_url = self._extract_listing_url(item)
            if listing_url is None:
                continue

            title = self._extract_title(item)
            if title is None:
                continue

            price_raw, price_value, price_frequency = parse_price(
                self._extract_price_label(item)
            )

            records.append(
                ListingRecord(
                    source=self.key,
                    department=department,
                    listing_url=listing_url,
                    title=title,
                    cover_image_url=self._extract_cover_image_url(item),
                    region=self._extract_region(item),
                    status=self._extract_status(item, department),
                    price_raw=price_raw,
                    price_value=price_value,
                    price_frequency=price_frequency,
                    beds=self._extract_beds(item),
                    receptions=None,
                    baths=None,
                    property_type="development",
                    scraped_at=utc_now_iso(),
                )
            )

        return records

    def _is_isle_of_man_result(self, item: dict) -> bool:
        url = normalize_text(str(item.get("url", "")))
        if "/isle-of-man/" in url.lower():
            return True

        searchable_parts = [
            item.get("title", ""),
            item.get("simpleaddress", ""),
            item.get("searcharea", ""),
            item.get("description", ""),
            item.get("county", ""),
        ]
        text = " ".join(str(part) for part in searchable_parts).lower()
        return "isle of man" in text

    def _extract_listing_url(self, item: dict) -> str | None:
        raw_url = normalize_text(str(item.get("url", "")))
        if not raw_url:
            return None
        return urljoin(self._BASE_URL, raw_url)

    def _extract_title(self, item: dict) -> str | None:
        title = normalize_text(str(item.get("title", "")))
        return title or None

    def _extract_cover_image_url(self, item: dict) -> str | None:
        raw_image_url = normalize_text(str(item.get("coverimageurl", "")))
        if not raw_image_url:
            return None
        return urljoin(self._BASE_URL, raw_image_url)

    def _extract_region(self, item: dict) -> str | None:
        simple_address = normalize_text(str(item.get("simpleaddress", "")))
        if not simple_address:
            return None

        parts = [normalize_text(part) for part in simple_address.split(",")]
        parts = [part for part in parts if part]
        if not parts:
            return None

        if len(parts) >= 2 and parts[-1].lower() == "isle of man":
            return parts[-2]

        if len(parts) >= 2:
            return parts[0]

        return parts[0]

    def _extract_status(self, item: dict, department: Department) -> str | None:
        status = normalize_text(str(item.get("status", "")))
        if status:
            return status
        return "FOR SALE" if department == "sales" else "TO LET"

    def _extract_price_label(self, item: dict) -> str:
        for key in ("pricerangeformatted", "priceformatted", "price"):
            value = normalize_text(str(item.get(key, "")))
            if value:
                return value
        return ""

    def _extract_beds(self, item: dict) -> int | None:
        bedroom_range = normalize_text(str(item.get("bedroomrange", "")))
        if not bedroom_range:
            return None

        match = re.search(r"\d+", bedroom_range)
        if match is None:
            return None

        return int(match.group(0))