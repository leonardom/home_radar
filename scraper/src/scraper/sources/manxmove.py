from __future__ import annotations

import re
import subprocess
from urllib.parse import parse_qs, urlencode, urljoin, urlparse

from bs4 import BeautifulSoup
from bs4.element import Tag

from scraper.fetcher import fetch_html
from scraper.models import Department, ListingRecord, utc_now_iso
from scraper.parser import normalize_text, parse_price
from scraper.sources.base import ListingSource


class ManxmoveSource(ListingSource):
    key = "manxmove"
    supported_departments: tuple[Department, ...] = ("sales", "lettings")

    _BASE_SEARCH_URL = "https://www.manxmove.im/search-list/"
    _INSTRUCTION_TYPES = {
        "sales": "sale",
        "lettings": "letting",
    }
    _FALLBACK_USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
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
            page_number = 1
            pages_seen = 0
            seen_urls_for_department: set[str] = set()

            while max_pages is None or pages_seen < max_pages:
                page_url = self._build_page_url(department, page_number)
                html = self._fetch_page(
                    page_url=page_url,
                    timeout=timeout,
                    user_agent=user_agent,
                )
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

                next_page = self._extract_next_page_number(html)
                if next_page is None:
                    break

                page_number = next_page
                pages_seen += 1

        return listings

    def _fetch_page(self, page_url: str, timeout: float, user_agent: str) -> str:
        try:
            return fetch_html(page_url, timeout=timeout, user_agent=user_agent)
        except Exception as exc:
            if "403" not in str(exc):
                raise

            try:
                return fetch_html(
                    page_url,
                    timeout=timeout,
                    user_agent=self._FALLBACK_USER_AGENT,
                )
            except Exception as fallback_exc:
                if "403" not in str(fallback_exc):
                    raise

                return self._fetch_with_curl(page_url=page_url, timeout=timeout)

    def _fetch_with_curl(self, page_url: str, timeout: float) -> str:
        timeout_seconds = max(1, int(timeout))
        result = subprocess.run(
            [
                "curl",
                "-L",
                "-s",
                "-A",
                self._FALLBACK_USER_AGENT,
                "--max-time",
                str(timeout_seconds),
                page_url,
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            stderr = normalize_text(result.stderr)
            raise RuntimeError(f"curl fetch failed: {stderr or result.returncode}")

        html = result.stdout
        if not normalize_text(html):
            raise RuntimeError("curl fetch returned empty response")

        return html

    def _build_page_url(self, department: Department, page_number: int) -> str:
        params = {
            "instruction_type": self._INSTRUCTION_TYPES[department],
            "showstc": "on",
            "paged": str(page_number),
        }
        return f"{self._BASE_SEARCH_URL}?{urlencode(params)}"

    def _parse_listings(self, html: str, department: Department) -> list[ListingRecord]:
        soup = BeautifulSoup(html, "html.parser")
        records: list[ListingRecord] = []

        for card in soup.select("div.property.list-property-card"):
            details_link = card.select_one("a.list__grid-image-parent[href]")
            if not isinstance(details_link, Tag):
                continue

            listing_url = normalize_text(details_link.get("href", ""))
            if not listing_url:
                continue
            listing_url = urljoin("https://www.manxmove.im", listing_url)

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

    def _extract_next_page_number(self, html: str) -> int | None:
        soup = BeautifulSoup(html, "html.parser")
        next_link = soup.select_one("ul.pagination a.page-link[aria-label='Next']")
        if not isinstance(next_link, Tag):
            return None

        href = normalize_text(next_link.get("href", ""))
        if not href:
            return None

        parsed = urlparse(urljoin("https://www.manxmove.im", href))
        paged_values = parse_qs(parsed.query).get("paged")
        if not paged_values:
            return None

        try:
            return int(paged_values[0])
        except ValueError:
            return None

    def _extract_title(self, card: Tag) -> str | None:
        title_node = card.select_one(".property__address")
        if not isinstance(title_node, Tag):
            return None

        title = normalize_text(title_node.get_text(" ", strip=True))
        return title or None

    def _extract_cover_image_url(self, card: Tag) -> str | None:
        image_node = card.select_one(".large__image img")
        if not isinstance(image_node, Tag):
            return None

        for attr in ("data-src", "src"):
            value = normalize_text(image_node.get(attr, ""))
            if value and not value.startswith("data:image"):
                return urljoin("https://www.manxmove.im", value)

        return None

    def _extract_region(self, title: str | None) -> str | None:
        if title is None:
            return None

        parts = [normalize_text(part) for part in title.split(",") if normalize_text(part)]
        if len(parts) < 2:
            return None

        for part in reversed(parts):
            upper = part.upper()
            if re.match(r"^IM\d", upper):
                continue
            if upper in {"ISLE OF MAN", "IOM"}:
                continue
            return part

        return None

    def _extract_status(self, card: Tag, department: Department) -> str | None:
        status_node = card.select_one(".status-banner")
        if isinstance(status_node, Tag):
            status = normalize_text(status_node.get_text(" ", strip=True))
            if status:
                return status

        return "FOR SALE" if department == "sales" else "TO LET"

    def _extract_price(self, card: Tag) -> tuple[str | None, float | None, str | None]:
        price_node = card.select_one(".property__price")
        if not isinstance(price_node, Tag):
            return (None, None, None)

        return parse_price(price_node.get_text(" ", strip=True))

    def _extract_room_counts(self, card: Tag) -> tuple[int | None, int | None, int | None]:
        beds: int | None = None
        receptions: int | None = None
        baths: int | None = None

        for room_item in card.select("ul.property__rooms li"):
            text_value = normalize_text(room_item.get_text(" ", strip=True))
            match = re.search(r"\d+", text_value)
            if match is None:
                continue

            value = int(match.group(0))
            class_list = " ".join(room_item.get("class", []))
            svg_node = room_item.select_one("svg")
            svg_class = ""
            if isinstance(svg_node, Tag):
                svg_class = " ".join(svg_node.get("class", []))

            combined = f"{class_list} {svg_class}".lower()
            if "icon__bed" in combined:
                beds = value
            elif "icon__reception" in combined:
                receptions = value
            elif "icon__bath" in combined:
                baths = value

        return (beds, receptions, baths)
