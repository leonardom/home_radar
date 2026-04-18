from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.fetcher import fetch_html
from scraper.models import Department, ListingRecord, utc_now_iso
from scraper.parser import normalize_text, parse_price
from scraper.sources.base import ListingSource


class ProsearchSource(ListingSource):
    key = "prosearch"
    supported_departments: tuple[Department, ...] = ("sales", "lettings")

    _DEPARTMENT_URLS: dict[Department, str | None] = {
        "sales": None,
        "lettings": "https://www.prosearch.co.im/properties/Rental",
    }
    _BASE_URL = "https://www.prosearch.co.im"

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
            page_url = self._DEPARTMENT_URLS.get(department)
            if page_url is None:
                continue

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

        for card in soup.select("div.property-card"):
            listing_url = self._extract_listing_url(card)
            if listing_url is None:
                continue

            title = self._extract_title(card)
            if title is None:
                continue

            cover_image_url = self._extract_cover_image_url(card)
            description = self._extract_description(card)
            region = self._extract_region(title=title, description=description)
            status = self._extract_status(department)
            price_raw, price_value, price_frequency = self._extract_price(card)
            beds = self._extract_beds(card)

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
                    beds=beds,
                    receptions=None,
                    baths=None,
                    property_type=None,
                    scraped_at=utc_now_iso(),
                )
            )

        return records

    def _extract_listing_url(self, card: Tag) -> str | None:
        details_link = card.select_one("a[href^='/property/']")
        if not isinstance(details_link, Tag):
            return None

        href = normalize_text(details_link.get("href", ""))
        if not href:
            return None

        return urljoin(self._BASE_URL, href)

    def _extract_title(self, card: Tag) -> str | None:
        title_node = card.select_one("h5.card-title")
        if not isinstance(title_node, Tag):
            return None

        title = normalize_text(title_node.get_text(" ", strip=True))
        return title or None

    def _extract_cover_image_url(self, card: Tag) -> str | None:
        image = card.select_one("a[href^='/property/'] img[src]")
        if not isinstance(image, Tag):
            return None

        image_src = normalize_text(image.get("src", ""))
        if not image_src:
            return None

        return urljoin(self._BASE_URL, image_src)

    def _extract_description(self, card: Tag) -> str | None:
        for text_node in card.select("p.card-text"):
            if not isinstance(text_node, Tag):
                continue

            class_names = set(text_node.get("class", []))
            if "card-primary" in class_names:
                continue

            description = normalize_text(text_node.get_text(" ", strip=True))
            if description:
                return description

        return None

    def _extract_region(self, title: str, description: str | None) -> str | None:
        if description:
            prefix_match = re.match(r"^\s*([A-Za-z\s]+?)\s*-", description)
            if prefix_match is not None:
                prefix = normalize_text(prefix_match.group(1))
                if prefix:
                    return prefix

        parts = [normalize_text(part) for part in title.split(",")]
        parts = [part for part in parts if part]
        filtered = [
            part
            for part in parts
            if part.lower() not in {"isle of man"} and not re.fullmatch(r"IM\d[\w\s-]*", part)
        ]
        if len(filtered) >= 2:
            return filtered[-1]
        if filtered:
            return filtered[0]
        return None

    def _extract_status(self, department: Department) -> str:
        return "FOR SALE" if department == "sales" else "TO LET"

    def _extract_price(self, card: Tag) -> tuple[str | None, float | None, str | None]:
        price_node = card.select_one("p.card-text.card-primary")
        if not isinstance(price_node, Tag):
            return (None, None, None)

        raw_text = normalize_text(price_node.get_text(" ", strip=True))
        price_match = re.search(r"Price:\s*[^£]*£[\d,]+(?:\.\d+)?(?:\s*[A-Za-z/]+)?", raw_text)
        if price_match is not None:
            return parse_price(price_match.group(0))

        return parse_price(raw_text)

    def _extract_beds(self, card: Tag) -> int | None:
        price_node = card.select_one("p.card-text.card-primary")
        if not isinstance(price_node, Tag):
            return None

        html_fragment = str(price_node)
        match = re.search(
            r"<i[^>]*\bfa-bed\b[^>]*></i>\s*(\d+)",
            html_fragment,
            re.IGNORECASE,
        )
        if match is not None:
            return int(match.group(1))

        text = normalize_text(price_node.get_text(" ", strip=True))
        match = re.search(r"(\d+)\s*bed", text, re.IGNORECASE)
        if match is None:
            return None

        return int(match.group(1))
