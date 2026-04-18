from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.fetcher import fetch_html
from scraper.models import Department, ListingRecord, utc_now_iso
from scraper.parser import normalize_text, parse_price
from scraper.sources.base import ListingSource


class BlackGraceCowleySource(ListingSource):
    key = "black_grace_cowley"
    supported_departments: tuple[Department, ...] = ("sales", "lettings")

    _DEPARTMENT_PATHS = {
        "sales": "https://www.blackgracecowley.com/buy-property/",
        "lettings": "https://www.blackgracecowley.com/let-property/",
    }

    def scrape(
        self,
        departments: list[Department],
        timeout: float,
        max_pages: int | None,
        user_agent: str,
    ) -> list[ListingRecord]:
        listings: list[ListingRecord] = []

        for department in departments:
            page_url: str | None = self._DEPARTMENT_PATHS[department]
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

        for card in soup.select("div.property"):
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

        current_page = 1
        current_node = soup.select_one("ul.pagination span.page-numbers.current")
        if isinstance(current_node, Tag):
            current_text = normalize_text(current_node.get_text(" ", strip=True))
            try:
                current_page = int(current_text)
            except ValueError:
                current_page = 1

        candidates: list[tuple[int, str]] = []
        for link in soup.select("ul.pagination a.page-numbers[href]"):
            if not isinstance(link, Tag):
                continue

            page_text = normalize_text(link.get_text(" ", strip=True))
            href = normalize_text(link.get("href", ""))
            if not href:
                continue

            try:
                page_number = int(page_text)
            except ValueError:
                continue

            candidates.append((page_number, urljoin("https://www.blackgracecowley.com", href)))

        if not candidates:
            return None

        later_pages = [item for item in candidates if item[0] > current_page]
        if later_pages:
            return min(later_pages, key=lambda item: item[0])[1]

        return None

    def _extract_listing_url(self, card: Tag) -> str | None:
        details_link = card.select_one(".property__feature-image a[href], a.btn.btn-primary[href]")
        if not isinstance(details_link, Tag):
            return None

        href = normalize_text(details_link.get("href", ""))
        if not href:
            return None

        return urljoin("https://www.blackgracecowley.com", href)

    def _extract_title(self, card: Tag) -> str | None:
        title_node = card.select_one("h3.display-4")
        if not isinstance(title_node, Tag):
            return None

        title = normalize_text(title_node.get_text(" ", strip=True))
        return title or None

    def _extract_cover_image_url(self, card: Tag) -> str | None:
        image_node = card.select_one(".property__feature-image img")
        if not isinstance(image_node, Tag):
            return None

        for attr in ("data-src", "src"):
            image = normalize_text(image_node.get(attr, ""))
            if image:
                return urljoin("https://www.blackgracecowley.com", image)

        return None

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
            return part

        return None

    def _extract_status(self, card: Tag, department: Department) -> str | None:
        status_node = card.select_one(".property__tooltip-holder .property__tooltip")
        if isinstance(status_node, Tag):
            status = normalize_text(status_node.get_text(" ", strip=True))
            if status:
                return status

        return "FOR SALE" if department == "sales" else "TO LET"

    def _extract_price(self, card: Tag) -> tuple[str | None, float | None, str | None]:
        price_node = card.select_one("p.display-4.color-primary")
        if not isinstance(price_node, Tag):
            return (None, None, None)

        return parse_price(price_node.get_text(" ", strip=True))

    def _extract_room_counts(self, card: Tag) -> tuple[int | None, int | None, int | None]:
        beds: int | None = None
        receptions: int | None = None
        baths: int | None = None

        for row in card.select("li.property__property-detail"):
            if not isinstance(row, Tag):
                continue

            labels = row.select("span")
            if len(labels) < 2:
                continue

            label_text = normalize_text(labels[0].get_text(" ", strip=True)).lower()
            value_text = normalize_text(labels[1].get_text(" ", strip=True))
            match = re.search(r"\d+", value_text)
            if match is None:
                continue

            value = int(match.group(0))
            if "bed" in label_text:
                beds = value
            elif "reception" in label_text:
                receptions = value
            elif "bath" in label_text:
                baths = value

        return (beds, receptions, baths)
