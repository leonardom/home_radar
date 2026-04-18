from __future__ import annotations

from urllib.parse import urljoin

from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.fetcher import fetch_html
from scraper.models import Department, ListingRecord, utc_now_iso
from scraper.parser import normalize_text, parse_price
from scraper.sources.base import ListingSource


class HartfordSource(ListingSource):
    key = "hartford"
    supported_departments: tuple[Department, ...] = ("sales", "lettings")

    _DEPARTMENT_URLS: dict[Department, str] = {
        "sales": "https://hartford.im/property-category/buy/",
        "lettings": "https://hartford.im/property-category/rent/",
    }
    _BASE_URL = "https://hartford.im"

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
            page_url = self._DEPARTMENT_URLS[department]
            html = fetch_html(page_url, timeout=timeout, user_agent=user_agent)
            parsed = self._parse_listings(html=html, department=department)

            for listing in parsed:
                if listing.listing_url in seen_urls:
                    continue
                listings.append(listing)
                seen_urls.add(listing.listing_url)

        return listings

    def _parse_listings(self, html: str, department: Department) -> list[ListingRecord]:
        soup = BeautifulSoup(html, "html.parser")
        records: list[ListingRecord] = []

        for card in soup.select("a.item.anim-1000[href]"):
            listing_url = self._extract_listing_url(card)
            if listing_url is None:
                continue

            title = self._extract_title(card)
            if title is None:
                continue

            cover_image_url = self._extract_cover_image_url(card)
            region = self._extract_region(card)
            status = self._extract_status(card, department)
            price_raw, price_value, price_frequency = self._extract_price(card)

            records.append(
                ListingRecord(
                    source=self.key,
                    department=department,
                    listing_url=listing_url,
                    title=title,
                    cover_image_url=cover_image_url,
                    region=region,
                    status=status,
                    price_raw=price_raw,
                    price_value=price_value,
                    price_frequency=price_frequency,
                    beds=None,
                    receptions=None,
                    baths=None,
                    property_type=None,
                    scraped_at=utc_now_iso(),
                )
            )

        return records

    def _extract_listing_url(self, card: Tag) -> str | None:
        href = normalize_text(card.get("href", ""))
        if not href or "/property/" not in href:
            return None

        return urljoin(self._BASE_URL, href)

    def _extract_title(self, card: Tag) -> str | None:
        title_node = card.select_one(".title_details h2")
        if not isinstance(title_node, Tag):
            return None

        title = normalize_text(title_node.get_text(" ", strip=True))
        return title or None

    def _extract_cover_image_url(self, card: Tag) -> str | None:
        image = card.select_one(".img-holder img[src]")
        if not isinstance(image, Tag):
            return None

        image_src = normalize_text(image.get("src", ""))
        if not image_src:
            return None

        return urljoin(self._BASE_URL, image_src)

    def _extract_region(self, card: Tag) -> str | None:
        region_node = card.select_one(".title_details h4")
        if not isinstance(region_node, Tag):
            return None

        region = normalize_text(region_node.get_text(" ", strip=True))
        return region or None

    def _extract_status(self, card: Tag, department: Department) -> str | None:
        status_node = card.select_one("span.status")
        if isinstance(status_node, Tag):
            status = normalize_text(status_node.get_text(" ", strip=True))
            if status:
                return status

        return "FOR SALE" if department == "sales" else "TO LET"

    def _extract_price(self, card: Tag) -> tuple[str | None, float | None, str | None]:
        snippet_node = card.select_one(".title_details p")
        if not isinstance(snippet_node, Tag):
            return (None, None, None)

        snippet = normalize_text(snippet_node.get_text(" ", strip=True))
        if not snippet:
            return (None, None, None)

        if "£" not in snippet and "&#163;" not in snippet:
            return (None, None, None)

        return parse_price(snippet)
