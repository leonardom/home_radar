from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.fetcher import fetch_html
from scraper.models import Department, ListingRecord, utc_now_iso
from scraper.parser import normalize_text, parse_price
from scraper.sources.base import ListingSource


class DeanwoodSource(ListingSource):
    key = "deanwood"
    supported_departments: tuple[Department, ...] = ("sales", "lettings")

    _DEPARTMENT_PATHS = {
        "sales": "https://deanwood.im/search/department/residential-sales/",
        "lettings": "https://deanwood.im/search/department/residential-lettings/",
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
            page_url = self._DEPARTMENT_PATHS[department]
            pages_seen = 0
            while page_url and (max_pages is None or pages_seen < max_pages):
                html = fetch_html(page_url, timeout=timeout, user_agent=user_agent)
                parsed = self._parse_listings(html=html, department=department)
                listings.extend(parsed)
                page_url = self._extract_next_page(html)
                pages_seen += 1

        return listings

    def _parse_listings(self, html: str, department: Department) -> list[ListingRecord]:
        soup = BeautifulSoup(html, "html.parser")
        records: list[ListingRecord] = []

        for card in soup.select("div.card-layout-2.properties-block"):
            anchor = card.select_one("div.grid-box > a[href*='/property/']")
            if not isinstance(anchor, Tag):
                continue

            listing_url = normalize_text(anchor.get("href", ""))
            if not listing_url:
                continue

            title = self._extract_title(anchor)
            cover_image_url = self._extract_cover_image_url(anchor)
            region = self._extract_region(title)
            status = self._extract_status(anchor)
            price_raw, price_value, price_frequency = self._extract_price(anchor)
            beds, receptions, baths = self._extract_room_counts(anchor)
            property_type = self._extract_property_type(anchor)

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
                    property_type=property_type,
                    scraped_at=utc_now_iso(),
                )
            )

        return records

    def _extract_next_page(self, html: str) -> str | None:
        soup = BeautifulSoup(html, "html.parser")
        next_link = soup.select_one("a.next.page-numbers")
        if not isinstance(next_link, Tag):
            return None

        href = normalize_text(next_link.get("href", ""))
        if not href:
            return None

        return urljoin("https://deanwood.im", href)

    def _extract_title(self, container: Tag) -> str | None:
        title_node = container.select_one(".property-archive-title h4")
        if not isinstance(title_node, Tag):
            return None

        title = normalize_text(title_node.get_text(" ", strip=True))
        return title or None

    def _extract_cover_image_url(self, container: Tag) -> str | None:
        image_node = container.select_one(".grid-img img")
        if not isinstance(image_node, Tag):
            return None

        for attr in ("src", "data-src"):
            value = normalize_text(image_node.get(attr, ""))
            if value:
                return urljoin("https://deanwood.im", value)

        srcset = normalize_text(image_node.get("srcset", ""))
        if srcset:
            first_candidate = srcset.split(",")[0].strip().split(" ")[0]
            if first_candidate:
                return urljoin("https://deanwood.im", first_candidate)

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

    def _extract_status(self, container: Tag) -> str | None:
        status_node = container.select_one(".property-label")
        if isinstance(status_node, Tag):
            value = normalize_text(status_node.get_text(" ", strip=True))
            if value:
                return value

        desc_node = container.select_one("p.property-single-description")
        if isinstance(desc_node, Tag):
            desc = normalize_text(desc_node.get_text(" ", strip=True))
            if not desc:
                return None
            upper_desc = desc.upper()
            if upper_desc.endswith(" FOR SALE"):
                return "FOR SALE"
            if upper_desc.endswith(" TO LET"):
                return "TO LET"
            if "LET AGREED" in upper_desc:
                return "LET AGREED"
            return desc

        return None

    def _extract_price(self, container: Tag) -> tuple[str | None, float | None, str | None]:
        price_node = container.select_one(".property-archive-price")
        if not isinstance(price_node, Tag):
            return (None, None, None)

        return parse_price(price_node.get_text(" ", strip=True))

    def _extract_room_counts(self, container: Tag) -> tuple[int | None, int | None, int | None]:
        counts: dict[str, int] = {}
        for item in container.select("ul.property-types li"):
            type_node = item.select_one("span.bed, span.reception, span.bathrooms")
            if not isinstance(type_node, Tag):
                continue

            kind_classes = set(type_node.get("class", []))
            value_node = item.select_one("span")
            value_text = (
                normalize_text(value_node.get_text(" ", strip=True))
                if isinstance(value_node, Tag)
                else ""
            )
            try:
                value = int(value_text)
            except ValueError:
                continue

            if "bed" in kind_classes:
                counts["beds"] = value
            elif "reception" in kind_classes:
                counts["receptions"] = value
            elif "bathrooms" in kind_classes:
                counts["baths"] = value

        return (counts.get("beds"), counts.get("receptions"), counts.get("baths"))

    def _extract_property_type(self, container: Tag) -> str | None:
        desc_node = container.select_one("p.property-single-description")
        if not isinstance(desc_node, Tag):
            return None

        desc = normalize_text(desc_node.get_text(" ", strip=True))
        if not desc:
            return None

        upper = desc.upper()
        for suffix in (
            " FOR SALE",
            " TO LET",
            " LET AGREED",
            " SOLD STC",
            " UNDER OFFER",
            " LET",
        ):
            if upper.endswith(suffix):
                desc = normalize_text(desc[: -len(suffix)])
                upper = desc.upper()
                break

        if upper in {"LET", "TO LET", "LET AGREED", "FOR SALE", "SOLD STC", "UNDER OFFER"}:
            return None

        return desc or None
