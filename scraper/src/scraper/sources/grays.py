from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.fetcher import fetch_html
from scraper.models import Department, ListingRecord, utc_now_iso
from scraper.parser import normalize_text, parse_price
from scraper.sources.base import ListingSource


class GraysSource(ListingSource):
    key = "grays"
    supported_departments: tuple[Department, ...] = ("sales", "lettings")

    _DEPARTMENT_URLS: dict[Department, str] = {
        "sales": "https://graysestateagents.com/listings?saleOrRental=Sale",
        "lettings": "https://graysestateagents.com/listings?saleOrRental=Rental",
    }
    _THOROUGHFARE_PATTERN = re.compile(
        r"\b(road|street|avenue|terrace|lane|drive|close|court|quay|crescent|park)\b",
        re.IGNORECASE,
    )

    def scrape(
        self,
        departments: list[Department],
        timeout: float,
        max_pages: int | None,
        user_agent: str,
    ) -> list[ListingRecord]:
        listings: list[ListingRecord] = []

        for department in departments:
            page_url: str | None = self._DEPARTMENT_URLS[department]
            pages_seen = 0
            seen_urls_for_department: set[str] = set()

            while page_url and (max_pages is None or pages_seen < max_pages):
                html = fetch_html(page_url, timeout=timeout, user_agent=user_agent)
                parsed = self._parse_listings(html=html, department=department)
                if not parsed:
                    break

                new_items = [
                    item
                    for item in parsed
                    if item.listing_url not in seen_urls_for_department
                ]
                if not new_items:
                    break

                listings.extend(new_items)
                seen_urls_for_department.update(item.listing_url for item in new_items)

                page_url = self._extract_next_page_url(html)
                pages_seen += 1

        return listings

    def _parse_listings(self, html: str, department: Department) -> list[ListingRecord]:
        soup = BeautifulSoup(html, "html.parser")
        records: list[ListingRecord] = []

        for card in soup.select("div.v2-flex.v2-flex-col.v2-relative.v2-gap-y-3"):
            listing_url = self._extract_listing_url(card)
            if listing_url is None:
                continue

            title = self._extract_title(card)
            cover_image_url = self._extract_cover_image_url(card)
            region = self._extract_region(title)
            status = self._extract_status(card, department)
            price_raw, price_value, price_frequency = self._extract_price(card)
            beds, receptions, baths = self._extract_room_counts(card)

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
                    receptions=receptions,
                    baths=baths,
                    property_type=None,
                    scraped_at=utc_now_iso(),
                )
            )

        return records

    def _extract_next_page_url(self, html: str) -> str | None:
        soup = BeautifulSoup(html, "html.parser")
        next_link = soup.select_one("a[rel='next'][href]")
        if not isinstance(next_link, Tag):
            return None

        href = normalize_text(next_link.get("href", ""))
        if not href:
            return None

        return urljoin("https://graysestateagents.com", href)

    def _extract_listing_url(self, card: Tag) -> str | None:
        link = card.select_one("a[href^='/listings/']")
        if not isinstance(link, Tag):
            return None

        href = normalize_text(link.get("href", ""))
        if not href:
            return None

        return urljoin("https://graysestateagents.com", href)

    def _extract_title(self, card: Tag) -> str | None:
        title_node = card.select_one("h4")
        if not isinstance(title_node, Tag):
            return None

        title = normalize_text(title_node.get_text(" ", strip=True))
        return title or None

    def _extract_cover_image_url(self, card: Tag) -> str | None:
        image_node = card.select_one("img[data-testid='shared-image-component']")
        if not isinstance(image_node, Tag):
            return None

        image_src = normalize_text(image_node.get("src", ""))
        if not image_src:
            return None

        return urljoin("https://graysestateagents.com", image_src)

    def _extract_region(self, title: str | None) -> str | None:
        if title is None:
            return None

        parts = [normalize_text(part) for part in title.split(",") if normalize_text(part)]
        if len(parts) < 2:
            return None

        for part in reversed(parts):
            upper = part.upper()
            if upper in {"ISLE OF MAN", "IOM"}:
                continue
            if re.match(r"^IM\d", upper):
                continue
            if self._THOROUGHFARE_PATTERN.search(part):
                continue

            part_without_postcode = re.sub(r"\bIM\d.*$", "", part, flags=re.IGNORECASE)
            cleaned = normalize_text(part_without_postcode)
            if cleaned and not self._THOROUGHFARE_PATTERN.search(cleaned):
                return cleaned
            return part

        return None

    def _extract_status(self, card: Tag, department: Department) -> str | None:
        banner = card.select_one("[class*='property-banner']")
        if isinstance(banner, Tag):
            status = normalize_text(banner.get_text(" ", strip=True))
            if status:
                return status

        return "FOR SALE" if department == "sales" else "TO LET"

    def _extract_price(self, card: Tag) -> tuple[str | None, float | None, str | None]:
        price_node = card.select_one("strong.v2-text-primary-500")
        if not isinstance(price_node, Tag):
            return (None, None, None)

        return parse_price(price_node.get_text(" ", strip=True))

    def _extract_room_counts(self, card: Tag) -> tuple[int | None, int | None, int | None]:
        beds: int | None = None
        receptions: int | None = None
        baths: int | None = None

        for stat in card.select("p.v2-text-body-small"):
            if not isinstance(stat, Tag):
                continue

            label = normalize_text(stat.get_text(" ", strip=True))
            match = re.search(r"(\d+)\s*([A-Za-z]+)", label)
            if match is None:
                continue

            value = int(match.group(1))
            stat_type = match.group(2).lower()
            if stat_type.startswith("bed"):
                beds = value
            elif stat_type.startswith("bath"):
                baths = value
            elif stat_type.startswith("lounge"):
                receptions = value

        return (beds, receptions, baths)
